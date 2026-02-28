// src/components/views/CalendarView.tsx
import React from 'react';
import { format, subMonths, addMonths, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, X, Coffee, CheckCircle } from 'lucide-react';
import { IconButton } from '../ui/IconButton';
import type { Task } from '../../types';

// カレンダーの1日分のデータを表す型（App.tsxで計算されたものを想定）
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
  return (
    <div className="flex flex-col h-full animate-fadeIn pb-10">
      
      {/* カレンダーヘッダー（年月表示と月送りボタン） */}
      <div className="flex items-center justify-between mb-4 bg-white/50 p-4 rounded-2xl shadow-sm border border-emerald-100">
        <h2 className="text-2xl font-black text-slate-700">
          {format(currentDate, 'yyyy MMMM')}
        </h2>
        <div className="flex gap-2">
          <IconButton onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </IconButton>
          <button 
            onClick={() => setCurrentDate(new Date())} 
            className="px-4 py-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors shadow-sm"
          >
            Today
          </button>
          <IconButton onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="w-5 h-5" />
          </IconButton>
        </div>
      </div>

      {/* 曜日のヘッダー */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-bold text-slate-400 text-[10px] uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド本体 */}
      <div className="flex-1 grid grid-cols-7 gap-2 auto-rows-fr overflow-y-auto pb-4"> 
        {calendarDays.map((dayItem, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedDay(dayItem.date)} 
            className={`flex flex-col p-2 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
              dayItem.isCurrentMonth ? 'bg-white/80 border-white shadow-sm' : 'bg-gray-50/50 border-transparent opacity-60'
            } ${isToday(dayItem.date) ? 'ring-2 ring-emerald-400 ring-offset-1' : ''} min-h-[100px]`}
          > 
            <div className={`text-xs font-black mb-1 ${isToday(dayItem.date) ? 'text-emerald-600' : 'text-slate-500'}`}>
              {dayItem.date.getDate()}
            </div>
            
            {/* その日のタスクを小さなバーで表示 */}
            <div className="space-y-1 overflow-y-auto scrollbar-none flex-1">
              {dayItem.tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium shadow-sm transition-all hover:opacity-80 ${
                    task.deadline ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                  }`} 
                  style={{ marginLeft: `${task.indent * 6}px`, borderLeftWidth: task.indent > 0 ? '2px' : '1px' }} 
                  title={task.text}
                >
                  {task.indent > 0 && <span className="opacity-50 mr-1">└</span>}
                  {task.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 選択された日付の詳細モーダル */}
      {selectedDay && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm animate-fadeIn p-4" 
          onClick={() => setSelectedDay(null)}
        >
          <div 
            className="bg-white w-full max-w-lg max-h-[80%] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-emerald-100" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* モーダルヘッダー */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50/80">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  {format(selectedDay, 'yyyy MMMM')}
                </p>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  {format(selectedDay, 'd')}
                  <span className="text-lg font-medium text-slate-400">({format(selectedDay, 'EEEE')})</span>
                </h3>
              </div>
              <IconButton onClick={() => setSelectedDay(null)}>
                <X className="w-6 h-6 text-slate-400" />
              </IconButton>
            </div>

            {/* モーダルコンテンツ（タスクリスト） */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-white">
              {(() => {
                const dayTasks = calendarDays.find(d => d.date.getTime() === selectedDay.getTime())?.tasks || [];
                if (dayTasks.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 opacity-60">
                      <Coffee className="w-10 h-10 mb-2" />
                      <p className="font-bold">No tasks planned for this day.</p>
                    </div>
                  );
                }
                
                return dayTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`group relative p-3 rounded-xl border transition-all hover:shadow-sm ${task.deadline ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-gray-100"}`} 
                    style={{ marginLeft: `${task.indent * 20}px` }}
                  >
                    {/* ツリー構造の線 */}
                    {task.indent > 0 && <div className="absolute -left-3 top-0 bottom-0 border-l-2 border-gray-100 group-hover:border-emerald-200" />}
                    {task.indent > 0 && <div className="absolute -left-3 top-1/2 w-2 border-t-2 border-gray-100 group-hover:border-emerald-200" />}
                    
                    <div className="flex items-start gap-3">
                      {/* 完了トグルボタン */}
                      <button 
                        onClick={() => onToggleTask(task.id)} 
                        className={`mt-1 flex-shrink-0 transition-colors group-hover:scale-110 active:scale-95 ${task.status === 'done' ? "text-emerald-500" : "text-slate-300 hover:text-emerald-400"}`}
                      >
                        {task.status === 'done' ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                      </button>
                      
                      <div className="flex-1">
                        <p className={`text-sm font-bold leading-relaxed ${task.status === 'done' ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {task.text}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {task.deadline && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">Due Today</span>}
                          {task.estimate && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 shadow-sm">{task.estimate}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
            
            {/* モーダルフッター */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs font-bold text-slate-400">
              Press ESC or click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
};