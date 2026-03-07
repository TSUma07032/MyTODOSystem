// src/utils/markdownSync.ts
import type { Task } from '../types';
import { getTaskIndent } from '../logic/taskLogic';

export const tasksToMarkdown = (tasks: Task[]): string => {
  // 念のため order（表示順）でソート
  const sorted = [...tasks].sort((a, b) => a.order - b.order);
  
  return sorted.map(task => {
    const indent = "  ".repeat(getTaskIndent(task.id, tasks));
    const checkbox = task.status === 'done' ? '[x]' : '[ ]';
    
    // 基本のタスクテキスト
    let line = `${indent}- ${checkbox} ${task.text}`;
    
    // メタデータを美しいMarkdownタグに復元していく
    if (task.routineType && task.routineId) {
      line += ` (${task.routineType}:${task.routineId})`;
    }
    if (task.difficulty && task.difficulty !== 2) {
      line += ` (★${task.difficulty})`;
    }
    if (task.deadline) {
      line += ` (@${task.deadline})`;
    }
    // ※見積もり (30m) などは、パーサーの仕様上「必ず最後」に付ける！
    if (task.estimate) {
      line += ` (${task.estimate})`;
    }
    
    return line;
  }).join('\n');
};