// src/core/components/Toast.tsx
import React from 'react';
import { clsx } from 'clsx';


export const Toast: React.FC = (
) => {
  const styles = {
    info: 'bg-slate-800',
    success: 'bg-emerald-500',
    warning: 'bg-gradient-to-r from-amber-400 to-orange-500 scale-110',
    critical: 'bg-gradient-to-r from-red-500 to-pink-600 scale-125 rotate-2'
  };

  const variant = 'success'; // 仮のvariant
  const message = 'This is a toast message!'; // 仮のメッセージ
  const prefix = variant === 'success' ? '✅ ' : ''; // 成功ならチェックマークをプレフィックスにする例
  return (
    <div className={clsx(
      "fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full font-black text-white shadow-2xl transition-all pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300",
      styles[variant]
    )}>
      {prefix}{message}
    </div>
  );
};