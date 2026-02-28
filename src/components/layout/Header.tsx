// src/components/layout/Header.tsx
import React from 'react';
import { Coins, Repeat, FolderOpen } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  mode: 'dashboard' | 'daily' | 'sync' | 'history' | 'calendar';
  themeIcon: React.ElementType;  // モードごとに切り替わるアイコン（Sun, Moon, etc.）
  themeAccent: string;           // モードごとのアクセントカラー（'orange', 'purple', etc.）
  coins: number;
  isReady: boolean;
  onOpenShop: () => void;
  onOpenRoutines: () => void;
  onConnectFolder: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  themeIcon: CurrentIcon,
  themeAccent,
  coins,
  isReady,
  onOpenShop,
  onOpenRoutines,
  onConnectFolder
}) => {
  // Sync（Night）モードかどうかでベースのスタイルを切り替え
  const isSync = mode === 'sync';

  return (
    <header className={`px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-700 ${isSync ? "bg-black/20 border-white/10" : "bg-white/60 border-white/40"}`}>
      
      {/* 左側：ロゴと現在のモードアイコン */}
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl shadow-sm transition-all duration-500 active:scale-90 ${isSync ? 'bg-white/10 text-white' : `bg-${themeAccent}-100 text-${themeAccent}-500`}`}>
          <CurrentIcon className="w-6 h-6" />
        </div>
        <h1 className={`text-xl font-black tracking-tight transition-colors duration-700 ${isSync ? "text-white" : "text-slate-800"}`}>
          My Ultimate TODO
        </h1>
      </div>

      {/* 右側：各種アクションボタン群 */}
      <div className="flex items-center gap-3">
        
        {/* コイン＆ショップボタン（固有のデザインを持つためネイティブのbuttonタグでスタイリング） */}
        <button 
          onClick={onOpenShop} 
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black shadow-sm transition-all active:scale-95 bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200"
        >
          <Coins className="w-5 h-5 fill-yellow-500 text-yellow-600" />
          {coins.toLocaleString()}
        </button>

        {/* ルーチン設定ボタン（作った共通UIの Button コンポーネントを活用！） */}
        <Button 
          size="sm" 
          variant="secondary" 
          icon={<Repeat className="w-4 h-4" />} 
          onClick={onOpenRoutines}
        >
          Routines
        </Button>

        {/* ローカルフォルダ同期ボタン */}
        <button 
          onClick={onConnectFolder} 
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all ${isReady ? "bg-green-500 text-white" : "bg-white text-red-500 border-2 border-red-200 animate-pulse"}`}
        >
          <FolderOpen className="w-4 h-4" />
          {isReady ? "Local Linked" : "Connect Folder"}
        </button>
        
      </div>
    </header>
  );
};