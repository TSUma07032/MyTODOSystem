// src/components/ui/Badge.tsx
import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', icon }) => {
  const variants = {
    info: "bg-blue-100 text-blue-700 border-blue-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-orange-100 text-orange-700 border-orange-200",
    danger: "bg-red-100 text-red-700 border-red-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200"
  };

  return (
    <span className={clsx("flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md border shadow-sm", variants[variant])}>
      {icon && <span className="w-3 h-3 flex items-center justify-center">{icon}</span>}
      {children}
    </span>
  );
};