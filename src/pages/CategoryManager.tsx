import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category } from '../types';
import { Folder, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function CategoryManager() {
  const { isAdminOrManager } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<Category>>({
    title: '',
    type: 'main',
    order: 0,
    parentId: ''
  });

  useEffect(() => {
    if (!isAdminOrManager) {
      navigate('/');
      return;
    }
    const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      setLoading(false);
    });
    return () => unsub();
  }, [isAdminOrManager, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCat.id) {
        await updateDoc(doc(db, 'categories', editingCat.id), {
          title: editingCat.title,
          type: editingCat.type,
          order: Number(editingCat.order),
          parentId: editingCat.parentId || null
        });
      } else {
        await addDoc(collection(db, 'categories'), {
          ...editingCat,
          order: Number(editingCat.order),
          parentId: editingCat.parentId || null
        });
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi lưu!');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === id) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        setDeletingId(null);
      } catch (err) {
        console.error(err);
        alert('Có lỗi xảy ra khi xóa!');
      }
    } else {
      setDeletingId(id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const openForm = (cat?: Category) => {
    if (cat) {
      setEditingCat({ ...cat });
    } else {
      setEditingCat({ title: '', type: 'main', order: categories.length + 1, parentId: '' });
    }
    setShowModal(true);
  };

  const mainCats = categories.filter(c => c.type === 'main');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Folder className="w-6 h-6 text-emerald-500" />
            Quản lý Chuyên mục / Danh mục
          </h1>
          <p className="text-slate-500 text-sm mt-1">Thêm dòng chuyên mục mới để hiển thị trên Dashboard & Document.</p>
        </div>
        <button 
          onClick={() => openForm()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Danh Mục
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Đang tải cấu trúc...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Chưa có danh mục nào. Hãy tạo mới!</div>
        ) : (
          <div className="divide-y divide-slate-100 p-4">
            {mainCats.map(main => (
              <div key={main.id} className="py-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <Folder className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-slate-800">{main.title}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-200 rounded text-slate-600">STT: {main.order}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openForm(main)} className="p-1.5 text-slate-400 hover:text-emerald-600 bg-white rounded shadow-sm border border-slate-200 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(main.id, e)} 
                      className={cn(
                        "p-1.5 rounded shadow-sm border transition-colors",
                        deletingId === main.id ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600" : "bg-white text-slate-400 border-slate-200 hover:text-rose-600"
                      )}
                      title={deletingId === main.id ? "Nhấn lần nữa để xóa" : "Xóa"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Sub cats */}
                {categories.filter(c => c.parentId === main.id).map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-2 pl-12 mt-1 hover:bg-slate-50 rounded group">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      <span className="text-slate-700">{sub.title}</span>
                    </div>
                    <div className="flex gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openForm(sub)} className="p-1.5 text-slate-400 hover:text-emerald-600 bg-white rounded shadow-sm border border-slate-200 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(sub.id, e)} 
                        className={cn(
                          "p-1.5 rounded shadow-sm border transition-colors",
                          deletingId === sub.id ? "bg-rose-500 text-white border-rose-500 hover:bg-rose-600" : "bg-white text-slate-400 border-slate-200 hover:text-rose-600"
                        )}
                        title={deletingId === sub.id ? "Nhấn lần nữa để xóa" : "Xóa"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingCat.id ? 'Sửa Danh mục' : 'Thêm Danh mục Mới'}</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục *</label>
                <input 
                  required
                  value={editingCat.title}
                  onChange={e => setEditingCat({...editingCat, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loại</label>
                  <select 
                    value={editingCat.type}
                    onChange={e => setEditingCat({...editingCat, type: e.target.value as 'main'|'sub', parentId: ''})}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="main">Thư mục chính</option>
                    <option value="sub">Thư mục con</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thứ tự ưu tiên</label>
                  <input 
                    type="number"
                    value={editingCat.order}
                    onChange={e => setEditingCat({...editingCat, order: Number(e.target.value)})}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              {editingCat.type === 'sub' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thuộc mục mẹ *</label>
                  <select 
                    required
                    value={editingCat.parentId || ''}
                    onChange={e => setEditingCat({...editingCat, parentId: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Chọn thư mục mẹ --</option>
                    {mainCats.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">Hủy</button>
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
