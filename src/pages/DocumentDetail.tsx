import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Document as AppDocument, Category } from '../types';
import { ArrowLeft, Download, FileText, CheckCircle2, Clock, Calendar, Tag, Layers, ChevronRight, Trash2, Link as LinkIcon } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { deleteDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  
  const [docData, setDocData] = useState<AppDocument | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [hasRead, setHasRead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !userProfile) return;

    const fetchDoc = async () => {
      try {
        const docRef = doc(db, 'documents', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as AppDocument;
          setDocData(data);
          
          // Fetch Category
          if (data.categoryId) {
            const catSnap = await getDoc(doc(db, 'categories', data.categoryId));
            if (catSnap.exists()) setCategory({ id: catSnap.id, ...catSnap.data() } as Category);
          }

          // Check if user has read it
          if (data.isRequireReadReceipt) {
            const readQuery = query(collection(db, 'readReceipts'), where('documentId', '==', id), where('userId', '==', userProfile.id));
            const readSnap = await getDocs(readQuery);
            if (!readSnap.empty) {
              setHasRead(true);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [id, userProfile]);

  const confirmRead = async () => {
    if (!id || !userProfile || hasRead) return;
    setConfirming(true);
    try {
      const receiptId = `${userProfile.id}_${id}`;
      await setDoc(doc(db, 'readReceipts', receiptId), {
        documentId: id,
        userId: userProfile.id,
        readAt: new Date().toISOString()
      });
      setHasRead(true);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra, vui lòng thử lại.');
    }
    setConfirming(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (deletingId === id) {
      try {
        await deleteDoc(doc(db, 'documents', id));
        navigate('/documents');
      } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi xóa tài liệu.');
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Đang tải dữ liệu...</div>;
  if (!docData) return <div className="p-12 text-center text-slate-500">Không tìm thấy tài liệu này.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-12 h-12 glass rounded-2xl flex items-center justify-center text-slate-500 shadow-sm hover:bg-white hover:text-brand-600 transition-all active:scale-90">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center text-[11px] font-black text-slate-400 gap-2 uppercase tracking-widest">
              <Link to="/documents" className="hover:text-brand-500 transition-colors">THƯ VIỆN</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-brand-500">{category?.title || 'KHÁC'}</span>
            </div>
            <h2 className="text-lg font-display font-bold text-slate-800 line-clamp-1">Chi tiết tài liệu</h2>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-3">
           {(userProfile?.role === 'admin' || userProfile?.role === 'manager') && (
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link 
                  to={`/documents/${docData.id}/edit`}
                  className="flex-1 sm:flex-none px-6 py-3 glass glass-hover text-slate-700 font-bold rounded-2xl transition-all text-sm text-center"
                >
                  Sửa nội dung
                </Link>
                <button 
                  onClick={handleDelete}
                  className={cn(
                    "flex-1 sm:flex-none px-6 py-3 font-bold border rounded-2xl shadow-sm transition-all text-sm flex items-center justify-center gap-2",
                    deletingId === docData.id ? "bg-rose-500 text-white border-rose-500" : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                  )}
                  title={deletingId === docData.id ? "Nhấn lần nữa để xóa" : "Xóa"}
                >
                  <Trash2 className="w-4 h-4" /> {deletingId === docData.id ? 'Xác nhận xóa' : 'Xóa'}
                </button>
             </div>
           )}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="glass rounded-[40px] shadow-2xl border-white/60 overflow-hidden">
        {/* Header Area */}
        <div className="p-8 md:p-12 border-b border-white/40 bg-white/30 backdrop-blur-md relative">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-200/20 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-3 mb-6">
               <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm ring-1 ring-white/20", 
                  docData.status === 'urgent' ? 'bg-rose-600 text-white' : 
                  docData.status === 'new' ? 'bg-brand-600 text-white' : 
                  docData.status === 'expired' ? 'bg-slate-400 text-white' : 'bg-emerald-600 text-white'
               )}>
                  {docData.status === 'urgent' ? 'Tiêu điểm khẩn' : docData.status === 'new' ? 'Mới cập nhật' : docData.status === 'expired' ? 'Hết hiệu lực' : 'Đang áp dụng'}
               </span>
               {docData.brand && <span className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 shadow-sm">{docData.brand}</span>}
            </div>
            
            <h1 className="text-3xl md:text-5xl font-display font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">{docData.title}</h1>
            
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-[13px] text-slate-500 font-bold">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/50 flex items-center justify-center shadow-inner">
                  <Calendar className="w-4 h-4 text-brand-500" />
                </div>
                <span>Ngày đăng: <span className="text-slate-800">{formatDate(docData.publishDate || docData.createdAt)}</span></span>
              </div>
              {docData.expireDate && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/50 flex items-center justify-center shadow-inner">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <span>Hết hạn: <span className="text-amber-600 font-black uppercase tracking-tight">{formatDate(docData.expireDate)}</span></span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/50 flex items-center justify-center shadow-inner">
                  <Layers className="w-4 h-4 text-brand-500" />
                </div>
                <span>Loại tệp: <span className="text-slate-800 uppercase tracking-tighter">{docData.type}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 md:p-12 bg-white/20">
          <div className="max-w-none mb-12">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6 ml-1">
              <FileText className="w-4 h-4 text-brand-500" /> NỘI DUNG TRIỂN KHAI CHI TIẾT
            </h3>
            <div className="text-[16px] text-slate-700 whitespace-pre-wrap leading-relaxed font-medium bg-white/40 p-8 rounded-[32px] border border-white/60 shadow-inner">
              {docData.description}
            </div>
          </div>

          {(docData.tags && docData.tags.length > 0) && (
            <div className="flex items-center gap-4 mb-12 py-6 px-1 border-y border-white/40">
              <Tag className="w-4 h-4 text-slate-400" />
              <div className="flex flex-wrap gap-2">
                {docData.tags.map(tag => (
                  <span key={tag} className="px-4 py-1.5 bg-white/60 text-slate-600 rounded-xl text-[11px] font-black uppercase tracking-widest border border-white shadow-sm ring-1 ring-black/[0.02]">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Attachment Box and Preview */}
          {(docData.fileUrl || (docData.links && docData.links.length > 0)) && (
             <div className="space-y-8">
               <div className="bg-gradient-to-br from-brand-600 to-indigo-600 rounded-[32px] p-8 flex flex-col xl:flex-row items-center justify-between gap-8 shadow-2xl shadow-brand-500/20 text-white relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none"></div>
                 <div className="flex items-center gap-6 relative z-10">
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/30 shadow-xl group hover:scale-110 transition-transform">
                      <Download className="w-8 h-8 text-white group-hover:animate-bounce" />
                   </div>
                   <div>
                     <h4 className="font-display font-black text-xl tracking-tight">Tải xuống tệp đính kèm</h4>
                     <p className="text-brand-100 text-sm font-medium mt-1">Các liên kết và tệp đính kèm • Đã sẵn sàng để sử dụng</p>
                   </div>
                 </div>
                 
                 <div className="flex flex-col gap-3 w-full xl:w-auto relative z-10">
                   {docData.fileUrl && (
                     <div className="flex flex-col sm:flex-row gap-3">
                        <a 
                          href={docData.fileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold text-sm text-center hover:bg-white/20 transition-all shadow-xl active:scale-95"
                        >
                          Xem tệp chính
                        </a>
                        <a 
                          href={docData.fileUrl} 
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="px-8 py-4 bg-white text-brand-600 rounded-2xl font-black text-sm text-center hover:bg-brand-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Tải tệp chính
                        </a>
                     </div>
                   )}
                   {docData.links && docData.links.length > 0 && (
                     <div className="flex flex-col gap-2 mt-2 w-full">
                       {docData.links.map((link, idx) => link.trim() && (
                          <a 
                            key={idx}
                            href={link} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-6 py-3 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-sm text-center hover:bg-white/20 transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <LinkIcon className="w-4 h-4" /> Liên kết đính kèm {idx + 1}
                          </a>
                       ))}
                     </div>
                   )}
                 </div>
               </div>

             </div>
          )}
        </div>
      </div>

      {/* Read Receipt Area */}
      {docData.isRequireReadReceipt && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={cn(
            "rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl border-2 transition-all duration-500",
            hasRead 
              ? "bg-emerald-500/10 border-emerald-500/20 backdrop-blur-md" 
              : "bg-brand-500/10 border-brand-500/20 animate-pulse-subtle"
          )}
        >
          <div className="text-center md:text-left">
            <h3 className={cn("font-display font-black text-xl mb-1 uppercase tracking-tight", hasRead ? "text-emerald-800" : "text-brand-800")}>
              {hasRead ? "ĐÃ HOÀN TẤT XÁC NHẬN" : "YÊU CẦU XÁC NHẬN CHƯƠNG TRÌNH"}
            </h3>
            <p className={cn("text-sm font-medium leading-relaxed opacity-80", hasRead ? "text-emerald-700" : "text-brand-700")}>
              {hasRead 
                ? "Cảm ơn bạn! Chúng tôi đã ghi nhận thời gian bạn tiếp nhận thông tin." 
                : "Tài liệu này yêu cầu nhân viên phải xác nhận đã đọc trước khi triển khai thực tế."}
            </p>
          </div>
          <button
            onClick={confirmRead}
            disabled={hasRead || confirming}
            className={cn(
              "shrink-0 px-10 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 w-full md:w-auto transition-all shadow-xl active:scale-95",
              hasRead 
                ? "bg-emerald-500 text-white cursor-default opacity-80 shadow-emerald-500/20" 
                : "bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/20"
            )}
          >
            {confirming ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
            {confirming ? "Đang gửi..." : hasRead ? "Bạn đã xác nhận" : "TÔI XÁC NHẬN ĐÃ ĐỌC"}
          </button>
        </motion.div>
      )}
    </div>
  );

}

function ChevronRightIcon() {
  return <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>;
}

