// src/logic/taskLogic.ts
import { type Task } from '../../types';

/**
 * タスク完了時に獲得できるコインを計算する (1コード1機能: コイン計算)
 */
export const calculateEarnedCoins = (task: Task): number => {
  let multiplier = 20;
  if (task.routineType === 'daily') multiplier = 5;
  if (task.routineType === 'weekly') multiplier = 10;
  
  // 難易度(1-5)に倍率をかける
  return (task.difficulty || 2) * multiplier;
};

/**
 * 難易度を循環させる (1 -> 2 -> 3 -> 4 -> 5 -> 1)
 */
export const getNextDifficulty = (currentDiff: number): number => {
  return currentDiff >= 5 ? 1 : currentDiff + 1;
};