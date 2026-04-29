import React, { useEffect, useState } from 'react';
import { Bell, Info, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Task } from '../types';
import { Link } from 'react-router-dom';

interface NotificationItem {
  id: string;
  type: 'info' | 'urgent' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export default function Notifications() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userProfile) return;
      try {
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('assigneeIds', 'array-contains', userProfile.id)
        );
        const snapshot = await getDocs(tasksQuery);
        
        const now = new Date();
        const generatedNotifications: NotificationItem[] = [];
        
        snapshot.docs.forEach(doc => {
          const task = { id: doc.id, ...doc.data() } as Task;
          if (task.status === 'completed') return;

          const deadlineDate = new Date(task.deadline);
          const timeDiff = deadlineDate.getTime() - now.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

          if (daysDiff < 0) {
            generatedNotifications.push({
              id: task.id + '_overdue',
              type: 'urgent',
              title: 'Công việc quá hạn',
              message: `Công việc "${task.title}" đã quá hạn ${Math.abs(daysDiff)} ngày. Vui lòng hoàn thành ngay.`,
              timestamp: task.deadline,
              isRead: false,
              link: '/tasks'
            });
          } else if (daysDiff <= 3) {
            generatedNotifications.push({
              id: task.id + '_upcoming',
              type: 'info',
              title: 'Sắp đến deadline công việc',
              message: `Công việc "${task.title}" sẽ đến hạn trong ${daysDiff} ngày nữa.`,
              timestamp: task.deadline,
              isRead: false,
              link: '/tasks'
            });
          }
        });

        // Sort by urgency then date
        generatedNotifications.sort((a, b) => {
           if (a.type === 'urgent' && b.type !== 'urgent') return -1;
           if (b.type === 'urgent' && a.type !== 'urgent') return 1;
           return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });

        setNotifications(generatedNotifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [userProfile]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'urgent': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBgColor = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white';
    switch (type) {
      case 'info': return 'bg-blue-50';
      case 'urgent': return 'bg-rose-50';
      case 'success': return 'bg-emerald-50';
      default: return 'bg-slate-50';
    }
  };

  const NotificationContent: React.FC<{ note: NotificationItem }> = ({ note }) => (
    <div 
      className={cn(
        "p-5 rounded-xl border border-slate-200 transition-all hover:shadow-md flex gap-4 items-start relative overflow-hidden",
        getBgColor(note.type, note.isRead),
        !note.isRead && "border-l-4 border-l-emerald-500",
        "bg-white hover:bg-slate-50/80 cursor-pointer"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        note.isRead ? "bg-slate-100" : "bg-white shadow-sm"
      )}>
        {getIcon(note.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-1">
          <h3 className={cn("font-bold truncate pr-4 text-base", note.isRead ? "text-slate-700" : "text-slate-900")}>
            {note.title}
          </h3>
          <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
            <Calendar className="w-3 h-3" />
            {note.timestamp && new Date(note.timestamp).toLocaleDateString('vi-VN', {
              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
            })}
          </span>
        </div>
        <p className={cn("text-sm mt-1 leading-relaxed", note.isRead ? "text-slate-500" : "text-slate-700 font-medium")}>
          {note.message}
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-500" />
            Thông báo trung tâm
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cập nhật những thông tin mới nhất về công việc và hệ thống.</p>
        </div>
      </div>

      {loading ? (
         <div className="p-10 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium">Đang tải thông báo...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-16 text-center space-y-4 bg-slate-50 rounded-2xl border border-slate-100">
          <Bell className="w-16 h-16 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700">Không có thông báo nào</h3>
          <p className="text-slate-500 mb-4">Bạn không có công việc nào quá hạn hoặc sắp đến hạn cần lưu ý.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((note) => (
             note.link ? (
               <Link to={note.link} key={note.id} className="block group">
                 <NotificationContent note={note} />
               </Link>
             ) : (
               <NotificationContent key={note.id} note={note} />
             )
          ))}
        </div>
      )}
    </div>
  );
}
