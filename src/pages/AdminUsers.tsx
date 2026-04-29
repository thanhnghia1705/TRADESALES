import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Users, Mail, Shield, ShieldAlert, Trash2, ShieldOff, Search, Calendar } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Navigate } from 'react-router-dom';

export default function AdminUsers() {
  const { userProfile, isAdminOrManager } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isAdminOrManager) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
      setUsers(userData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleUpdateRole = async (userId: string, newRole: User['role']) => {
    if (!isAdminOrManager) return;
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Không thể cập nhật quyền hạn.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdminOrManager) return;
    if (userId === userProfile?.id) {
      alert('Bạn không thể xóa chính mình.');
      return;
    }
    
    if (deletingId === userId) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setDeletingId(null);
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Không thể xóa người dùng.');
      }
    } else {
      setDeletingId(userId);
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase()?.includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header section */}
      <div className="bg-brand-600 rounded-[40px] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                <Users className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight italic uppercase text-white">Quản trị Nhân sự</h1>
          </div>
          <p className="text-brand-100 mt-2 max-w-2xl text-lg font-medium leading-relaxed">
            Chặn, xóa hoặc phân quyền cho các thành viên tham gia hệ thống TRADE HUB.
          </p>
        </div>
        
        <div className="absolute top-0 right-10 p-8 opacity-20 blur-xl md:blur-3xl pointer-events-none">
          <Users className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass rounded-[32px] p-6 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between border-white/60">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Tìm kiếm thành viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white/60 border-2 border-white rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium text-slate-700"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-brand-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-600/20">
            {users.length} THÀNH VIÊN
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="glass rounded-[32px] border-white/60 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/30 backdrop-blur-md border-b border-white/40">
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Nhân sự</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Quyền hạn</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest">Từ ngày</th>
                <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Phân quyền / Chặn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              <AnimatePresence>
                {filteredUsers.map((user, i) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "group transition-all",
                      user.role === 'blocked' ? "bg-rose-50/30 grayscale-[0.5]" : "hover:bg-white/40"
                    )}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white transition-transform group-hover:scale-110",
                          user.role === 'admin' ? "bg-brand-600 text-white" : 
                          user.role === 'blocked' ? "bg-rose-500 text-white" : "bg-white text-brand-600"
                        )}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-display font-black text-slate-800 tracking-tight flex items-center gap-2">
                            {user.name} 
                            {user.id === userProfile?.id && <span className="text-[10px] bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Bạn</span>}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">
                            <Mail className="w-3.5 h-3.5" /> {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {user.role === 'admin' && <Shield className="w-4 h-4 text-brand-600" />}
                        {user.role === 'manager' && <ShieldAlert className="w-4 h-4 text-emerald-600" />}
                        {user.role === 'sales' && <Users className="w-4 h-4 text-slate-400" />}
                        {user.role === 'blocked' && <ShieldOff className="w-4 h-4 text-rose-500" />}
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          user.role === 'admin' ? "bg-brand-100 text-brand-600 border border-brand-200" :
                          user.role === 'manager' ? "bg-emerald-100 text-emerald-600 border border-emerald-200" :
                          user.role === 'blocked' ? "bg-rose-100 text-rose-600 border border-rose-200" :
                          "bg-slate-100 text-slate-500 border border-slate-200"
                        )}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <Calendar className="w-4 h-4 text-slate-300" />
                        {user.createdAt ? formatDate(user.createdAt) : '---'}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="inline-flex items-center gap-1 bg-white/60 p-1.5 rounded-2xl border border-white shadow-inner">
                          <button 
                            onClick={() => handleUpdateRole(user.id, 'admin')}
                            title="Nâng cấp Admin"
                            disabled={user.id === userProfile?.id}
                            className={cn(
                              "w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-110",
                              user.role === 'admin' ? "bg-brand-600 text-white shadow-lg" : "text-slate-300 hover:text-brand-600 hover:bg-white"
                            )}
                          >
                            <Shield className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleUpdateRole(user.id, 'manager')}
                            title="Quyền Quản lý"
                            disabled={user.id === userProfile?.id}
                            className={cn(
                              "w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-110",
                              user.role === 'manager' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-300 hover:text-emerald-600 hover:bg-white"
                            )}
                          >
                            <ShieldAlert className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleUpdateRole(user.id, 'sales')}
                            title="Quyền Xem"
                            disabled={user.id === userProfile?.id}
                            className={cn(
                              "w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-105",
                              user.role === 'sales' ? "bg-slate-400 text-white shadow-lg" : "text-slate-300 hover:text-slate-600 hover:bg-white"
                            )}
                          >
                            <Users className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleUpdateRole(user.id, 'blocked')}
                            title="CHẶN NGAY"
                            disabled={user.id === userProfile?.id}
                            className={cn(
                              "w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-110",
                              user.role === 'blocked' ? "bg-rose-600 text-white shadow-lg" : "text-slate-300 hover:text-rose-600 hover:bg-white"
                            )}
                          >
                            <ShieldOff className="w-5 h-5" />
                          </button>
                        </div>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          title={deletingId === user.id ? "Nhấn lần nữa để xóa" : "Xóa"}
                          className={cn(
                            "w-12 h-12 flex items-center justify-center border rounded-[20px] shadow-lg transition-all active:scale-95",
                            deletingId === user.id ? "bg-rose-500 text-white border-rose-500 hover:scale-105" : "bg-white text-slate-400 hover:text-rose-600 border-white hover:scale-105"
                          )}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

