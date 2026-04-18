// src/components/ui/Button.tsx
import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', icon, className, ...props 
}) => {
  const baseStyle = "flex items-center justify-center gap-2 font-bold rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";
  
  const variants = {
    primary: "bg-indigo-500 text-white hover:bg-indigo-600",
    secondary: "bg-white text-indigo-500 border border-indigo-100 hover:bg-indigo-50",
    ghost: "bg-transparent text-slate-500 hover:bg-black/5 shadow-none",
    danger: "bg-white text-red-500 border border-red-200 hover:bg-red-50",
    gradient: "bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:shadow-lg"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button className={clsx(baseStyle, variants[variant], sizes[size], className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
};