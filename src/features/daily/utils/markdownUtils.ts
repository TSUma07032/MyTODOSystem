import type { Task } from '@/features/tasks/types';
import { getTaskIndent } from '@/features/tasks/logic/taskHierarchy';

/**
 * タスク配列を、人間が読みやすいMarkdown形式の文字列に変換します。
 * 履歴保存やクリップボードコピーに使用します。
 */
export const tasksToMarkdown = (tasks: Task[]): string => {
  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  
  return sorted.map(task => {
    const indent = "  ".repeat(getTaskIndent(task.id, tasks));
    const checkbox = task.status === 'done' ? '[x]' : '[ ]';
    
    let line = `${indent}- ${checkbox} ${task.text}`;
    
    if (task.routineType && task.routineId) line += ` (${task.routineType}:${task.routineId})`;
    if (task.difficulty && task.difficulty !== 2) line += ` (★${task.difficulty})`;
    if (task.deadline) line += ` (@${task.deadline})`;
    if (task.estimate) line += ` (${task.estimate})`;
    
    return line;
  }).join('\n');
};