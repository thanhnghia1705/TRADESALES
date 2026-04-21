import React, { useState, useEffect } from 'react';
import { Map, Lock, Unlock, Settings, ChevronRight, Download, X, Save, ShieldAlert, FileText, CheckCircle2, Plus, Trash2, Pencil, Calendar } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { collection, doc, getDocs, query, orderBy, writeBatch, where, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { motion } from 'motion/react';

export interface RegionConfig {
  id: string;
  name: string;
  password?: string;
  order: number;
}

export interface RegionalDoc {
  id: string;
  regionId: string;
  title: string;
  description?: string;
  type: 'word' | 'excel' | 'pdf' | 'other';
  fileUrl: string;
  createdAt: string;
}

const DEFAULT_REGIONS: RegionConfig[] = [
  { id: 'v1', name: 'Đông Bắc Bộ', order: 1, password: '123' },
  { id: 'v2', name: 'Tây Bắc Bộ', order: 2, password: '123' },
  { id: 'v3', name: 'Đồng bằng sông Hồng', order: 3, password: '123' },
  { id: 'v4', name: 'Bắc Trung Bộ', order: 4, password: '123' },
  { id: 'v5', name: 'Duyên hải Nam Trung Bộ', order: 5, password: '123' },
  { id: 'v6', name: 'Tây Nguyên', order: 6, password: '123' },
  { id: 'v7', name: 'Đông Nam Bộ', order: 7, password: '123' },
  { id: 'v8', name: 'Hồ Chí Minh', order: 8, password: '123' },
  { id: 'v9', name: 'Đồng bằng sông Cửu Long', order: 9, password: '123' },
];

export default function RegionalInfo() {
  const { isAdminOrManager } = useAuth();
  
  const [regions, setRegions] = useState<RegionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeRegion, setActiveRegion] = useState<string>('v1');
  const [unlockedRegions, setUnlockedRegions] = useState<string[]>([]);
  
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  // Regional Docs State
  const [regionalDocs, setRegionalDocs] = useState<RegionalDoc[]>([]);
  
  // Doc Modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Partial<RegionalDoc>>({
    title: '',
    description: '',
    type: 'pdf',
    fileUrl: ''
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Admin Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editRegions, setEditRegions] = useState<RegionConfig[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const q = query(collection(db, 'regions'), orderBy('order', 'asc'));
        const snap = await getDocs(q);
        
        const existingRegions = snap.docs.map(d => ({ id: d.id, ...d.data() } as RegionConfig));
        
        if (existingRegions.length < 9) {
          // Bootstrap missing default regions
          const batch = writeBatch(db);
          let added = false;
          
          DEFAULT_REGIONS.forEach(r => {
            if (!existingRegions.find(e => e.id === r.id)) {
              batch.set(doc(db, 'regions', r.id), r);
              existingRegions.push(r);
              added = true;
            }
          });
          
          if (added) {
            await batch.commit();
          }
          
          // Sort after adding
          existingRegions.sort((a, b) => a.order - b.order);
          setRegions(existingRegions);
        } else {
          setRegions(existingRegions);
        }
      } catch (err) {
        console.error("Lỗi tải danh mục vùng:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, []);

  // Fetch docs for active region
  useEffect(() => {
    if (!activeRegion) return;
    const isRegionUnlocked = isAdminOrManager || unlockedRegions.includes(activeRegion);
    if (!isRegionUnlocked) {
      setRegionalDocs([]);
      return;
    }

    const q = query(
      collection(db, 'regionalDocs'), 
      where('regionId', '==', activeRegion),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setRegionalDocs(snap.docs.map(d => ({ id: d.id, ...d.data() } as RegionalDoc)));
    });
    return () => unsub();
  }, [activeRegion, unlockedRegions, isAdminOrManager]);

  const currentRegion = regions.find(r => r.id === activeRegion);
  const isUnlocked = isAdminOrManager || unlockedRegions.includes(activeRegion);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRegion?.password === passwordInput) {
      setUnlockedRegions(prev => [...prev, activeRegion]);
      setPasswordInput('');
      setError('');
    } else {
      setError('Mật khẩu không chính xác. Vui lòng thử lại.');
    }
  };

  const openAdminModal = () => {
    setEditRegions([...regions]);
    setShowAdminModal(true);
  };

  const handleUpdateEditRegion = (id: string, field: keyof RegionConfig, value: string) => {
    setEditRegions(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const saveRegionSettings = async () => {
    setSavingSettings(true);
    try {
      const batch = writeBatch(db);
      editRegions.forEach(r => {
        batch.set(doc(db, 'regions', r.id), r);
      });
      await batch.commit();
      setRegions(editRegions);
      setShowAdminModal(false);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi lưu thiết lập!');
    }
    setSavingSettings(false);
  };

  const handeSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDoc.id) {
        await updateDoc(doc(db, 'regionalDocs', editingDoc.id), {
          title: editingDoc.title,
          description: editingDoc.description || '',
          type: editingDoc.type,
          fileUrl: editingDoc.fileUrl
        });
      } else {
        await addDoc(collection(db, 'regionalDocs'), {
          regionId: activeRegion,
          title: editingDoc.title,
          description: editingDoc.description || '',
          type: editingDoc.type,
          fileUrl: editingDoc.fileUrl,
          createdAt: new Date().toISOString()
        });
      }
      setShowDocModal(false);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi lưu tài liệu!');
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này khỏi vùng không?')) {
      try {
        await deleteDoc(doc(db, 'regionalDocs', id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openDocForm = (docData?: RegionalDoc) => {
    if (docData) {
      setEditingDoc({ ...docData });
    } else {
      setEditingDoc({ title: '', description: '', type: 'pdf', fileUrl: '' });
    }
    setUploadProgress(0);
    setUploadingFile(false);
    setShowDocModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Automatically set type based on file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    let fileType: any = 'other';
    if (ext === 'pdf') fileType = 'pdf';
    else if (ext && ['xls', 'xlsx', 'csv'].includes(ext)) fileType = 'excel';
    else if (ext && ['doc', 'docx'].includes(ext)) fileType = 'word';

    setEditingDoc(prev => ({ ...prev, type: fileType }));

    setUploadingFile(true);
    const storageRef = ref(storage, `regional_files/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Lỗi tải file:', error);
        setUploadingFile(false);
        alert('Có lỗi xảy ra khi tải file lên!');
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setEditingDoc(prev => ({ ...prev, fileUrl: downloadURL }));
        setUploadingFile(false);
      }
    );
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Đang tải cấu hình vùng...</div>;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Banner / Header */}
      <div className="bg-brand-600 rounded-[40px] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                <Map className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight italic uppercase">HỆ SINH THÁI KHU VỰC</h1>
          </div>
          <p className="text-brand-100 mt-2 max-w-2xl text-lg font-medium leading-relaxed">
            Dữ liệu triển khai cục bộ được bảo vệ bởi lớp mật mã phân quyền Zone-Base. Hãy chọn khu vực của bạn để tiếp cận nguồn tài nguyên chuyên biệt.
          </p>
        </div>
        
        {isAdminOrManager && (
          <button 
            onClick={openAdminModal}
            className="shrink-0 relative z-10 flex items-center gap-3 bg-white text-brand-600 hover:bg-brand-50 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95"
          >
            <Settings className="w-5 h-5" />
            Cài đặt & Mật khẩu
          </button>
        )}
        
        <div className="absolute top-0 right-10 p-8 opacity-20 blur-xl md:blur-3xl pointer-events-none">
          <Map className="w-96 h-96 text-white" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar: 9 Regions */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="glass rounded-[32px] border-white/60 shadow-2xl overflow-hidden sticky top-24">
            <div className="px-6 py-5 border-b border-white/40 bg-white/20">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">PHÂN KHU CHIẾN LƯỢC</h3>
            </div>
            <div className="p-3 space-y-2">
              {regions.map(region => {
                const isRegionUnlocked = isAdminOrManager || unlockedRegions.includes(region.id);
                const isActive = activeRegion === region.id;
                return (
                  <button
                    key={region.id}
                    onClick={() => {
                       setActiveRegion(region.id);
                       setPasswordInput('');
                       setError('');
                    }}
                    className={cn(
                      "w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group",
                      isActive 
                        ? "bg-brand-600 text-white shadow-xl shadow-brand-600/20" 
                        : "text-slate-600 hover:bg-white/60 border border-transparent"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isActive ? "bg-white/20 text-white" : "bg-white/60 text-slate-400 shadow-inner"
                      )}>
                        {isRegionUnlocked ? (
                          <Unlock className="w-5 h-5" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <span className="line-clamp-1 uppercase tracking-tight">{region.name}</span>
                    </span>
                    {isActive && <motion.div layoutId="activeArrow"><ChevronRight className="w-5 h-5" /></motion.div>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Pane: Region Content or Password Challenge */}
        <div className="flex-1 min-w-0">
          {isUnlocked ? (
            <div className="glass rounded-[32px] border-white/60 shadow-2xl h-full flex flex-col min-h-[600px] overflow-hidden">
              <div className="px-8 py-8 border-b border-white/40 bg-white/30 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                 <div className="space-y-1">
                   <div className="flex items-center gap-3">
                     <h2 className="text-2xl font-display font-black text-slate-900 uppercase italic tracking-tight">
                       {currentRegion?.name}
                     </h2>
                     <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                       <CheckCircle2 className="w-5 h-5" />
                     </div>
                   </div>
                   <p className="text-[13px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
                     {isAdminOrManager ? (
                       <><ShieldAlert className="w-4 h-4 text-amber-500" /> QUYỀN MIỄN TRỪ QUẢN TRỊ VIÊN</>
                     ) : (
                       <><Unlock className="w-4 h-4 text-emerald-500" /> TRUY CẬP ĐÃ ĐƯỢC XÁC THỰC</>
                     )}
                   </p>
                 </div>
                 
                 {isAdminOrManager && (
                   <button 
                     onClick={() => openDocForm()}
                     className="flex items-center gap-3 px-8 py-4 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 active:scale-95"
                   >
                     <Plus className="w-5 h-5" /> ĐĂNG TÀI LIỆU VÙNG
                   </button>
                 )}
              </div>
              
              <div className="p-0 flex-1 bg-white/10">
                <div className="divide-y divide-white/40">
                  {regionalDocs.length === 0 ? (
                    <div className="p-20 text-center space-y-6">
                       <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-white/60 backdrop-blur-md mb-3 border border-white shadow-xl">
                         <FileText className="w-10 h-10 text-brand-300" />
                       </div>
                       <div>
                         <p className="text-slate-800 font-display font-black text-2xl uppercase tracking-tight">KHU VỰC ĐANG TRỐNG</p>
                         <p className="text-slate-500 font-medium max-w-sm mx-auto mt-2">Chưa có thông báo hay file dữ liệu nào được chia sẻ riêng cho khu vực này.</p>
                       </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/40">
                      {regionalDocs.map((doc, i) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="p-8 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:bg-white/40"
                        >
                          <div className="flex gap-6 items-start sm:items-center w-full relative z-10">
                            <div className={cn(
                              "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-lg border-2 transition-all group-hover:scale-110",
                              doc.type === 'excel' ? "bg-emerald-50 text-emerald-600 border-white" :
                              doc.type === 'pdf' ? "bg-rose-50 text-rose-600 border-white" :
                              doc.type === 'word' ? "bg-blue-50 text-blue-600 border-white" :
                              "bg-purple-50 text-purple-600 border-white"
                            )}>
                              {doc.type === 'excel' ? '📊' : doc.type === 'pdf' ? '📑' : doc.type === 'word' ? '📄' : '📝'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-display font-black text-slate-800 group-hover:text-brand-600 transition-colors tracking-tight">
                                {doc.title}
                              </h3>
                              {doc.description && (
                                <p className="text-[15px] text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">{doc.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 mt-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                <span className="px-3 py-1 bg-white/60 rounded-full border border-white shadow-sm ring-1 ring-black/[0.02] text-brand-600">ZONE-CORE</span>
                                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(doc.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="shrink-0 flex items-center gap-3 self-end sm:self-center mt-4 sm:mt-0 relative z-10 w-full sm:w-auto">
                            {isAdminOrManager && (
                              <>
                                <button onClick={() => openDocForm(doc)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-brand-600 bg-white border border-white rounded-2xl shadow-lg transition-all hover:scale-105">
                                  <Pencil className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteDoc(doc.id)} className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-rose-600 bg-white border border-white rounded-2xl shadow-lg transition-all hover:scale-105">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            {doc.fileUrl ? (
                              <div className="flex flex-1 sm:flex-none gap-3">
                                <a 
                                  href={doc.fileUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex-1 sm:flex-none px-6 py-3.5 bg-white text-slate-600 border border-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg active:scale-95 flex items-center justify-center"
                                >
                                  Mở
                                </a>
                                <a 
                                  href={doc.fileUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  download
                                  className="flex-[2] sm:flex-none px-8 py-3.5 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <Download className="w-4 h-4" /> Tải về
                                </a>
                              </div>
                            ) : (
                              <span className="px-6 py-3.5 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-white">
                                CHỈ XEM
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-[32px] border-white/60 shadow-2xl h-full min-h-[600px] flex items-center justify-center p-12 relative overflow-hidden">
               <div className="max-w-md w-full relative z-10 text-center space-y-10">
                 <div className="w-28 h-28 bg-white/60 backdrop-blur-md rounded-[40px] flex items-center justify-center border-4 border-white shadow-2xl mx-auto transform -rotate-12">
                   <Lock className="w-14 h-14 text-brand-400" />
                 </div>
                 <div className="space-y-3">
                   <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight uppercase italic">BẢO MẬT KHU VỰC</h2>
                   <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                     Bạn đang truy cập vào Zone <strong className="text-brand-600">{currentRegion?.name}</strong>. Đây là tài nguyên bảo mật nội bộ, vui lòng nhập mật mã được cấp để tiếp tục.
                   </p>
                 </div>
                 
                 <form onSubmit={handleUnlock} className="space-y-6 text-left">
                    <div className="relative group">
                      <input 
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="NHẬP MẬT MÃ ZONE..."
                        className="w-full px-8 py-5 bg-white/60 border-2 border-white rounded-[24px] focus:ring-4 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-center shadow-inner font-black tracking-[0.5em] text-brand-600 text-xl transition-all"
                        autoFocus
                      />
                      {error && (
                        <motion.p 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-rose-500 text-xs font-black uppercase tracking-widest mt-4 text-center bg-rose-50 py-3 rounded-xl border border-rose-100"
                        >
                          {error}
                        </motion.p>
                      )}
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-5 bg-brand-600 text-white font-black rounded-[24px] hover:bg-brand-700 transition-all shadow-2xl shadow-brand-600/20 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Unlock className="w-5 h-5" /> XÁC THỰC TRUY CẬP
                    </button>
                 </form>
               </div>

               {/* Background decors for locked state */}
               <div className="absolute top-0 right-0 w-80 h-80 bg-brand-50 rounded-bl-full opacity-30 pointer-events-none -mr-20 -mt-20"></div>
               <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-tr-full opacity-30 pointer-events-none -ml-16 -mb-16"></div>
            </div>
          )}
        </div>
      </div>

      {/* Admin Regional Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm shadow-2xl">
          <form onSubmit={handeSaveDoc} className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="text-lg font-bold text-slate-900">
                {editingDoc.id ? 'Sửa Nội Dung Vùng' : 'Thêm Nội Dung Vùng Mới'}
              </h3>
              <button type="button" onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề *</label>
                <input 
                  required
                  value={editingDoc.title}
                  onChange={e => setEditingDoc({...editingDoc, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Chỉ tiêu kinh doanh Tháng 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung chi tiết (Mô tả)</label>
                <textarea 
                  value={editingDoc.description}
                  onChange={e => setEditingDoc({...editingDoc, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                  placeholder="Điền các lưu ý, thông tin quan trọng..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Định dạng File</label>
                  <select 
                    value={editingDoc.type}
                    onChange={e => setEditingDoc({...editingDoc, type: e.target.value as any})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="pdf">PDF / Hình ảnh</option>
                    <option value="excel">Excel (xls, xlsx)</option>
                    <option value="word">Word (doc, docx)</option>
                    <option value="other">Loại khác / Chỉ xem text</option>
                  </select>
                </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tải File lên</label>
                    <input 
                      type="file"
                      onChange={handleFileUpload}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                    {uploadingFile && (
                      <div className="mt-2 text-xs font-bold text-emerald-600">Đang tải: {Math.round(uploadProgress)}%</div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hoặc dán Link trực tiếp</label>
                  <input 
                    value={editingDoc.fileUrl || ''}
                    onChange={e => setEditingDoc({...editingDoc, fileUrl: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="https://docs.google.com/..."
                  />
                  {editingDoc.fileUrl && !uploadingFile && (
                    <div className="mt-2 text-xs font-medium text-slate-500 truncate">
                      Đã có link: <a href={editingDoc.fileUrl} target="_blank" rel="noreferrer" className="text-emerald-600 underline">Kiểm tra link</a>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setShowDocModal(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">Hủy</button>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm">Lưu</button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Management Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-600" /> Cấu hình Hệ thống Khu vực
                </h3>
                <p className="text-xs text-slate-500 mt-1">Thay đổi tên gọi hoặc mật khẩu riêng biệt cho từng khu vực.</p>
              </div>
              <button 
                onClick={() => setShowAdminModal(false)}
                className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-50/30">
              <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
                <div className="col-span-1 text-center">STT</div>
                <div className="col-span-6">Tên Khu Vực Hiển Thị</div>
                <div className="col-span-5">Mật Khẩu Phân Quyền</div>
              </div>
              
              {editRegions.map((region, index) => (
                <div key={region.id} className="grid grid-cols-12 gap-4 items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
                  <div className="col-span-1 text-center font-bold text-slate-400 text-sm">{index + 1}</div>
                  <div className="col-span-6">
                    <div className="relative">
                      <input
                        value={region.name}
                        onChange={(e) => handleUpdateEditRegion(region.id, 'name', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm transition-shadow font-medium text-slate-800"
                        placeholder="Tên vùng"
                      />
                      <Map className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div className="col-span-5">
                    <div className="relative">
                      <input
                        type="text"
                        value={region.password || ''}
                        onChange={(e) => handleUpdateEditRegion(region.id, 'password', e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm font-mono transition-shadow placeholder:font-sans"
                        placeholder="Để trống để mở khóa"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                Mật khẩu được lưu trực tiếp và áp dụng tức thì.
              </span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAdminModal(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button 
                  onClick={saveRegionSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingSettings ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
