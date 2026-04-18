import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, format } from 'date-fns';
import type { Task, Event } from '@/features/tasks/types'; // 修正したパス

export const generateCalendarDays = (currentDate: Date, allTasks: Task[], allEvents: Event[]) => {
  const start = startOfWeek(startOfMonth(currentDate));
  const end = endOfWeek(endOfMonth(currentDate));
  
  const days = eachDayOfInterval({ start, end });
  const monthStr = format(currentDate, 'yyyy-MM');

  return days.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const shortDateStr = format(date, 'M/d'); // タスクの期限形式 "4/18"

    return {
      date,
      isCurrentMonth: format(date, 'yyyy-MM') === monthStr,
      // 🚀 タスクと予定をこの日に紐付ける
      tasks: allTasks.filter(t => t.deadline === shortDateStr),
      events: allEvents.filter(e => e.date === dateStr),
    };
  });
};