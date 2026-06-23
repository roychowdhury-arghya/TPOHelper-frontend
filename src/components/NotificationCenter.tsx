import React, { useState } from 'react';
import { Bell, X, Check, Info, Award, Briefcase, Calendar, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'drive_created' | 'application_status' | 'interview_scheduled' | 'offer_received' | 'placement_completed' | 'system';
  timestamp: string;
  read: boolean;
  studentId?: string; // Optional filtering for students
}

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
  onClearAll
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'drive_created':
        return <Briefcase className="text-blue-500" size={16} />;
      case 'offer_received':
        return <Award className="text-teal-400" size={16} />;
      case 'placement_completed':
        return <Check className="text-emerald-500" size={16} />;
      case 'interview_scheduled':
        return <Calendar className="text-amber-500" size={16} />;
      case 'application_status':
      default:
        return <Info className="text-indigo-400" size={16} />;
    }
  };

  return (
    <div className="relative">
      {/* Trigger Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors focus:outline-none"
        title="Notification Center"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[500px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-850 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-white text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllAsRead}
                      className="text-xs text-slate-400 hover:text-teal-400 transition-colors font-medium"
                    >
                      Read All
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={onClearAll}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                      title="Clear All"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto max-h-[380px] custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                    <Bell className="text-slate-600 opacity-30" size={36} />
                    <p className="text-xs text-slate-400">All caught up! No notifications yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-850">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!item.read) onMarkAsRead(item.id);
                        }}
                        className={`p-3.5 flex gap-3 transition-colors cursor-pointer ${
                          item.read ? 'bg-transparent' : 'bg-blue-500/5 hover:bg-blue-500/10'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0 p-1.5 bg-slate-800 rounded-lg">
                          {getIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs font-bold truncate ${item.read ? 'text-slate-300' : 'text-white'}`}>
                              {item.title}
                            </p>
                            <span className="text-[9px] text-slate-500 shrink-0 font-medium">{item.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed break-words">
                            {item.message}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClearNotification(item.id);
                          }}
                          className="text-slate-600 hover:text-slate-400 self-center shrink-0 p-1 hover:bg-slate-800 rounded transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
