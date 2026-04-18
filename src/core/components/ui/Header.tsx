import React, { useState, useRef, useEffect } from 'react';
import { 
  Repeat, FolderOpen, // 🪙Coins, Serverを削除
  Sun, Moon, CalendarDays, History as HistoryIcon, CheckSquare,
  Copy, CheckCircle, Sparkles, ArrowRight, Timer
} from 'lucide-react';

// 🚀 Shop, Infrastructure, coins などのPropsをパージ！
interface HeaderProps {
  mode: 'dashboard' | 'daily' | 'sync' | 'history' | 'calendar' | 'pomodoro';
  setMode: (mode: 'dashboard' | 'daily' | 'sync' | 'history' | 'calendar' | 'pomodoro') => void;
  themeIcon: React.ElementType;
  themeAccent: string;
  isReady: boolean;
  onOpenRoutines: () => void;
  onConnectFolder: () => void;
  onCopy?: () => void;
  copied?: boolean;
  onSync?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  themeIcon: CurrentIcon,
  themeAccent,
  isReady,
  onOpenRoutines,
  onConnectFolder,
  onCopy,
  copied,
  onSync,
  isSyncing,
}) => {
  const isSync = mode === 'sync';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // メニュー外クリックで閉じる処理
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // モードリスト
  const modes = [
    { id: 'dashboard', label: 'Mission', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50 hover:bg-orange-100' },
    { id: 'daily', label: 'Daily', icon: CheckSquare, color: 'text-indigo-500', bg: 'bg-indigo-50 hover:bg-indigo-100' },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays, color: 'text-emerald-500', bg: 'bg-emerald-50 hover:bg-emerald-100' },
    { id: 'history', label: 'History', icon: HistoryIcon, color: 'text-blue-500', bg: 'bg-blue-50 hover:bg-blue-100' },
    { id: 'sync', label: 'Night Sync', icon: Moon, color: 'text-purple-500', bg: 'bg-purple-50 hover:bg-purple-100' },
    { id: 'pomodoro', label: 'Focus', icon: Timer, color: 'text-orange-500', bg: 'bg-orange-50 hover:bg-orange-100' },
  ] as const;

  return (
    <nav className={`w-20 h-full flex flex-col items-center py-6 gap-6 z-50 backdrop-blur-xl border-r transition-colors duration-700 shadow-lg shrink-0 ${isSync ? "bg-black/30 border-white/10" : "bg-white/70 border-white/50"}`}>
      
      {/* 👑 トップ：アプリアイコン兼モード切り替えトリガー */}
      <div className="relative" ref={menuRef}>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`p-3 rounded-2xl shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center ${isMenuOpen ? 'ring-2 ring-offset-2 ring-slate-300' : ''} ${isSync ? 'bg-white/10 text-white' : `bg-${themeAccent}-100 text-${themeAccent}-500`}`} 
          title="Switch Mode"
        >
          <CurrentIcon className="w-8 h-8" />
        </button>

        {/* 📋 プルダウンメニュー */}
        {isMenuOpen && (
          <div className="absolute top-0 left-20 ml-4 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 py-2 flex flex-col animate-in slide-in-from-left-2 fade-in duration-200 z-50 overflow-hidden">
            <div className="px-4 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase border-b border-slate-100 mb-2">
              Select View
            </div>
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id); setIsMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-bold transition-all ${mode === m.id ? `${m.bg} ${m.color} shadow-sm` : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <m.icon className="w-4 h-4" />
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 🕹️ 中央：ルーチン機能へのアクセス（ショップ等はパージ完了！） */}
      <div className="flex-1 flex flex-col gap-5 items-center w-full mt-4">
        {/* Routines */}
        <button onClick={onOpenRoutines} className="group relative flex flex-col items-center gap-1 w-full hover:bg-black/5 py-2 rounded-2xl transition-all">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center border border-indigo-200 shadow-sm group-hover:scale-110 group-active:scale-95 transition-all">
            <Repeat className="w-6 h-6 text-indigo-600" />
          </div>
          <span className={`text-[10px] font-bold ${isSync ? "text-indigo-400" : "text-indigo-700"}`}>Routine</span>
          <span className="absolute left-20 px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">Routines</span>
        </button>
      </div>

      {/* 🚀 ボトムアクション（コピー・同期・フォルダ） */}
      <div className="mt-auto w-full flex flex-col items-center gap-4">
        
        {/* モード固有のアクションボタン */}
        {mode === 'sync' ? (
          <button onClick={onSync} disabled={isSyncing} className="group relative flex flex-col items-center p-2 rounded-2xl transition-all">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all group-active:scale-95 ${isSyncing ? "bg-slate-700 text-slate-400" : "bg-gradient-to-br from-purple-500 to-indigo-600 text-white group-hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30"}`}>
              {isSyncing ? <Sparkles className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
            </div>
            <span className="absolute left-20 px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">Finish Day</span>
          </button>
        ) : (
          <button onClick={onCopy} className="group relative flex flex-col items-center p-2 rounded-2xl transition-all">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all group-active:scale-95 ${copied ? "bg-emerald-500 text-white scale-110" : "bg-gradient-to-br from-orange-400 to-pink-500 text-white group-hover:scale-110 hover:shadow-lg hover:shadow-orange-500/30"}`}>
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </div>
            <span className="absolute left-20 px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">{copied ? "Copied!" : "Copy Mission"}</span>
          </button>
        )}

        {/* フォルダ接続状態 */}
        <button onClick={onConnectFolder} className="group relative flex flex-col items-center p-2 rounded-2xl transition-all">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all group-hover:scale-110 group-active:scale-95 ${isReady ? "bg-emerald-100 text-emerald-600" : "bg-white text-rose-500 border-2 border-rose-200 animate-pulse"}`}>
            <FolderOpen className="w-4 h-4" />
          </div>
          <span className="absolute left-20 px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl z-50">{isReady ? "Sync Active" : "Connect Folder"}</span>
        </button>
      </div>
    </nav>
  );
};