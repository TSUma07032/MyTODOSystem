// src/components/views/HistoryView.tsx
import React from 'react';
import { Search, History as HistoryIcon } from 'lucide-react';

interface HistoryViewProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // App.tsx側でuseMemoを使って生成されているグループ化された履歴データ
  groupedHistory: Record<string, any[]>; 
  viewingLog: string | null;
  onHistoryClick: (item: any) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  searchQuery,
  setSearchQuery,
  groupedHistory,
  viewingLog,
  onHistoryClick
}) => {
  return (
    <div className="flex w-full h-full bg-white/40 backdrop-blur-xl animate-fadeIn">
      
      {/* 左ペイン：検索バー ＆ 履歴リスト */}
      <div className="w-1/3 border-r border-white/30 p-4 flex flex-col gap-4 bg-white/20">
        
        {/* 検索入力フィールド */}
        <div className="relative group z-10">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search memories..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-blue-300 outline-none transition-all shadow-sm text-sm text-slate-800" 
          />
        </div>

        {/* 履歴アイテムリスト */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-blue-200">
          {Object.entries(groupedHistory).length === 0 ? (
            <div className="text-center p-4 text-slate-400 text-sm font-bold mt-10">
              No memories found.
            </div>
          ) : (
            Object.entries(groupedHistory).map(([taskText, logs]) => (
              <div 
                key={taskText} 
                onClick={() => onHistoryClick(logs[0])} 
                className="group p-4 bg-white/60 hover:bg-white/90 rounded-xl shadow-sm border border-transparent hover:border-blue-200 cursor-pointer transition-all"
              >
                <h3 className="font-bold text-gray-700 group-hover:text-blue-700 text-sm line-clamp-2 leading-relaxed">
                  {taskText}
                </h3>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    {/* logs[0].completedAt が存在すると仮定（App.tsxの仕様に基づく） */}
                    {logs[0]?.completedAt?.split('T')[0] || 'Unknown Date'}
                  </span>
                  <span className="text-[10px] font-black text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                    x{logs.length}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右ペイン：ログの詳細（Markdownプレビュー）表示 */}
      <div className="w-2/3 p-8 overflow-y-auto bg-white/30 backdrop-blur-md">
        {viewingLog ? (
          <div className="prose prose-sm max-w-none text-gray-700 animate-fadeIn">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-white/80 p-6 rounded-2xl shadow-sm border border-white/50">
              {viewingLog}
            </pre>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 animate-pulse">
            <HistoryIcon className="w-16 h-16 mb-4 text-blue-200" />
            <p className="text-lg font-bold">Select a history to recall</p>
          </div>
        )}
      </div>

    </div>
  );
};