import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Document, Category } from '../types';
import { FileText, FileSpreadsheet, Image as ImageIcon, Link as LinkIcon, Search, Filter, Folder, ChevronRight, Download, Plus, Pencil, Trash2 } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { deleteDoc, doc, collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';

export default function Documents() {
  const { userProfile, isAdminOrManager } = useAuth();
  const [docs, setDocs] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch categories
    const catQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubCat = onSnapshot(catQuery, (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    // Fetch docs
    const docQuery = query(collection(db, 'documents'), orderBy('publishDate', 'desc'));
    const unsubDoc = onSnapshot(docQuery, (snap) => {
      setDocs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Document)));
      setLoading(false);
    });

    return () => {
      unsubCat();
      unsubDoc();
    };
  }, []);

  const handleDeleteDoc = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác.')) {
      try {
        await deleteDoc(doc(db, 'documents', docId));
      } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi xóa tài liệu.');
      }
    }
  };

  const filteredDocs = activeCategory 
    ? docs.filter(d => d.categoryId === activeCategory || d.subcategoryId === activeCategory)
    : docs;

  const mainCategories = categories.filter(c => c.type === 'main');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'word': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-amber-500" />;
      case 'link': return <LinkIcon className="w-5 h-5 text-sky-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
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

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-10">
      {/* Sidebar Categories */}
      <div className="w-full lg:w-72 shrink-0 space-y-6">
        <div className="sticky top-24">
          <h2 className="font-display font-black text-slate-800 px-2 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
            <Folder className="w-5 h-5 text-brand-500" /> THƯ VIỆC TÀI LIỆU
          </h2>
          <div className="flex overflow-x-auto lg:flex-col lg:overflow-visible gap-2 pb-2 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "whitespace-nowrap px-4 py-3 text-[13px] font-bold rounded-2xl transition-all text-left",
                activeCategory === null ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-slate-600 hover:bg-white/60 hover:text-brand-600"
              )}
            >
              Tất cả tài liệu
            </button>
            {mainCategories.map(cat => {
              const subCats = categories.filter(c => c.parentId === cat.id);
              const isActive = activeCategory === cat.id;
              return (
                <div key={cat.id} className="flex flex-col gap-1">
                  <button
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-[13px] font-bold rounded-2xl transition-all text-left",
                      isActive ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-slate-600 hover:bg-white/60 hover:text-brand-600"
                    )}
                  >
                    {cat.title}
                  </button>
                  {/* Subcategories (Desktop) */}
                  <div className="hidden lg:flex flex-col pl-4 space-y-1 relative">
                    {subCats.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setActiveCategory(sub.id)}
                        className={cn(
                          "whitespace-nowrap px-4 py-2 text-xs font-semibold rounded-xl transition-all text-left group flex items-center gap-2",
                          activeCategory === sub.id ? "text-brand-600 bg-brand-50/50" : "text-slate-400 hover:text-brand-500 hover:bg-white/40"
                        )}
                      >
                        <ChevronRight className={cn("w-3 h-3 transition-transform", activeCategory === sub.id ? "translate-x-0" : "-translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
                        {sub.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-8">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="relative w-full max-w-xl group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm tài liệu, kế hoạch, nhãn hàng..." 
              className="w-full pl-12 pr-6 py-3.5 bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl text-[15px] outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white shadow-sm hover:shadow-md transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-3 w-full xl:w-auto">
            <button className="flex-1 xl:flex-none justify-center flex items-center gap-2 px-6 py-3.5 glass glass-hover text-slate-700 text-[13px] font-bold rounded-2xl">
              <Filter className="w-4 h-4" /> Bộ lọc
            </button>
            {isAdminOrManager && (
              <button 
                onClick={() => navigate('/documents/new')}
                className="flex-1 xl:flex-none justify-center flex items-center gap-2 px-6 py-3.5 bg-brand-600 text-white text-[13px] font-bold rounded-2xl hover:bg-brand-700 shadow-lg shadow-brand-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Thêm mới
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
               <p className="text-slate-500 font-medium">Đang đồng bộ dữ liệu...</p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
               {filteredDocs.length === 0 && (
                  <div className="col-span-full p-20 text-center glass rounded-3xl space-y-4">
                    <Folder className="w-16 h-16 text-slate-200 mx-auto" />
                    <p className="text-slate-500 font-bold">Thư mục này hiện chưa có tài liệu nào.</p>
                  </div>
                )}
               {filteredDocs.map((doc, index) => {
                 const category = categories.find(c => c.id === doc.categoryId);
                 return (
                   <motion.div 
                      layout
                      initial={{ opacity: 0, y: 30, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      key={doc.id} 
                      className="glass glass-hover rounded-3xl p-6 group flex flex-col h-full relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start gap-4 mb-5 relative z-10">
                        <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                          {getFileIcon(doc.type)}
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdminOrManager && (
                            <div className="flex gap-1.5 p-1 bg-white/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link 
                                to={`/documents/${doc.id}/edit`} 
                                className="p-2 text-slate-500 hover:text-brand-600 hover:bg-white rounded-lg transition-all"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Pencil className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={(e) => handleDeleteDoc(doc.id, e)}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4 relative z-10">
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 inline-block shadow-sm ring-1 ring-white/10",
                          doc.status === 'urgent' ? "bg-rose-500 text-white" : 
                          doc.status === 'new' ? "bg-brand-500 text-white" : "bg-emerald-500 text-white"
                        )}>
                          {doc.status}
                        </span>
                        <h3 className="text-[17px] font-display font-bold text-slate-800 mb-2 group-hover:text-brand-600 transition-colors line-clamp-2 leading-tight">
                           <Link to={`/documents/${doc.id}`} className="focus:outline-none">
                             {doc.title}
                           </Link>
                        </h3>
                        <p className="text-[13px] text-slate-500 line-clamp-2 font-medium leading-relaxed opacity-80">{doc.description}</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-6 relative z-10 mt-auto">
                        {doc.brand && <span className="px-3 py-1 bg-indigo-50/50 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-100/50 uppercase tracking-wider">{doc.brand}</span>}
                        {doc.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className="px-3 py-1 bg-white/50 text-slate-500 rounded-lg text-[10px] font-bold border border-white uppercase tracking-wider">#{tag}</span>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold relative z-10 italic">
                         <div className="flex items-center gap-1.5">
                            <Folder className="w-3 h-3" />
                            <span className="truncate max-w-[120px] uppercase tracking-wide">{category?.title || 'Chưa phân loại'}</span>
                         </div>
                         <span className="text-slate-500">{formatDate(doc.publishDate || doc.createdAt)}</span>
                      </div>
                   </motion.div>
                 )
               })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

}

