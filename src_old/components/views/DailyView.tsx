// src/components/views/DailyView.tsx
import React from 'react';
import { Repeat, CheckCircle } from 'lucide-react';
import type { Routine } from '../../types';

interface DailyViewProps {
  routines: Routine[];
  completedDailyIds: string[];
  onToggleDaily: (routineId: string) => void;
}

export const DailyView: React.FC<DailyViewProps> = ({
  routines,
  completedDailyIds,
  onToggleDaily
}) => {
  // デイリールーチンのみを抽出
  const dailyRoutines = routines.filter(r => r.type === 'daily');

  return (
    <div className="space-y-4 animate-fadeIn pb-10">
      {/* ヘッダーセクション */}
      <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-6 shadow-sm">
        <h2 className="text-lg font-black text-indigo-700 flex items-center gap-2">
          <Repeat className="w-5 h-5" /> 
          Daily Rituals
        </h2>
        <p className="text-xs text-indigo-400 font-bold mt-1">
          毎日リセットされる、あなたの「核」となる習慣
        </p>
      </div>

      {/* デイリールーチンのリスト表示 */}
      {dailyRoutines.length === 0 ? (
        <div className="text-center p-8 bg-white/50 rounded-xl border border-dashed border-indigo-200">
          <p className="text-indigo-400 font-bold text-sm">
            まだデイリールーチンがありません。<br />
            右上の「Routines」から追加してみましょう！
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dailyRoutines.map(r => {
            const isCompleted = completedDailyIds.includes(r.id);
            
            return (
              <div 
                key={r.id} 
                className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => onToggleDaily(r.id)}>
                  <button 
                    className={`transition-all group-hover:scale-110 active:scale-95 ${isCompleted ? "text-green-500" : "text-slate-300 hover:text-indigo-400"}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-current" />
                    )}
                  </button>
                  <span className={`font-bold text-sm transition-colors ${isCompleted ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {r.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};