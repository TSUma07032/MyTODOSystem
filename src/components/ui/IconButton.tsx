// src/components/ui/IconButton.tsx
import React from 'react';
import { clsx } from 'clsx';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'danger' | 'success';
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  children, variant = 'ghost', className, ...props 
}) => {
  const variants = {
    ghost: "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
    danger: "text-red-400 hover:text-red-600 hover:bg-red-50",
    success: "text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
  };

  return (
    <button 
      className={clsx("p-2 rounded-full transition-colors flex items-center justify-center", variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};