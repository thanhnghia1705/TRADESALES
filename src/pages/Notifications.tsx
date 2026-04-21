import React from 'react';
import { Bell, Info, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Notifications() {
  const mockNotifications = [
    {
      id: 1,
      type: 'info',
      title: 'Hệ thống cập nhật tính năng mới',
      message: 'Tính năng quản lý công việc đã được nâng cấp với giao diện Dark Mode ấn tượng.',
      timestamp: new Date().toISOString(),
      isRead: false,
    },
    {
      id: 2,
      type: 'urgent',
      title: 'Quá hạn Deadline báo cáo',
      message: 'Bạn có 1 báo cáo khảo sát cửa hàng quý 1 đã quá hạn. Vui lòng cập nhật ngay.',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      isRead: false,
    },
    {
      id: 3,
      type: 'success',
      title: 'Hoàn thành chương trình trưng bày',
      message: 'Chúc mừng bạn đã hoàn thành xuất sắc chỉ tiêu trưng bày POSM tháng 3.',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      isRead: true,
    },
     {
      id: 4,
      type: 'info',
      title: 'Nhắc nhở cuộc họp Trade Marketing',
      message: 'Cuộc họp tổng kết tháng sẽ diễn ra vào 14:00 chiều nay tại phòng M1.',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      isRead: true,
    }
  ];

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-500" />
            Thông báo trung tâm
          </h1>
          <p className="text-sm text-slate-500 mt-1">Cập nhật những thông tin mới nhất từ hệ thống và phòng ban.</p>
        </div>
        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="space-y-4">
        {mockNotifications.map((note) => (
          <div 
            key={note.id} 
            className={cn(
              "p-5 rounded-xl border border-slate-200 transition-all hover:shadow-md flex gap-4 items-start relative overflow-hidden",
              getBgColor(note.type, note.isRead),
              !note.isRead && "border-l-4 border-l-emerald-500"
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
                <h3 className={cn("font-bold truncate pr-4", note.isRead ? "text-slate-700" : "text-slate-900")}>
                  {note.title}
                </h3>
                <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                  <Calendar className="w-3 h-3" />
                  {new Date(note.timestamp).toLocaleDateString('vi-VN', {
                    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                  })}
                </span>
              </div>
              <p className={cn("text-sm", note.isRead ? "text-slate-500" : "text-slate-600")}>
                {note.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
