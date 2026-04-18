// src/features/calendar/hooks/useCalendar.ts
import { useState, useMemo } from 'react';
import { generateCalendarDays } from '../logic/calendarLogic';
import type { Task } from '../../tasks/types';
import type { Event } from '../types';
import { addMonths, subMonths } from 'date-fns';

export const useCalendar = (tasks: Task[], events: Event[]) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const calendarDays = useMemo(() => 
    generateCalendarDays(currentDate, tasks, events),
    [currentDate, tasks, events]
  );

  const nextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentDate(prev => subMonths(prev, 1));

  return {
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    calendarDays,
    nextMonth,
    prevMonth
  };
};