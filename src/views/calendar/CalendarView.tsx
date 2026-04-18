import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useCalendar } from '../../features/calendar/hooks/useCalendar';
import { useEvents } from '../../features/calendar/hooks/useEvents';
import { useTasks } from '../../features/tasks/hooks/useTasks';

interface CalendarViewProps {
  readFile: (filename: string) => Promise<string | null>;
  writeFile: (filename: string, content: string) => Promise<void>;
  isReady: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ readFile, writeFile, isReady }) => {
  const { tasks } = useTasks(readFile, writeFile, isReady);
  const { events } = useEvents(writeFile);
  const { currentDate, calendarDays, nextMonth, prevMonth, setSelectedDate } = useCalendar(tasks, events);

  return (
    <div className="h-full max-w-[1600px] mx-auto p-8 flex flex-col animate-fadeIn">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-200">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            {format(currentDate, 'MMMM yyyy')}
          </h1>
        </div>
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronLeft /></button>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><ChevronRight /></button>
        </div>
      </header>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="flex-1 grid grid-cols-7 gap-3 h-0 min-h-0">
        {calendarDays.map((day, idx) => (
          <div 
            key={idx} 
            onClick={() => setSelectedDate(day.date)}
            className={`
              relative p-3 rounded-3xl border transition-all cursor-pointer flex flex-col gap-1 overflow-hidden
              ${day.isCurrentMonth ? 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100' : 'bg-transparent border-transparent opacity-30'}
              ${day.isToday && 'ring-2 ring-blue-500 border-transparent shadow-lg shadow-blue-100'}
            `}
          >
            <span className={`text-sm font-black ${day.isToday ? 'text-blue-600' : 'text-slate-700'}`}>
              {format(day.date, 'd')}
            </span>
            
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {day.events.map(e => (
                <div key={e.id} className="text-[10px] p-1.5 bg-blue-50 text-blue-700 rounded-lg font-bold border border-blue-100 truncate">
                  {e.title}
                </div>
              ))}
              {day.tasks.map(t => (
                <div key={t.id} className="text-[10px] p-1.5 bg-slate-50 text-slate-500 rounded-lg font-medium truncate">
                  • {t.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};