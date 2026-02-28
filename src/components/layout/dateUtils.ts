// src/logic/dateUtils.ts
import { type Routine } from '../../types';
import { format } from 'date-fns';

/**
 * 指定されたルーチンが今日実行すべきものか判定する
 */
export const isRoutineActiveToday = (routine: Routine, targetDate: Date = new Date()): boolean => {
  if (routine.type === 'daily') return true;
  if (!routine.generateOn) return false;

  const daysMap: Record<string, number> = { 
    'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 
  };
  
  const genDay = daysMap[routine.generateOn];
  const currentDay = targetDate.getDay();

  // 簡易判定: 生成曜日と今日が一致しているか
  // ※より複雑な期間判定が必要な場合はここに集約できる
  return genDay === currentDay;
};

/**
 * 期限タグ (@M/D) を生成する
 */
export const generateDeadlineTag = (date: Date): string => {
  return `(@${format(date, 'M/d')})`;
};