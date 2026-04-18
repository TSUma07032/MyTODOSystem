// src/core/components/Toast.tsx
import React from 'react';
import { clsx } from 'clsx';

interface ToastProps {
  message: string;
  variant?: 'success' | 'warning' | 'critical' | 'info';
  prefix?: string; // 呼び出し元が自由にアイコンや文字を渡せるようにする
}

export const Toast: React.FC<ToastProps> = ({ message, variant = 'success', prefix }) => {
  const styles = {
    info: 'bg-slate-800',
    success: 'bg-emerald-500',
    warning: 'bg-gradient-to-r from-amber-400 to-orange-500 scale-110',
    critical: 'bg-gradient-to-r from-red-500 to-pink-600 scale-125 rotate-2'
  };

  return (
    <div className={clsx(
      "fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full font-black text-white shadow-2xl transition-all pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300",
      styles[variant]
    )}>
      {prefix}{message}
    </div>
  );
};