// src/components/ui/Toast.tsx
import React from 'react';

interface ToastProps {
  message: string;
  difficulty: number;
}

export const Toast: React.FC<ToastProps> = ({ message, difficulty }) => {
  const getStyle = () => {
    if (difficulty >= 5) return 'bg-gradient-to-r from-red-500 to-pink-600 scale-125 rotate-2';
    if (difficulty >= 3) return 'bg-gradient-to-r from-amber-400 to-orange-500 scale-110';
    return 'bg-emerald-500';
  };

  const getPrefix = () => {
    if (difficulty >= 5) return '💥 CRITICAL! ';
    if (difficulty >= 3) return '✨ ';
    return '';
  };

  return (
    <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full font-black text-white shadow-2xl transition-all pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300 ${getStyle()}`}>
      {getPrefix()}{message}
    </div>
  );
};