import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Task, Document, Category } from '../types';
import { AlertCircle, Calendar, Clock, ChevronRight, Search, Filter, CheckCircle2, FolderOpen, Settings, Plus, Sparkles, Download } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { userProfile, isAdminOrManager } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

      {/* Quick Access Categories */}
      <div className="space-y-5">
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
              [...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white/50 rounded-2xl animate-pulse border border-white"></div>)
           ) : categories.length === 0 ? (
              <div className="col-span-full py-8 text-slate-500 text-sm glass rounded-2xl text-center font-medium">Chưa có danh mục nào được khởi tạo.</div>
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
                  className="glass glass-hover rounded-2xl p-6 flex flex-col gap-4 group relative overflow-hidden h-full"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* Left: Urgent Tasks */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-500" /> CÔNG VIỆC CẦN LÀM
            </h2>
            <Link to="/tasks" className="text-xs font-bold text-brand-600 hover:text-brand-700 px-3 py-1 bg-brand-50 rounded-full transition-all">
              Tất cả
            </Link>
          </div>
          
          <div className="glass rounded-3xl overflow-hidden shadow-xl border-white/60">
             {tasks.length === 0 && !loading ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-slate-800 font-display font-bold text-lg">Hoàn thành xuất sắc!</h3>
                  <p className="text-slate-500 text-sm mt-1">Danh sách công việc của bạn trống trơn.</p>
                </div>
             ) : (
                <div className="flex flex-col divide-y divide-slate-100">
                  {tasks.map(task => {
                    const isOverdue = new Date(task.deadline) < new Date() && task.status !== 'completed';
                    return (
                      <div key={task.id} className={cn(
                        "p-5 flex gap-4 transition-all duration-300 group",
                        isOverdue ? "bg-rose-50/40" : "hover:bg-white/60"
                      )}>
                        <div className="flex-shrink-0 mt-1">
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full mt-1.5 shadow-sm",
                            task.priority === 'high' ? "bg-rose-500 animate-pulse" : 
                            task.priority === 'medium' ? "bg-amber-400" : "bg-brand-400"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2">
                            <h3 className="text-[15px] font-bold text-slate-800 group-hover:text-brand-600 transition-colors truncate">{task.title}</h3>
                            <div className={cn(
                              "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                              isOverdue ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
                            )}>
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.deadline)}
                            </div>
                          </div>
                          <p className="text-sm text-slate-500 mt-1.5 line-clamp-1 font-medium">{task.description}</p>
                        </div>
                        <div className="hidden sm:flex items-center">
                           <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-400 transition-colors" />
                        </div>
                      </div>
                    );
                  })}
                </div>
             )}
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
               <div className="glass p-8 rounded-3xl text-center text-slate-500 text-sm font-medium">
                 Chưa có tin tức nào mới.
               </div>
            ) : docs.slice(0, 3).map(doc => (
              <motion.div 
                whileHover={{ x: 5 }}
                key={doc.id} 
                className="glass glass-hover p-5 rounded-2xl flex items-start gap-4"
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
    </div>
  );
}

