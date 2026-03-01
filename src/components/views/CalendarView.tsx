// src/components/views/CalendarView.tsx
import React, { useMemo } from 'react';
import { format, subMonths, addMonths, isToday, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Coffee, CheckCircle, AlertCircle } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import type { Task } from '../../types';

export interface CalendarDayItem {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
}

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  calendarDays: CalendarDayItem[];
  selectedDay: Date | null;
  setSelectedDay: (date: Date | null) => void;
  onToggleTask: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  setCurrentDate,
  calendarDays,
  selectedDay,
  setSelectedDay,
  onToggleTask
}) => {
  // 選択された日付のタスクを取得
  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    return calendarDays.find(d => d.date.getTime() === selectedDay.getTime())?.tasks || [];
  }, [calendarDays, selectedDay]);

  const today = startOfDay(new Date());

  return (
    <div className="flex h-full animate-fadeIn gap-4 pb-10 overflow-hidden relative">
      
      {/* 🟢 左側（Master）: カレンダーグリッド */}
      <div className={`flex flex-col h-full transition-all duration-500 ease-in-out ${selectedDay ? 'w-2/3 pr-2' : 'w-full'}`}>
        
        {/* カレンダーヘッダー */}
        <div className="flex items-center justify-between mb-4 bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-emerald-100/50">
          <h2 className="text-2xl font-black text-slate-700 tracking-tight">
            {format(currentDate, 'yyyy MMMM')}
          </h2>
          <div className="flex gap-2">
            <IconButton onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="w-5 h-5" />
            </IconButton>
            <button 
              onClick={() => setCurrentDate(new Date())} 
              className="px-5 py-1.5 text-xs font-bold bg-emerald-100/80 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors shadow-sm"
            >
              Today
            </button>
            <IconButton onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="w-5 h-5" />
            </IconButton>
          </div>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-bold text-emerald-800/40 text-[10px] uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド本体 */}
        {/* カレンダーグリッド本体 */}
        <div className="flex-1 grid grid-cols-7 gap-2 auto-rows-fr overflow-y-auto pb-4 pr-1 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent"> 
          {calendarDays.map((dayItem, idx) => {
            const isSelected = selectedDay?.getTime() === dayItem.date.getTime();
            const isPast = isBefore(dayItem.date, today);
            
            const totalCount = dayItem.tasks.length;
            const doneCount = dayItem.tasks.filter(t => t.status === 'done').length;
            const pendingCount = totalCount - doneCount;
            const highDiffCount = dayItem.tasks.filter(t => t.status !== 'done' && (t.difficulty || 2) >= 4).length;
            const hasOverdue = isPast && pendingCount > 0;

            // 🌟 チラ見せ用の親タスク（indentが0のもの）を優先的に抽出
            const previewTasks = dayItem.tasks.filter(t => t.indent === 0).slice(0, 2);
            // もし親タスクが無い（子タスクだけが期限設定されている等）場合は、そのまま先頭2つを取る
            const displayTasks = previewTasks.length > 0 ? previewTasks : dayItem.tasks.slice(0, 2);

            return (
              <div 
                key={idx} 
                onClick={() => setSelectedDay(dayItem.date)} 
                // 🎨 修正1: 輪郭をはっきりさせ、不透明度を上げてコントラストを強化
                className={`flex flex-col p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                  dayItem.isCurrentMonth 
                    ? 'bg-white/95 border-emerald-200 shadow-sm hover:shadow-md hover:border-emerald-400' 
                    : 'bg-white/50 border-emerald-100/60 opacity-60 hover:opacity-100'
                } ${isToday(dayItem.date) ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-emerald-50' : ''} 
                  ${isSelected ? 'bg-emerald-50/80 border-emerald-400 shadow-inner scale-[0.98]' : 'hover:-translate-y-0.5'} min-h-[110px]`}
              > 
                {/* 日付と件数バッジ */}
                <div className="flex justify-between items-start mb-1.5">
                  <span className={`text-sm font-black ${isToday(dayItem.date) ? 'text-emerald-600' : isSelected ? 'text-emerald-800' : 'text-slate-600'}`}>
                    {dayItem.date.getDate()}
                  </span>
                  {totalCount > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${doneCount === totalCount ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700'}`}>
                      {doneCount}/{totalCount}
                    </span>
                  )}
                </div>
                
                {/* 📝 修正2: タスクの「チラ見せ」エリアを追加 */}
                <div className="flex-1 overflow-hidden flex flex-col gap-1 mb-1.5">
                  {displayTasks.map(task => (
                    <div key={task.id} className={`text-[9px] font-medium leading-tight truncate px-1.5 py-0.5 rounded border ${
                      task.status === 'done' 
                        ? 'bg-slate-50 text-slate-400 border-transparent line-through' 
                        : 'bg-white text-slate-600 border-slate-100 shadow-sm'
                    }`}>
                      {task.text}
                    </div>
                  ))}
                  {/* 表示しきれないタスクがある場合は「+ X tasks」と表示 */}
                  {totalCount > displayTasks.length && (
                    <div className="text-[9px] font-bold text-emerald-600/60 pl-1 mt-0.5">
                      + {totalCount - displayTasks.length} tasks
                    </div>
                  )}
                </div>

                {/* 視覚的インジケーター（ドット） */}
                <div className="mt-auto flex flex-wrap gap-1.5 justify-start">
                  {hasOverdue && (
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm animate-pulse" title="期限切れのタスクあり" />
                  )}
                  {highDiffCount > 0 && !hasOverdue && (
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-400 shadow-sm" title={`高難易度タスク: ${highDiffCount}件`} />
                  )}
                  {pendingCount > 0 && highDiffCount === 0 && !hasOverdue && (
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" title="未完了タスクあり" />
                  )}
                  {totalCount > 0 && pendingCount === 0 && (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" title="すべて完了!" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🟢 右側（Detail）: スライドインする詳細パネル */}
      {selectedDay && (
        <div className="w-1/3 h-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden animate-slideInRight">
          
          {/* パネルヘッダー */}
          <div className="px-5 py-4 border-b border-emerald-100/50 flex justify-between items-center bg-gradient-to-br from-emerald-50 to-white">
            <div>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                {format(selectedDay, 'yyyy MMMM')}
              </p>
              <h3 className="text-xl font-black text-slate-800 flex items-baseline gap-1">
                {format(selectedDay, 'd')}
                <span className="text-sm font-bold text-slate-400">({format(selectedDay, 'EEE')})</span>
              </h3>
            </div>
            <IconButton onClick={() => setSelectedDay(null)}>
              <X className="w-5 h-5 text-slate-400" />
            </IconButton>
          </div>

          {/* タスクリスト本体 */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin scrollbar-thumb-emerald-100">
            {selectedDayTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                <Coffee className="w-12 h-12 mb-3 text-emerald-200" />
                <p className="font-bold text-sm">No tasks planned.</p>
                <p className="text-xs mt-1">この日はリラックスしましょう</p>
              </div>
            ) : (
              selectedDayTasks.map(task => {
                const isDone = task.status === 'done';
                const isOverdue = !isDone && isBefore(selectedDay, today);
                
                return (
                  <div 
                    key={task.id} 
                    className={`group relative p-3 rounded-2xl border transition-all hover:shadow-md ${isDone ? "bg-slate-50 border-transparent opacity-70" : "bg-white border-emerald-50 shadow-sm"}`} 
                    style={{ marginLeft: `${task.indent * 12}px` }}
                  >
                    <div className="flex items-start gap-3">
                      <button 
                        onClick={() => onToggleTask(task.id)} 
                        className={`mt-0.5 flex-shrink-0 transition-transform group-hover:scale-110 active:scale-95 ${isDone ? "text-emerald-500" : isOverdue ? "text-red-400 hover:text-red-500" : "text-slate-300 hover:text-emerald-400"}`}
                      >
                        {isDone ? <CheckCircle className="w-5 h-5" /> : isOverdue ? <AlertCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold leading-snug break-words ${isDone ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {task.text}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-100">
                            ★{task.difficulty || 2}
                          </span>
                          {isOverdue && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-100 animate-pulse">
                              Overdue
                            </span>
                          )}
                          {task.estimate && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500">
                              {task.estimate}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};