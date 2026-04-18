// src/features/calendar/logic/calendarLogic.ts
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameDay, isSameMonth 
} from 'date-fns';
import { type Task } from '../../tasks/types';
import type { Event, CalendarDayItem } from '../types';

/**
 * 表示する月のカレンダー用データ（42日分）を生成する
 */
export const generateCalendarDays = (
  currentDate: Date,
  tasks: Task[],
  events: Event[]
): CalendarDayItem[] => {
  const start = startOfWeek(startOfMonth(currentDate));
  const end = endOfWeek(endOfMonth(currentDate));
  
  const days = eachDayOfInterval({ start, end });
  const today = new Date();

  return days.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const displayDateStr = format(day, 'M/d'); // タスクの期限形式に合わせる

    return {
      date: day,
      // その日のタスク（期限が一致するもの）
      tasks: tasks.filter(t => t.deadline === displayDateStr || t.deadline === dateStr),
      // その日のイベント
      events: events.filter(e => e.date === dateStr),
      isCurrentMonth: isSameMonth(day, currentDate),
      isToday: isSameDay(day, today)
    };
  });
};