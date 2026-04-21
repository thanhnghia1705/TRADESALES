import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Shield, User as UserIcon, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { Navigate } from 'react-router-dom';

export default function AdminUsers() {
  const { isAdminOrManager, userProfile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  if (!isAdminOrManager) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    const fetchUsers = async () => {
      const uQuery = query(collection(db, 'users'));
      const snap = await getDocs(uQuery);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const changeRole = async (userId: string, newRole: 'admin' | 'manager' | 'sales') => {
    if (userId === userProfile?.id) {
      alert('Bạn không thể tự đổi quyền của mình tại đây để tránh mất quyền truy cập.');
      return;
    }
    
    // Optimistic UI
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) {
      console.error(err);
      alert('Không có quyền hoặc có lỗi xảy ra.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản trị Nhân sự & Phân quyền</h1>
        <p className="text-sm text-slate-500">Chỉ Admin và Manager mới có quyền truy cập trang này.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Đang tải danh sách...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nhân sự</th>
                <th className="px-4 py-3 font-medium w-48">Phân quyền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{u.name} {u.id === userProfile?.id && '(Bạn)'}</div>
                        <div className="text-slate-500 text-xs">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as any)}
                      disabled={u.id === userProfile?.id}
                      className={cn(
                        "text-sm border rounded px-3 py-1.5 font-medium outline-none transition-colors",
                        u.role === 'admin' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        u.role === 'manager' ? "bg-slate-100 text-slate-700 border-slate-200" :
                        "bg-slate-50 text-slate-500 border-slate-200"
                      )}
                    >
                      <option value="sales">Sales (Viewer)</option>
                      <option value="manager">Manager (Upload/Edit)</option>
                      {userProfile?.role === 'admin' && <option value="admin">Admin (All Access)</option>}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

