import React, { useMemo, useState } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/core/components/IconButton';
import { useTasks } from '@/features/tasks/store/useTasks';
import { useEvents } from '../../../features/calendar/store/useEvents';
import { generateCalendarDays } from '../../../features/calendar/logic/calendarUtils';
import { DayDetailPanel } from './CalendarDetail/DayDetailPanel';

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // 🚀 各Storeから最新データを直接取得
  const { tasks } = useTasks();
  const { events } = useEvents();

  // 🚀 カレンダーのグリッド計算
  const calendarDays = useMemo(() => 
    generateCalendarDays(currentDate, tasks, events), 
  [currentDate, tasks, events]);

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
    return calendarDays.find(d => d.date.getTime() === selectedDay.getTime());
  }, [calendarDays, selectedDay]);

  return (
    <div className="flex h-full animate-fadeIn gap-4 pb-10 overflow-hidden relative max-w-7xl mx-auto px-4">
      <div className={`flex flex-col h-full transition-all duration-500 ${selectedDay ? 'w-2/3' : 'w-full'}`}>
        {/* ヘッダー部分は共通IconButtonなどを使って整理（中略） */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((dayItem, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedDay(dayItem.date)}
              className="..." // 既存の美しいスタイリングを維持
            >
              {/* 日付表示、イベント・タスクのドット表示など */}
            </div>
          ))}
        </div>
      </div>

      {selectedDay && selectedDayData && (
        <DayDetailPanel
          selectedDay={selectedDay}
          tasks={selectedDayData.tasks}
          events={selectedDayData.events}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
};