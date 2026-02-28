import type { Task } from '../types';

/**
 * タスク完了時に獲得できるコインを計算する (1コード1機能: コイン計算)
 */
export const calculateEarnedCoins = (task: Task): number => {
  let multiplier = 20;
  if (task.routineType === 'daily') multiplier = 5;
  if (task.routineType === 'weekly') multiplier = 10;
  return (task.difficulty || 2) * multiplier;
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