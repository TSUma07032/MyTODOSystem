// src/components/views/CalendarView.tsx
import React, { useMemo } from 'react';
import { format, subMonths, addMonths, isToday, isBefore, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import type { Task,Event } from '../../types';
import { DayDetailPanel } from './CalendarDetail/DayDetailPanel';

export interface CalendarDayItem {
  date: Date;
  tasks: Task[];
  events: Event[];
  isCurrentMonth: boolean;
}

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  calendarDays: CalendarDayItem[];
  selectedDay: Date | null;
  setSelectedDay: (date: Date | null) => void;
  onToggleTask: (id: string) => void;
  onAddEvent: (eventData: Omit<Event, 'id'>) => Promise<void>;
  onUpdateEvent: (id: string, updatedData: Partial<Event>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  setCurrentDate,
  calendarDays,
  selectedDay,
  setSelectedDay,
  onToggleTask,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent
}) => {
  // 選択された日付のタスクを取得
  const selectedDayData = useMemo(() => {
    if (!selectedDay) return { tasks: [], events: [] };
    const dayItem = calendarDays.find(d => d.date.getTime() === selectedDay.getTime());
    return { tasks: dayItem?.tasks || [], events: dayItem?.events || [] };
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
        <div className="flex-1 grid grid-cols-7 gap-2 auto-rows-fr overflow-y-auto pb-4 pr-1 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent"> 
          {calendarDays.map((dayItem, idx) => {
            const isSelected = selectedDay?.getTime() === dayItem.date.getTime();
            const isPast = isBefore(dayItem.date, today);
            
            const totalCount = dayItem.tasks.length;
            const doneCount = dayItem.tasks.filter(t => t.status === 'done').length;
            const pendingCount = totalCount - doneCount;
            const highDiffCount = dayItem.tasks.filter(t => t.status !== 'done' && (t.difficulty || 2) >= 4).length;
            const hasOverdue = isPast && pendingCount > 0;

            // 🌟 チラ見せ用の予定（Events）とタスク（Tasks）を抽出
            const displayEvents = dayItem.events.slice(0, 2);
            const previewTasks = dayItem.tasks.filter(t => t.parentId === null).slice(0, 2);
            const displayTasks = previewTasks.length > 0 ? previewTasks : dayItem.tasks.slice(0, 2);

            return (
              <div 
                key={idx} 
                onClick={() => setSelectedDay(dayItem.date)} 
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
                  {/* バッジはタスクの進捗のみを表示 */}
                  {totalCount > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${doneCount === totalCount ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700'}`}>
                      {doneCount}/{totalCount}
                    </span>
                  )}
                </div>
                
                {/* 📝 チラ見せエリア（予定とタスク） */}
                <div className="flex-1 overflow-hidden flex flex-col gap-1 mb-1.5">
                  
                  {/* 1. 予定（Events）の表示 */}
                  {displayEvents.map(event => (
                    <div key={event.id} className="text-[9px] font-bold leading-tight truncate px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
                      {event.startTime && <span className="opacity-70 mr-1">{event.startTime}</span>}
                      {event.title}
                    </div>
                  ))}
                  {/* 表示しきれない予定がある場合 */}
                  {dayItem.events.length > displayEvents.length && (
                     <div className="text-[9px] font-bold text-blue-400 pl-1 mt-0.5">
                       + {dayItem.events.length - displayEvents.length} events
                     </div>
                  )}

                  {/* 2. タスク（Tasks）の表示 */}
                  {displayTasks.map(task => (
                    <div key={task.id} className={`text-[9px] font-medium leading-tight truncate px-1.5 py-0.5 rounded border ${
                      task.status === 'done' 
                        ? 'bg-slate-50 text-slate-400 border-transparent line-through' 
                        : 'bg-white text-slate-600 border-slate-100 shadow-sm'
                    }`}>
                      {task.text}
                    </div>
                  ))}
                  {/* 表示しきれないタスクがある場合 */}
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
        <DayDetailPanel
          selectedDay={selectedDay}
          tasks={selectedDayData.tasks}
          events={selectedDayData.events}
          onClose={() => setSelectedDay(null)}
          onToggleTask={onToggleTask}
          onAddEvent={onAddEvent}
          onUpdateEvent={onUpdateEvent}
          onDeleteEvent={onDeleteEvent}
        />
      )}
    </div>
  );
};