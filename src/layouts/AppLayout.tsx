import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, CheckSquare, Bell, Users, Settings, LogOut, Menu, X, Building2, Map, FolderCog, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { userProfile, logout, isAdminOrManager } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tài liệu & Scheme', href: '/documents', icon: FileText },
    { name: 'Công việc / Deadline', href: '/tasks', icon: CheckSquare },
    { name: 'Thông báo', href: '/notifications', icon: Bell },
    { name: 'Thông tin vùng', href: '/regional', icon: Map },
  ];

  if (isAdminOrManager) {
    navigation.push({ name: 'Quản trị nhân sự', href: '/admin/users', icon: Users });
    navigation.push({ name: 'Quản lý Chuyên mục', href: '/admin/categories', icon: FolderCog });
  }

  return (
    <div className="min-h-screen bg-brand-50 flex font-sans text-slate-900 overflow-hidden">
      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)} 
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 glass-dark text-white flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
                <span className="flex items-center gap-2 font-display font-bold tracking-tight text-white italic">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl">TRADE HUB</span>
                </span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group relative overflow-hidden",
                        isActive ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30" : "text-slate-300 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 mr-3 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 glass-dark text-white z-20 m-4 rounded-2xl shadow-2xl">
        <div className="flex items-center h-20 px-8 border-b border-white/10">
          <span className="flex items-center gap-3 font-display font-bold text-xl tracking-tight text-white italic">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 animate-float">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            TRADE HUB
          </span>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto scrollbar-hide">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-4 py-3.5 text-[15px] font-semibold rounded-xl transition-all duration-300 group relative overflow-hidden",
                  isActive 
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/30" 
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5 mr-4 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                {item.name}
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* User profile lower part */}
        <div className="p-6 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-6 p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-brand-500 text-white font-bold flex items-center justify-center text-sm shadow-inner overflow-hidden">
              {userProfile?.name?.charAt(0)?.toUpperCase() || <Users className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white truncate leading-tight">{userProfile?.name}</p>
              <p className="text-[11px] text-brand-300 font-medium uppercase tracking-wider mt-1">{userProfile?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-bold text-rose-400 rounded-xl hover:bg-rose-500/10 transition-all duration-200 border border-transparent hover:border-rose-500/20"
          >
            <LogOut className="w-4 h-4 mr-3" /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:pl-80 flex flex-col w-full h-screen relative">
        {/* Topbar mobile */}
        <div className="lg:hidden sticky top-0 z-10 flex items-center justify-between h-16 px-4 glass shadow-sm">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-700">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-display font-bold text-brand-600 tracking-tight text-lg italic">TRADE HUB</span>
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 border border-brand-200 font-bold flex items-center justify-center text-sm">
            {userProfile?.name?.charAt(0)?.toUpperCase()}
          </div>
        </div>
        
        {/* Desktop Header */}
        <header className="hidden lg:flex h-20 bg-transparent items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-display font-bold text-slate-800">
              {navigation.find(n => n.href === location.pathname)?.name || 'Hệ thống'}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 px-4 py-2 bg-white/60 backdrop-blur-sm border border-white/60 rounded-full text-[13px] font-bold text-slate-600 shadow-sm transition-all hover:bg-white/80">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Hệ thống Online
            </div>
            
            <button className="relative p-2 text-slate-500 hover:text-brand-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-brand-50"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full flex flex-col px-4 sm:px-6 lg:px-8 pb-8">
          <div className="flex-1 max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, scale: 0.995 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.995 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="py-4"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Enhanced Footer */}
          <footer className="w-full mt-auto py-8 text-center text-sm">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center justify-center space-x-3 px-8 py-3 rounded-2xl glass-hover"
            >
              <div className="p-1.5 bg-brand-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-brand-600" />
              </div>
              <span className="text-slate-500 font-semibold tracking-wide">Developed with passion by</span>
              <span className="font-display font-black text-lg bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 uppercase italic">
                nguyenthanhnghia
              </span>
            </motion.div>
          </footer>
        </main>
      </div>
    </div>
  );
}
