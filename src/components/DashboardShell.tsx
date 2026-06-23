import React, { useState } from 'react';
import { Menu, ChevronLeft, ChevronRight, LogOut, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { NotificationCenter } from './NotificationCenter';
import type { AppNotification } from './NotificationCenter';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface DashboardShellProps {
  role: 'student' | 'admin';
  userName: string;
  userSub: string;
  avatarInitials: string;
  profilePic?: string;
  menuItems: MenuItem[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onLogout: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onClearAll: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  role,
  userName,
  userSub,
  avatarInitials,
  profilePic,
  menuItems,
  activeTab,
  setActiveTab,
  onLogout,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onClearAll,
  theme,
  toggleTheme,
  children
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-white transition-colors duration-300">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-400 hover:text-slate-200 md:hidden rounded-lg hover:bg-slate-900 transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <Logo size={32} showWordmark={true} />
        </div>

        {/* Top Navbar Actions */}
        <div className="flex items-center gap-4">
          
          {/* Centralized Notifications */}
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
            onMarkAllAsRead={onMarkAllAsRead}
            onClearNotification={onClearNotification}
            onClearAll={onClearAll}
          />

          {/* Theme Switcher Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-all"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-blue-600" />}
          </button>

          {/* User Profile Badge (Right Side) */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-900">
            <div className="avatar flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md overflow-hidden">
              {profilePic ? (
                <img src={profilePic} alt={userName} className="h-full w-full object-cover" />
              ) : (
                avatarInitials
              )}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-white max-w-[120px] truncate leading-tight">
                {userName}
              </span>
              <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5 leading-none">
                {userSub}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        
        {/* Mobile Navigation Drawer Backdrop */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar Drawer */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 top-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-900 p-5 flex flex-col justify-between md:hidden"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <Logo size={28} />
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </div>

                <nav className="flex flex-col gap-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === item.id
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  onLogout();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors mt-auto"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Desktop Sidebar */}
        <aside
          className={`desktop-sidebar ${isCollapsed ? 'collapsed' : ''}`}
        >
          <div className="flex flex-col gap-4">
            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="self-end p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Profile Brief Info */}
            {!isCollapsed && (
              <div className="glass-card user-profile-details mb-2 flex flex-col items-center text-center p-5 border-b border-slate-900/50">
                <div className="avatar h-10 w-10 flex items-center justify-center rounded-full text-sm font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md mb-2">
                  {avatarInitials}
                </div>
                <h4 className="font-semibold text-white truncate max-w-full font-display text-sm">
                  {userName}
                </h4>
                <p className="text-[10px] text-blue-500 font-bold uppercase mt-0.5 tracking-wider">
                  {role === 'student' ? userSub : 'Coordinator'}
                </p>
              </div>
            )}

            {/* Nav Menu */}
            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`menu-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-600/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Logout footer */}
          <button
            onClick={onLogout}
            className={`menu-item flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <span className="shrink-0"><LogOut size={18} /></span>
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </aside>

        {/* Content area wrapper */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-8 sm:px-6 md:py-8 bg-slate-950">
          <div className="mx-auto" style={{ maxWidth: '1440px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
