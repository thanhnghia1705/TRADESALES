import React from 'react';
import { Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Login() {
  const { login, currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      {/* Animated Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-200/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/30 rounded-full blur-[100px]"></div>
      </div>

      <div className="hidden lg:flex lg:w-[60%] bg-brand-600 relative justify-center items-center p-20 z-10 overflow-hidden">
        {/* Abstract pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[size:40px_40px]"></div>
        
        <div className="w-full max-w-lg space-y-10 relative z-20">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-4"
          >
             <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-[20px] flex items-center justify-center shadow-2xl group transition-transform hover:scale-110">
                <Building2 className="w-10 h-10 text-white" />
             </div>
             <h1 className="text-5xl font-display font-black tracking-tighter text-white uppercase italic">TRADE HUB</h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <p className="text-brand-50 text-2xl font-display font-medium leading-tight">
              Hệ thống thông tin chiến lược & Điều phối thực thi dành cho Trade Marketing & Sales.
            </p>
            <p className="text-brand-100/70 text-lg">
              Tập trung tất cả thông báo, tài liệu và kế hoạch triển khai của bạn tại một nơi duy nhất.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3"
          >
            {[...Array(3)].map((_, i) => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all duration-500", i === 0 ? "w-12 bg-white" : "w-3 bg-white/30")}></div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center p-8 bg-white/40 backdrop-blur-3xl z-10 relative border-l border-white/20 shadow-2xl">
        <div className="w-full max-w-md space-y-10 relative">
          <div className="text-center lg:text-left space-y-4 lg:hidden">
            <div className="w-20 h-20 bg-brand-600 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-600/20">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-display font-black text-slate-800 tracking-tighter italic">TRADE HUB</h2>
          </div>
          
          <div className="lg:text-left text-center">
            <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">Chào mừng trở lại!</h2>
            <p className="text-slate-500 font-medium mt-3">Sử dụng tài khoản nội bộ Google Workspace để truy cập.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={login}
            className="w-full flex items-center justify-center gap-4 bg-white border border-slate-200 text-slate-700 py-4.5 px-6 rounded-[24px] font-bold text-lg hover:bg-slate-50 transition-all shadow-xl shadow-slate-200/50 group"
          >
            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center shadow-inner group-hover:bg-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            Tiếp tục với Google
          </motion.button>
          
          <div className="space-y-6 pt-4">
             <div className="flex items-center gap-4 text-slate-300">
               <div className="h-px bg-slate-200 flex-1"></div>
               <span className="text-[10px] font-black uppercase tracking-widest">Security First</span>
               <div className="h-px bg-slate-200 flex-1"></div>
             </div>
             <p className="text-center lg:text-left text-[11px] text-slate-400 font-bold leading-relaxed opacity-80 italic">
               Truy cập hệ thống đồng nghĩa với việc bạn đồng ý với các chính sách Bảo mật Thông tin và Quy tắc Ứng xử Công nghệ của công ty.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

