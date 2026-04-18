// src/core/components/Drawer.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  headerColorClass?: string;
  children: React.ReactNode;
  widthClass?: string; // ← 追加: 画面によって幅を変えられるようにする
}

export const Drawer: React.FC<DrawerProps> = ({ 
  isOpen, onClose, title, icon, 
  headerColorClass = "bg-slate-50 border-slate-100 text-slate-800", 
  children,
  widthClass = "w-80 md:w-96"
}) => {
  // ESCキーで閉じる処理
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <>
      {/* 背景のオーバーレイ (クリックで閉じる) */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={onClose}
      />

      {/* ドロワー本体 */}
      <div className={`fixed inset-y-0 right-0 ${widthClass} bg-white/95 backdrop-blur-2xl shadow-2xl border-l transform transition-transform duration-500 z-[100] flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className={`p-5 flex justify-between items-center border-b ${headerColorClass}`}>
          <div className="flex items-center gap-2 font-bold">
            {icon} <h2>{title}</h2>
          </div>
          <IconButton onClick={onClose}><X className="w-5 h-5" /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          {children}
        </div>
      </div>
    </>
  );
};