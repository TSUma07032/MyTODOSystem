import React from 'react';
import { Repeat, CheckCircle } from 'lucide-react';
import { useRoutines } from '@/features/routines/store/useRoutines';
import { useDailyStore } from '../store/useDailyStore';

export const DailyView: React.FC = () => {
  const { routines } = useRoutines();
  const { completedDailyIds, toggleDaily } = useDailyStore();

  const dailyRoutines = routines.filter(r => r.type === 'daily');

  return (
    <div className="space-y-4 animate-fadeIn pb-10 max-w-2xl mx-auto mt-8 px-4">
      {/* 既存の美しいヘッダーとリスト描画 ... */}
      {dailyRoutines.map(r => (
        <div 
          key={r.id} 
          className="..." 
          onClick={() => toggleDaily(r.id)}
        >
          {/* チェックボタンとテキストの描画 */}
        </div>
      ))}
    </div>
  );
};