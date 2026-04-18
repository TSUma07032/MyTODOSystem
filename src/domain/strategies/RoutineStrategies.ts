// src/domain/strategies/RoutineStrategies.ts
import { format } from 'date-fns';
import type { Routine, Task } from '../../types';
import type { IRoutineStrategy } from './IRoutineStrategy';

// --- 共通の期限計算ロジック（ヘルパー） ---
const calculateDeadline = (deadlineRule: string, today: Date): string | undefined => {
  if (deadlineRule === 'today') {
    return format(today, 'M/d');
  } 
  if (deadlineRule !== 'none') {
    const daysMap: Record<string, number> = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
    let diff = daysMap[deadlineRule] - today.getDay();
    if (diff < 0) diff += 7;
    const targetDate = new Date(today.getTime());
    targetDate.setDate(today.getDate() + diff);
    return `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;
  }
  return undefined;
};

// --- ① デイリー（毎日）ルーチンの戦略 ---
export class DailyRoutineStrategy implements IRoutineStrategy {
  shouldGenerate(routine: Routine, today: Date): boolean {
    return routine.type === 'daily';
  }

  generateTask(routine: Routine, today: Date): Task {
    return {
      id: `routine-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text: routine.text,
      status: 'todo',
      parentId: null,
      order: 0, // ※追加後に再計算させる前提
      difficulty: 2,
      routineType: 'daily',
      routineId: routine.id,
      deadline: calculateDeadline(routine.deadlineRule, today)
    };
  }
}

// --- ② ウィークリー（毎週）ルーチンの戦略 ---
export class WeeklyRoutineStrategy implements IRoutineStrategy {
  shouldGenerate(routine: Routine, today: Date): boolean {
    if (routine.type !== 'weekly') return false;
    const todayDowStr = format(today, 'E'); // 'Mon', 'Tue' など
    return routine.generateOn === todayDowStr;
  }

  generateTask(routine: Routine, today: Date): Task {
    return {
      id: `routine-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      text: routine.text,
      status: 'todo',
      parentId: null,
      order: 0,
      difficulty: 2,
      routineType: 'weekly',
      routineId: routine.id,
      deadline: calculateDeadline(routine.deadlineRule, today)
    };
  }
}