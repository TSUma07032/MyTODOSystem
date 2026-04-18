import { type Task } from '../types';

// 再帰的に親を辿り、インデントの深さ（レベル）を計算する関数
export const getTaskIndent = (taskId: string, tasks: Task[]): number => {
  const task = tasks.find(t => t.id === taskId);
  // 親がいない（null）か、タスクが見つからなければインデント0
  if (!task || !task.parentId) return 0;
  
  // 親がいる場合は「親の深さ + 1」を返す！
  return 1 + getTaskIndent(task.parentId, tasks);
};

// 特定のタスクの「すべての子孫タスクID」を取得する関数（移動や削除で大活躍します）
export const getDescendantIds = (parentId: string, tasks: Task[]): string[] => {
  const children = tasks.filter(t => t.parentId === parentId).map(t => t.id);
  return [...children, ...children.flatMap(childId => getDescendantIds(childId, tasks))];
};