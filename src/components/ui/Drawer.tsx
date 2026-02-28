// src/components/ui/Drawer.tsx
import React from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  headerColorClass?: string; // 例: "bg-yellow-50 border-yellow-100 text-yellow-700"
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ 
  isOpen, onClose, title, icon, headerColorClass = "bg-slate-50 border-slate-100 text-slate-800", children 
}) => {
  return (
    <div className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-white/95 backdrop-blur-2xl shadow-2xl border-l transform transition-transform duration-500 z-[100] flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
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
  );
};