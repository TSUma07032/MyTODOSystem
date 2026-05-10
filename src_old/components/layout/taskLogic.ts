// src/logic/taskLogic.ts
import type { Task } from '../../types';

/**
 * 期限(@MM/DD)をパースしてステータスを判定する純粋関数
 */
export const checkDeadlineStatus = (deadline?: string): 'none' | 'on_time' | 'overdue' => {
  if (!deadline) return 'none';
  
  const [month, day] = deadline.split('/').map(Number);
  const now = new Date();
  
  // 当日の午前0時のタイムスタンプ
  const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // 期限のタイムスタンプ（簡易的な年跨ぎ対応：12月に1月のタスクを見る場合など）
  let targetYear = now.getFullYear();
  if (now.getMonth() === 11 && month === 1) targetYear++;
  if (now.getMonth() === 0 && month === 12) targetYear--;
  
  const targetTime = new Date(targetYear, month - 1, day).getTime();

  return todayTime > targetTime ? 'overdue' : 'on_time';
};

/**
 * タスク完了時に獲得できるコインを計算する
 * 🚀 期限内の場合は1.5倍ボーナス、期限切れの場合はマイナス（罰金）にする
 */
export const calculateEarnedCoins = (task: Task): number => {
  let multiplier = 20;
  if (task.routineType === 'daily') multiplier = 5;
  if (task.routineType === 'weekly') multiplier = 10;
  
  const baseCoins = (task.difficulty || 2) * multiplier;
  const status = checkDeadlineStatus(task.deadline);
  
  if (status === 'overdue') {
    return -baseCoins; // ペナルティとして基本額をマイナス
  } else if (status === 'on_time') {
    return Math.floor(baseCoins * 1.5); // 期限遵守ボーナス！
  }
  
  return baseCoins;
};

/**
 * 難易度を循環させる (1 -> 2 -> 3 -> 4 -> 5 -> 1)
 */
export const getNextDifficulty = (currentDiff: number): number => {
  return currentDiff >= 5 ? 1 : currentDiff + 1;
};

/**
 * Markdownの行から特定のタグを置換または追加するヘルパー
 */
export const updateLineWithTag = (line: string, regex: RegExp, newTag: string): string => {
  const trimmedLine = line.trimEnd();
  if (regex.test(trimmedLine)) {
    return trimmedLine.replace(regex, newTag);
  }
  return `${trimmedLine} ${newTag}`;
};