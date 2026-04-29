import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Task, Document, Category } from '../types';
import { AlertCircle, Calendar, Clock, ChevronRight, Search, Filter, CheckCircle2, FolderOpen, Settings, Plus, Sparkles, Download, Trash2, Paperclip } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { userProfile, isAdminOrManager } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!userProfile) return;

    // Fetch tasks
    let taskQuery;
    if (isAdminOrManager) {
      taskQuery = query(collection(db, 'tasks'), orderBy('deadline', 'asc'), limit(5));
    } else {
      taskQuery = query(collection(db, 'tasks'), where('assigneeIds', 'array-contains', userProfile.id), orderBy('deadline', 'asc'), limit(5));
    }

    const unsubTasks = onSnapshot(taskQuery, (snap) => {
      const fetchedTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(fetchedTasks);
    });

    // Fetch categories for Quick Access
    const catQuery = query(collection(db, 'categories'), where('type', '==', 'main'), orderBy('order', 'asc'), limit(8));
    const unsubCat = onSnapshot(catQuery, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      setLoading(false);
    });

    // Fetch docs
    const docQuery = query(collection(db, 'documents'), where('status', 'in', ['new', 'active', 'urgent']), orderBy('publishDate', 'desc'), limit(5));
    const unsubDocs = onSnapshot(docQuery, (snap) => {
      const fetchedDocs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document));
      setDocs(fetchedDocs);
    });

    return () => {
      unsubTasks();
      unsubCat();
      unsubDocs();
    };
  }, [userProfile, isAdminOrManager]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent': return 'bg-rose-100 text-rose-700';
      case 'new': return 'bg-emerald-100 text-emerald-700';
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'expired': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };
  
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 11) {
      setGreeting('Chào buổi sáng');
    } else if (hour >= 11 && hour < 14) {
      setGreeting('Chào buổi trưa');
    } else if (hour >= 14 && hour < 18) {
      setGreeting('Chào buổi chiều');
    } else {
      setGreeting('Chào buổi tối');
    }
  }, []);

  const incompleteTasksCount = tasks.filter(t => t.status !== 'completed').length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchQuery.trim())}`);
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

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Quick Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 md:p-3 relative z-20">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm nhanh tài liệu, CTKM, hợp đồng..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 font-medium text-[15px]"
          />
          <button type="submit" className="hidden md:block absolute right-2 px-6 py-2 bg-brand-50 text-brand-600 font-bold text-sm rounded-xl hover:bg-brand-100 transition-colors">Tìm kiếm</button>
        </form>
      </div>

      {/* Top Alert / Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-500 to-indigo-500 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between shadow-lg gap-6 relative overflow-hidden transition-colors duration-500"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-white drop-shadow-md">
            {greeting}, {userProfile?.name}! {greeting.includes('sáng') ? '☀️' : greeting.includes('trưa') ? '🍲' : greeting.includes('chiều') ? '☕' : '🌙'}
          </h1>
          <p className="text-white/80 text-sm md:text-base font-medium mt-2">
            {incompleteTasksCount > 0 
              ? `Hôm nay bạn có ${incompleteTasksCount} đầu việc quan trọng cần ưu tiên.`
              : 'Tuyệt vời! Bạn đã hoàn thành hết các công việc quan trọng.'}
          </p>
        </div>
        {isAdminOrManager && (
          <Link to="/documents/new" className="relative z-10 bg-white text-red-600 px-6 py-3 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all shadow-xl hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo Thông Báo Mới
          </Link>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* Left: Urgent Tasks */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-2 border-rose-100 overflow-hidden flex flex-col h-full relative isolate">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500"></div>
            
            <div className="px-8 py-7 flex items-center justify-between border-b border-slate-100/60 bg-gradient-to-b from-rose-50/30 to-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center shadow-inner">
                  <Clock className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-black text-slate-800 tracking-tight flex items-center gap-2">
                    CÔNG VIỆC/DEADLINE 
                    {incompleteTasksCount > 0 && <span className="px-2.5 py-0.5 bg-rose-500 text-white text-sm rounded-full shadow-sm">{incompleteTasksCount}</span>}
                  </h2>
                  <p className="text-[13px] text-slate-500 font-bold mt-0.5">
                    {incompleteTasksCount > 0 ? (
                      <span className="text-rose-600 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Bạn đang có {incompleteTasksCount} việc ưu tiên</span>
                    ) : 'Không có công việc nào đang chờ'}
                  </p>
                </div>
              </div>
              <Link to="/tasks" className="text-[13px] font-bold text-brand-600 hover:text-white px-5 py-2.5 bg-brand-50 hover:bg-brand-600 rounded-xl transition-all shadow-sm">
                Xem tất cả
              </Link>
            </div>
            
            <div className="p-6 flex-1 bg-slate-50/30">
               {tasks.length === 0 && !loading ? (
                  <div className="py-12 px-6 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-slate-800 font-display font-bold text-lg">Hoàn thành xuất sắc!</h3>
                    <p className="text-slate-500 text-sm mt-1">Danh sách công việc của bạn trống trơn.</p>
                  </div>
               ) : (
                  <div className="flex flex-col gap-4">
                    {tasks.slice(0, 3).map((task, index) => {
                      const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
                      const isToday = new Date(task.deadline).toDateString() === new Date().toDateString();
                      const isTopTask = index === 0;
                      // Allow deletion if admin/manager or if it's the creator
                      const canDelete = isAdminOrManager;

                      let badgeText = "Sắp tới";
                      let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                      
                      if (isOverdue) {
                        badgeText = "Quá hạn";
                        badgeColor = "bg-rose-100 text-rose-700 border-rose-200";
                      } else if (isToday) {
                        badgeText = "Hôm nay";
                        badgeColor = "bg-orange-100 text-orange-700 border-orange-200";
                      } else if (task.priority === 'high') {
                        badgeText = "Gấp";
                        badgeColor = "bg-amber-100 text-amber-700 border-amber-200";
                      }
                      
                      return (
                        <div key={task.id} className={cn(
                          "relative rounded-2xl p-5 flex gap-5 transition-all duration-300 group border",
                          isTopTask 
                            ? "bg-white shadow-[0_4px_20px_rgb(0,0,0,0.04)] border-rose-100/80 hover:border-rose-200" 
                            : "bg-white shadow-sm border-slate-100 hover:border-brand-200 hover:shadow-md",
                          isOverdue && isTopTask ? "ring-1 ring-rose-200" : ""
                        )}>
                          {/* Glow effect for top task if priority or overdue */}
                          {isTopTask && (isOverdue || task.priority === 'high' || isToday) && (
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-400 to-amber-400 rounded-[18px] blur opacity-15 pointer-events-none animate-pulse"></div>
                          )}
                          
                          <div className="relative flex-shrink-0 mt-1">
                            <div className={cn(
                              "w-3.5 h-3.5 rounded-full mt-1 outline outline-4 outline-white shadow-sm",
                              task.priority === 'high' ? "bg-rose-500 animate-pulse" : 
                              task.priority === 'medium' ? "bg-amber-400" : "bg-brand-400"
                            )} />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-4 relative">
                            <div className="flex flex-col xl:flex-row xl:justify-between items-start xl:items-center gap-3">
                              <h3 className={cn(
                                "font-display font-bold text-slate-800 transition-colors truncate max-w-full",
                                isTopTask ? "text-[17px]" : "text-[15px] group-hover:text-brand-600"
                              )} title={task.title}>{task.title}</h3>
                              
                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border", badgeColor)}>
                                  {badgeText}
                                </span>
                                <div className={cn(
                                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                                  isOverdue ? "bg-rose-50 border-rose-100 text-rose-600" : 
                                  isToday ? "bg-orange-50 border-orange-100 text-orange-600" : "bg-slate-50 border-slate-200 text-slate-500"
                                )}>
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(task.deadline)}
                                </div>
                              </div>
                            </div>
                            
                            {task.description && (
                              <p className={cn(
                                "text-slate-500 mt-2 line-clamp-2 font-medium",
                                isTopTask ? "text-[14px]" : "text-xs"
                              )}>{task.description}</p>
                            )}
                            
                            {(task.links && task.links.length > 0) && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                 {task.links.filter(l => l.trim() !== '').map((link, idx) => (
                                    <a 
                                      key={idx} 
                                      href={link} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded-lg transition-colors border border-slate-200/60 leading-none"
                                    >
                                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate max-w-[150px]">Link đính kèm {idx + 1}</span>
                                    </a>
                                 ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col xl:flex-row justify-start xl:justify-center items-center gap-2 relative z-10 shrink-0">
                             {canDelete && (
                               <button
                                 onClick={(e) => handleDeleteTask(task.id, e)}
                                 className={cn(
                                   "p-2.5 rounded-xl transition-all",
                                   deletingId === task.id ? "bg-rose-500 text-white shadow-md" : "text-slate-300 hover:text-rose-600 hover:bg-rose-50 bg-white shadow-sm border border-slate-100 md:opacity-0 md:group-hover:opacity-100"
                                 )}
                                 title={deletingId === task.id ? "Nhấn lần nữa để xóa" : "Xóa công việc"}
                               >
                                  <Trash2 className="w-4 h-4" />
                               </button>
                             )}
                             <Link to="/tasks" className="p-2.5 bg-white shadow-sm border border-slate-100 text-slate-300 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-100 rounded-xl transition-all" title="Xem chi tiết tại trang Danh sách">
                               <ChevronRight className="w-4 h-4" />
                             </Link>
                          </div>
                        </div>
                      );
                    })}
                    {tasks.length > 3 && (
                      <div className="pt-2">
                        <Link to="/tasks" className="block w-full py-3.5 bg-white border border-brand-200 border-dashed rounded-2xl text-center text-sm font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50 transition-all">
                          Xem thêm {tasks.length - 3} công việc khác
                        </Link>
                      </div>
                    )}
                  </div>
               )}
            </div>
          </div>
        </div>

        {/* Right: Programs */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> THÔNG BÁO MỚI
            </h2>
            <Link to="/documents" className="text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-1 bg-brand-50 rounded-full transition-all">
              Xem thêm
            </Link>
          </div>
          
          <div className="space-y-4">
            {docs.length === 0 && !loading ? (
               <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center text-slate-500 text-sm font-medium shadow-sm">
                 Chưa có tin tức nào mới.
               </div>
            ) : docs.slice(0, 3).map(doc => (
              <motion.div 
                whileHover={{ x: 5 }}
                key={doc.id} 
                className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md p-5 rounded-2xl flex items-start gap-4 transition-all"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner",
                  doc.type === 'word' ? "bg-brand-50 text-brand-600" :
                  doc.type === 'excel' ? "bg-emerald-50 text-emerald-600" :
                  "bg-indigo-50 text-indigo-600"
                )}>
                  {doc.type === 'word' ? '📄' : doc.type === 'excel' ? '📊' : '🎯'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                      doc.status === 'urgent' ? "bg-rose-100 text-rose-600" : 
                      doc.status === 'new' ? "bg-brand-100 text-brand-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {doc.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{formatDate(doc.publishDate || doc.createdAt)}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1 hover:text-brand-600 transition-colors">
                    <Link to={`/documents/${doc.id}`}>{doc.title}</Link>
                  </h3>
                  {doc.fileUrl && (
                    <div className="mt-3 flex items-center gap-3">
                      <a 
                        href={doc.fileUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        download
                        className="text-[11px] font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                      >
                        Tải xuống tài liệu <Download className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Access Categories */}
      <div className="space-y-5 pt-4">
         <div className="flex items-center justify-between px-2">
           <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-brand-500" /> DANH MỤC TRUY CẬP NHANH
           </h2>
           {isAdminOrManager && (
             <Link to="/admin/categories" className="text-xs font-bold text-brand-500 hover:text-brand-700 flex items-center gap-1 transition-colors">
               <Settings className="w-3.5 h-3.5" /> Chỉnh sửa
             </Link>
           )}
         </div>
         <motion.div 
           initial="hidden"
           animate="show"
           variants={{
             hidden: { opacity: 0 },
             show: { opacity: 1, transition: { staggerChildren: 0.1 } }
           }}
           className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
         >
           {loading ? (
              [...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-200"></div>)
           ) : categories.length === 0 ? (
              <div className="col-span-full py-8 text-slate-500 text-sm bg-white border border-slate-200 rounded-2xl text-center font-medium shadow-sm">Chưa có danh mục nào được khởi tạo.</div>
           ) : categories.map((cat, idx) => (
             <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.95 },
                  show: { opacity: 1, y: 0, scale: 1 }
                }}
                key={cat.id} 
                className="h-full"
             >
               <Link 
                  to="/documents"
                  className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-2xl p-6 flex flex-col gap-4 group relative overflow-hidden h-full transition-all"
               >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:rotate-12",
                    idx % 4 === 0 ? "bg-amber-100 text-amber-600 shadow-inner" :
                    idx % 4 === 1 ? "bg-brand-100 text-brand-600 shadow-inner" :
                    idx % 4 === 2 ? "bg-emerald-100 text-emerald-600 shadow-inner" :
                    "bg-indigo-100 text-indigo-600 shadow-inner"
                  )}>
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-800 group-hover:text-brand-600 transition-colors line-clamp-1 mb-1">{cat.title}</h3>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                      Khám phá ngay <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </p>
                  </div>
               </Link>
             </motion.div>
           ))}
         </motion.div>
      </div>

    </div>
  );
}
