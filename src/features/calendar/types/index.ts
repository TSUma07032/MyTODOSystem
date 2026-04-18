// src/features/calendar/types.ts
import { type Task } from '../../tasks/types';

export interface Event {
  id: string;
  title: string;
  date: string;       // "YYYY-MM-DD"
  startTime?: string; // "HH:mm"
  endTime?: string;
  memo?: string;
  color?: string;     // UI用カラークラス
}

export interface CalendarDayItem {
  date: Date;
  tasks: Task[];
  events: Event[];
  isCurrentMonth: boolean;
  isToday: boolean;
}