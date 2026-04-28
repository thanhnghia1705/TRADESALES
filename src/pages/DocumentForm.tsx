import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, setDoc, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Category, Document as AppDoc } from '../types';
import { ArrowLeft, Save, Plus, Paperclip, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DocumentForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { userProfile, isAdminOrManager } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [formData, setFormData] = useState<Partial<AppDoc>>({
    title: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    type: 'word',
    status: 'active',
    brand: '',
    tags: [],
    fileUrl: '',
    isRequireReadReceipt: false,
    publishDate: new Date().toISOString().slice(0, 16),
    expireDate: ''
  });

  const [tagsInput, setTagsInput] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!isAdminOrManager) {
      navigate('/documents');
      return;
    }

    const fetchData = async () => {
      // Load categories
      const catQuery = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const catSnap = await getDocs(catQuery);
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));

      // Load doc if edit
      if (isEdit && id) {
        const docSnap = await getDoc(doc(db, 'documents', id));
        if (docSnap.exists()) {
          const data = docSnap.data() as AppDoc;
          setFormData({
            ...data,
            publishDate: data.publishDate ? new Date(data.publishDate).toISOString().slice(0, 16) : '',
            expireDate: data.expireDate ? new Date(data.expireDate).toISOString().slice(0, 16) : '',
          });
          if (data.tags) {
            setTagsInput(data.tags.join(', '));
          }
        }
      }
    };

    fetchData();
  }, [id, isEdit, isAdminOrManager, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddLink = () => {
    setFormData(prev => ({ ...prev, links: [...(prev.links || []), ''] }));
  };

  const handleUpdateLink = (index: number, value: string) => {
    setFormData(prev => {
      const newLinks = [...(prev.links || [])];
      newLinks[index] = value;
      return { ...prev, links: newLinks };
    });
  };

  const handleRemoveLink = (index: number) => {
    setFormData(prev => {
      const newLinks = [...(prev.links || [])];
      newLinks.splice(index, 1);
      return { ...prev, links: newLinks };
    });
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
    else if (ext && ['jpg', 'jpeg', 'png'].includes(ext)) fileType = 'image';

    setFormData(prev => ({ ...prev, type: fileType }));

    setUploadingFile(true);
    const storageRef = ref(storage, `main_docs/${Date.now()}_${file.name}`);
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
        setFormData(prev => ({ ...prev, fileUrl: downloadURL }));
        setUploadingFile(false);
      }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t !== '');
      
      const payload: Partial<AppDoc> = {
        ...formData,
        tags: tagsArray,
        publishDate: formData.publishDate ? new Date(formData.publishDate).toISOString() : new Date().toISOString(),
        expireDate: formData.expireDate ? new Date(formData.expireDate).toISOString() : '',
        updatedAt: new Date().toISOString(),
      };

      if (isEdit && id) {
        await setDoc(doc(db, 'documents', id), payload, { merge: true });
      } else {
        payload.createdAt = new Date().toISOString();
        payload.authorId = userProfile.id;
        await addDoc(collection(db, 'documents'), payload);
      }
      navigate('/documents');
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi lưu tài liệu!');
    }
    setLoading(false);
  };

  const mainCategories = categories.filter(c => c.type === 'main');
  const subCategories = categories.filter(c => c.parentId === formData.categoryId);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white border border-slate-200 rounded text-slate-600 shadow-sm hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Chỉnh sửa Tài liệu' : 'Thêm Tài liệu / Scheme mới'}
        </h1>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề chương trình / Tài liệu *</label>
            <input 
              required
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="VD: Cập nhật Scheme Quý 3..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nội dung chi tiết *</label>
            <textarea 
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              placeholder="Mô tả chi tiết nội dung cần triển khai..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục chính *</label>
              <select
                required
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="">-- Chọn danh mục --</option>
                {mainCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục phụ</label>
              <select
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="">-- Không chọn --</option>
                {subCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Loại file</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="word">Word</option>
                <option value="excel">Excel</option>
                <option value="image">Hình ảnh / Slide</option>
                <option value="pdf">PDF</option>
                <option value="link">Link</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value="new">Mới</option>
                <option value="active">Đang áp dụng</option>
                <option value="urgent">Khẩn cấp</option>
                <option value="expired">Đã hết hạn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhãn hàng (nếu có)</label>
              <input 
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="VD: PharmaPlus"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày công bố</label>
                <input 
                  type="datetime-local"
                  name="publishDate"
                  value={formData.publishDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hạn chót áp dụng</label>
                <input 
                  type="datetime-local"
                  name="expireDate"
                  value={formData.expireDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thẻ (Tags)</label>
            <input 
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Khuyến mãi, HCM, Tháng 5... (cách nhau bởi dấu phẩy)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tải lên File đính kèm</label>
                <input 
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {uploadingFile && (
                  <div className="mt-2 text-xs font-bold text-emerald-600 animate-pulse">Đang tải: {Math.round(uploadProgress)}%</div>
                )}
                {formData.fileUrl && !uploadingFile && formData.fileUrl.includes('firebasestorage') && (
                  <div className="mt-2 text-xs font-medium text-slate-500 truncate">
                    Đã tải file thành công: <a href={formData.fileUrl} target="_blank" rel="noreferrer" className="text-emerald-600 underline">Xem file</a>
                  </div>
                )}
             </div>

             <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700">Hoặc dán Link trực tiếp (Drive/Web)</label>
                  <button type="button" onClick={handleAddLink} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md">
                    <Plus className="w-3 h-3" /> Thêm link
                  </button>
                </div>
                
                <div className="space-y-2">
                  <input 
                    name="fileUrl"
                    value={formData.fileUrl || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="https://drive.google.com/... (Link chính)"
                  />
                  
                  {formData.links && formData.links.map((link, index) => (
                    <div key={index} className="flex gap-2 isolate relative group">
                      <div className="absolute top-1/2 left-4 -translate-y-1/2 opacity-40 group-focus-within:opacity-100 group-hover:opacity-100 transition-opacity">
                        <Paperclip className="w-4 h-4 text-emerald-600" />
                      </div>
                      <input 
                        type="url"
                        value={link}
                        onChange={e => handleUpdateLink(index, e.target.value)}
                        className="w-full pl-11 pr-5 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-slate-600 text-sm"
                        placeholder="https://..."
                      />
                      <button type="button" onClick={() => handleRemoveLink(index)} className="w-10 shrink-0 border border-slate-300 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <p className="text-[10px] text-slate-400 mt-1 italic italic">Lưu ý: Nếu dán link Drive/Google Docs, hãy đảm bảo quyền truy cập là 'Bất kỳ ai có đường liên kết'.</p>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
             <input 
               type="checkbox"
               id="isRequireReadReceipt"
               name="isRequireReadReceipt"
               checked={formData.isRequireReadReceipt || false}
               onChange={handleChange}
               className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
             />
             <label htmlFor="isRequireReadReceipt" className="font-medium text-slate-700 cursor-pointer">
               Yêu cầu Sales xác nhận "Đã đọc & hiểu rõ"
             </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50"
          >
            Hủy
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Đang lưu...' : 'Lưu tài liệu'}
          </button>
        </div>
      </form>
    </div>
  );
}
