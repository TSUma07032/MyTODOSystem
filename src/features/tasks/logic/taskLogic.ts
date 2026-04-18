import { type Task } from '../types';

export const getTaskIndent = (taskId: string, allTasks: Task[]): number => {
  const task = allTasks.find(t => t.id === taskId);
  if (!task || !task.parentId) return 0;
  return 1 + getTaskIndent(task.parentId, allTasks);
};

export const getSortedTasks = (tasks: Task[], parentId: string | null = null): Task[] => {
  return tasks
    .filter(t => t.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .reduce((acc: Task[], task) => [...acc, task, ...getSortedTasks(tasks, task.id)], []);
};

export const isTaskVisible = (task: Task, tasks: Task[], expandedIds: Set<string>): boolean => {
  if (!task.parentId) return true;
  let currentParentId: string | null = task.parentId; // 型エラー修正
  while (currentParentId) {
    if (!expandedIds.has(currentParentId)) return false;
    const parent = tasks.find(t => t.id === currentParentId);
    currentParentId = parent?.parentId || null;
  }
  return true;
};