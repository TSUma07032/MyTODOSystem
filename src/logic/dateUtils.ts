import { format, addDays } from 'date-fns';
import type { Routine } from '../types';

/**
 * ルーチンが今日活性化すべきか判定する (1機能: 活性判定)
 */
export const isRoutineActiveToday = (routine: Routine, today: Date = new Date()): boolean => {
  if (routine.type === 'daily') return true;
  if (!routine.generateOn) return false;

  const daysMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  const genDay = daysMap[routine.generateOn];
  const currentDay = today.getDay();

  return genDay === currentDay;
};

/**
 * ルーチンのルールに基づき期限タグを生成する (1機能: タグ生成)
 */
export const calculateRoutineDeadlineTag = (routine: Routine, today: Date = new Date()): string => {
  if (routine.deadlineRule === 'none') return '';
  if (routine.deadlineRule === 'today') return ` (@${format(today, 'M/d')})`;

  const daysMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
  let diff = daysMap[routine.deadlineRule] - today.getDay();
  if (diff < 0) diff += 7;
  
  const targetDate = addDays(today, diff);
  return ` (@${format(targetDate, 'M/d')})`;
};