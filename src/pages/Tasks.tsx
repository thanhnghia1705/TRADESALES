import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Task, User } from '../types';
import { CheckCircle2, Circle, Filter, AlertCircle, Plus, X, Search, MoreVertical, Trash2, Pencil, ChevronRight, Clock, Paperclip, Calendar } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Tasks() {
  const { userProfile, isAdminOrManager } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create task states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    deadline: new Date().toISOString().slice(0, 10),
    priority: 'medium',
    assigneeIds: [],
    status: 'pending',
    links: []
  });

  const handleAddLink = () => {
    setNewTask(prev => ({ ...prev, links: [...(prev.links || []), ''] }));
  };

  const handleUpdateLink = (index: number, value: string) => {
    setNewTask(prev => {
      const newLinks = [...(prev.links || [])];
      newLinks[index] = value;
      return { ...prev, links: newLinks };
    });
  };

  const handleRemoveLink = (index: number) => {
    setNewTask(prev => {
      const newLinks = [...(prev.links || [])];
      newLinks.splice(index, 1);
      return { ...prev, links: newLinks };
    });
  };

  useEffect(() => {
    if (!userProfile) return;

    // Load all tasks (If real app, might want to limit or filter by current month)
    const taskQuery = query(collection(db, 'tasks'), orderBy('deadline', 'asc'));

    const unsub = onSnapshot(taskQuery, (snap) => {
      const fetchedTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      
      // Client side filtering for sales view (since array-contains OR isn't natively supported easily without multiple queries, 
      // and we want sales to see ONLY their tasks. If admin, they see all)
      if (isAdminOrManager) {
        setTasks(fetchedTasks);
      } else {
        setTasks(fetchedTasks.filter(t => t.assigneeIds.includes(userProfile.id)));
      }
      setLoading(false);
    });

    if (isAdminOrManager) {
       getDocs(collection(db, 'users')).then(snap => {
          setUsers(snap.docs.map(d => ({id: d.id, ...d.data()} as User)));
       });
    }

    return () => unsub();
  }, [userProfile, isAdminOrManager]);

  const toggleTaskStatus = async (task: Task) => {
    // Only allow toggle if assignee or Admin/Manager
    if (!isAdminOrManager && !task.assigneeIds.includes(userProfile?.id || '')) return;

    const newStatus = task.status === 'completed' ? 'in-progress' : 'completed';
    try {
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId === taskId) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
        setDeletingId(null);
      } catch (err) {
        console.error('Error deleting task:', err);
        alert('Có lỗi xảy ra khi xóa công việc.');
      }
    } else {
      setDeletingId(taskId);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || newTask.assigneeIds?.length === 0) {
       alert("Vui lòng nhập tên công việc và chọn ít nhất 1 người được giao.");
       return;
    }
    
    try {
      if (isEditing && editingId) {
        await updateDoc(doc(db, 'tasks', editingId), {
           title: newTask.title,
           description: newTask.description || '',
           deadline: newTask.deadline,
           priority: newTask.priority,
           assigneeIds: newTask.assigneeIds,
           links: newTask.links || [],
           updatedAt: new Date().toISOString(),
        });
      } else {
        await addDoc(collection(db, 'tasks'), {
          ...newTask,
          createdBy: userProfile?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      setNewTask({
        title: '',
        description: '',
        deadline: new Date().toISOString().slice(0, 10),
        priority: 'medium',
        assigneeIds: [],
        status: 'pending',
        links: []
      });
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi lưu việc!');
    }
  };

  const handleEditClick = (task: Task) => {
    setNewTask({
      title: task.title,
      description: task.description || '',
      deadline: task.deadline,
      priority: task.priority,
      assigneeIds: task.assigneeIds || [],
      status: task.status,
      links: task.links || []
    });
    setEditingId(task.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setNewTask({
      title: '',
      description: '',
      deadline: new Date().toISOString().slice(0, 10),
      priority: 'medium',
      assigneeIds: [],
      status: 'pending',
      links: []
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-display font-black text-slate-800 tracking-tight">KẾ HOẠCH & TIẾN ĐỘ</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Theo dõi, báo cáo và quản lý các đầu việc được giao phó.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-3 glass glass-hover text-slate-700 text-[13px] font-bold rounded-2xl">
            <Filter className="w-4 h-4" /> Lọc kết quả
          </button>
          {isAdminOrManager && (
            <button 
              onClick={() => {
                setIsEditing(false);
                setEditingId(null);
                setNewTask({
                  title: '',
                  description: '',
                  deadline: new Date().toISOString().slice(0, 10),
                  priority: 'medium',
                  assigneeIds: [],
                  status: 'pending',
                  links: []
                });
                setShowModal(true);
              }}
              className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-3 bg-brand-600 text-white text-[13px] font-bold rounded-2xl hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Giao việc mới
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
           <p className="text-slate-500 font-medium">Đang tải danh sách công việc...</p>
        </div>
      ) : (
        <div className="glass rounded-3xl overflow-hidden shadow-xl border-white/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="bg-white/40 border-b border-white/60 text-slate-400 font-black uppercase tracking-widest text-[11px]">
                  <th className="px-6 py-5 w-16"></th>
                  <th className="px-6 py-5 min-w-[300px]">Nội dung công việc</th>
                  <th className="px-6 py-5 w-40">Thời hạn (Deadline)</th>
                  <th className="px-6 py-5 w-32">Mức độ</th>
                  <th className="px-6 py-5 w-40 text-center">Trạng thái</th>
                  <th className="px-6 py-5 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {tasks.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold italic">Chưa có đầu việc nào được phân công.</td></tr>
                )}
                {tasks.map((task, index) => {
                  const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
                  const isCompleted = task.status === 'completed';
                  const canDelete = isAdminOrManager;
                  
                  return (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={task.id} 
                      className={cn(
                        "transition-all group", 
                        isCompleted ? "opacity-60 grayscale-[0.3]" : "hover:bg-white/50"
                      )}
                    >
                      <td className="px-6 py-5">
                        <button 
                          onClick={() => toggleTaskStatus(task)}
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300",
                            isCompleted 
                              ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-110" 
                              : "glass bg-white text-slate-300 hover:text-brand-500 hover:scale-110"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div className={cn("font-bold transition-all", isCompleted ? "text-slate-400 line-through" : "text-slate-800 group-hover:text-brand-600")}>
                          {task.title}
                        </div>
                        <div className="text-[13px] text-slate-500 line-clamp-1 mt-1 font-medium opacity-70">{task.description}</div>
                        {(task.links && task.links.length > 0) && (
                          <div className="flex flex-wrap gap-2 mt-2">
                             {task.links.filter(l => l.trim() !== '').map((link, idx) => (
                                <a 
                                  key={idx} 
                                  href={link} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 text-[11px] font-bold rounded-lg border border-brand-100/50 transition-colors"
                                >
                                  <Paperclip className="w-3 h-3" />
                                  Link đính kèm {idx + 1}
                                </a>
                             ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className={cn(
                          "flex items-center gap-1.5 font-bold tabular-nums", 
                          isOverdue ? "text-rose-600 animate-pulse" : "text-slate-600"
                        )}>
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(task.deadline)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm border",
                          task.priority === 'high' ? "bg-rose-50 border-rose-100 text-rose-600" : 
                          task.priority === 'medium' ? "bg-amber-50 border-amber-100 text-amber-600" : 
                          "bg-brand-50 border-brand-100 text-brand-600"
                        )}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={cn(
                          "text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-2xl shadow-sm inline-block min-w-[100px]",
                          isCompleted ? "bg-emerald-500 text-white" :
                          task.status === 'in-progress' ? "bg-brand-100/50 text-brand-700" :
                          isOverdue ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-500"
                        )}>
                          {isOverdue ? 'Quá hạn' : isCompleted ? 'Hoàn tất' : task.status === 'in-progress' ? 'Đang làm' : 'Chưa làm'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right flex items-center justify-end gap-1">
                        {canDelete && (
                           <button
                             onClick={(e) => { e.stopPropagation(); handleEditClick(task); }}
                             className="p-2 rounded-xl text-slate-300 hover:text-brand-600 hover:bg-brand-50 transition-all md:opacity-0 md:group-hover:opacity-100"
                             title="Chỉnh sửa công việc"
                           >
                              <Pencil className="w-5 h-5" />
                           </button>
                        )}
                        {canDelete && (
                           <button
                             onClick={(e) => handleDeleteTask(task.id, e)}
                             className={cn(
                               "p-2 rounded-xl transition-all",
                               deletingId === task.id ? "bg-rose-500 text-white" : "text-slate-300 hover:text-rose-600 hover:bg-rose-50 md:opacity-0 md:group-hover:opacity-100"
                             )}
                             title={deletingId === task.id ? "Nhấn lần nữa để xóa" : "Xóa công việc"}
                           >
                              <Trash2 className="w-5 h-5" />
                           </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.form 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              onSubmit={handleCreateTask} 
              className="bg-brand-50 rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden relative z-10 border border-white"
            >
              <div className="px-8 py-6 border-b border-white/60 flex justify-between items-center bg-white/40">
                <div>
                  <h3 className="font-display font-black text-xl text-slate-800 uppercase tracking-tight">{isEditing ? 'Chỉnh sửa công việc' : 'Giao việc mới'}</h3>
                  <p className="text-xs text-slate-500 font-bold opacity-70">{isEditing ? 'Cập nhật nội dung và phân công' : 'Phân công nhiệm vụ cho đội ngũ'}</p>
                </div>
                <button type="button" onClick={handleCloseModal} className="w-10 h-10 glass rounded-full flex items-center justify-center text-slate-400 hover:bg-white hover:text-slate-600 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tên công việc <span className="text-rose-500">*</span></label>
                    <input 
                      required
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                      className="w-full px-5 py-3.5 bg-white border border-white rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm transition-all font-bold text-slate-700 placeholder:font-medium"
                      placeholder="Mô tả ngắn gọn đầu việc..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Chi tiết công việc</label>
                    <textarea 
                      value={newTask.description}
                      onChange={e => setNewTask({...newTask, description: e.target.value})}
                      className="w-full px-5 py-3.5 bg-white border border-white rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm transition-all font-medium text-slate-600 min-h-[100px] resize-none"
                      placeholder="Các yêu cầu cụ thể và ghi chú..."
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2 ml-1">
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Liên kết đính kèm</label>
                      <button type="button" onClick={handleAddLink} className="text-[11px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Thêm link
                      </button>
                    </div>
                    {(!newTask.links || newTask.links.length === 0) ? (
                      <div className="text-[13px] text-slate-400 italic bg-white/50 border border-white rounded-2xl px-5 py-3.5 text-center">
                        Chưa có liên kết nào (tuỳ chọn)
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {newTask.links.map((link, index) => (
                           <div key={index} className="flex gap-2 isolate relative group">
                              <div className="absolute top-1/2 left-4 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
                                <Paperclip className="w-4 h-4 text-slate-400" />
                              </div>
                              <input 
                                type="url"
                                value={link}
                                onChange={e => handleUpdateLink(index, e.target.value)}
                                className="w-full pl-11 pr-5 py-3 bg-white border border-white rounded-xl outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm transition-all font-medium text-slate-600 text-sm"
                                placeholder="https://..."
                              />
                              <button type="button" onClick={() => handleRemoveLink(index)} className="w-11 shrink-0 bg-white border border-white rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Thời hạn <span className="text-rose-500">*</span></label>
                      <input 
                        type="date"
                        required
                        value={newTask.deadline}
                        onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                        className="w-full px-5 py-3.5 bg-white border border-white rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm transition-all font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Mức độ ưu tiên</label>
                      <select 
                        value={newTask.priority}
                        onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                        className="w-full px-5 py-3.5 bg-white border border-white rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm transition-all font-bold text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M2.5%204.5l3.5%203.5%203.5-3.5z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_16px_center] bg-no-repeat"
                      >
                        <option value="low">Thông thường</option>
                        <option value="medium">Ưu tiên trung bình</option>
                        <option value="high">Rất khẩn cấp</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Giao cho nhân viên <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <select 
                        multiple
                        required
                        value={newTask.assigneeIds}
                        onChange={e => {
                           const options = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                           setNewTask({...newTask, assigneeIds: options});
                        }}
                        className="w-full px-5 py-3.5 bg-white border border-white rounded-2xl outline-none focus:ring-4 focus:ring-brand-500/10 shadow-sm transition-all font-bold text-slate-700 h-32 scrollbar-hide"
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id} className="py-2 px-1 hover:bg-brand-50 rounded-lg">{u.name} - {u.role}</option>
                        ))}
                      </select>
                      <div className="absolute top-2 right-2 px-2 py-1 bg-brand-100 text-brand-600 text-[10px] font-black rounded-lg pointer-events-none">Ctrl/Cmd + Click</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-8 py-6 bg-white/40 border-t border-white/60 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3 font-bold text-slate-500 hover:bg-white rounded-2xl transition-all">Hủy bỏ</button>
                <button type="submit" className="px-8 py-3 bg-brand-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-brand-700 shadow-xl shadow-brand-600/20 transition-all hover:scale-105">{isEditing ? 'Lưu thay đổi' : 'Xác nhận giao việc'}</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

}

