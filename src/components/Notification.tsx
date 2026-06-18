import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastType {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface NotificationProps {
  toast: ToastType | null;
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto close after 5s
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="text-emerald-400" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-400" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-amber-400" size={20} />;
      case 'info':
      default:
        return <Info className="text-blue-400" size={20} />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-500/30';
      case 'error':
        return 'border-red-500/30';
      case 'warning':
        return 'border-amber-500/30';
      case 'info':
      default:
        return 'border-blue-500/30';
    }
  };

  const getGlow = () => {
    switch (toast.type) {
      case 'success':
        return 'shadow-[0_0_20px_rgba(16,185,129,0.15)]';
      case 'error':
        return 'shadow-[0_0_20px_rgba(239,68,68,0.15)]';
      case 'warning':
        return 'shadow-[0_0_20px_rgba(245,158,11,0.15)]';
      case 'info':
      default:
        return 'shadow-[0_0_20px_rgba(59,130,246,0.15)]';
    }
  };

  return (
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 bg-slate-900/90 backdrop-blur-md border ${getBorderColor()} ${getGlow()} p-4 rounded-xl max-w-sm animate-slide-in`}
      style={{
        animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      }}
    >
      <div className="flex-shrink-0">{getIcon()}</div>
      <div className="flex-1 text-sm text-slate-100 font-medium pr-2">{toast.message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
