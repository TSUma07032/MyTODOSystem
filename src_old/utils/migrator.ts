// src/utils/migrator.ts
import { type Task } from '../types';

export interface OldTask {
  id: string;
  text: string;
  status: 'todo' | 'done';
  indent: number;       // parser.ts から渡される「物理的な空白の数」
  lineNumber: number;
  originalRaw: string;
  estimate?: string;
  deadline?: string;
  section?: string;
  routineType?: 'daily' | 'weekly';
  routineId?: string;
  difficulty: number;
}

export const migrateMarkdownToJson = (oldTasks: OldTask[]): Task[] => {
  const newTasks: Task[] = [];
  
  // 🚀 新兵器：階層を管理するスタック
  // 筒の中に { id, indent(空白の数) } を積んでいきます
  const stack: { id: string; indent: number }[] = [];

  oldTasks.forEach((old, index) => {
    
    // 1. スタックの整理
    // 今のタスクの空白数と「同じ」か「深い（空白が多い）」タスクは、絶対に親になれません。
    // なので、親になれる（自分より空白が少ない）タスクが出るまでスタックから捨てます（pop）。
    while (stack.length > 0 && stack[stack.length - 1].indent >= old.indent) {
      stack.pop();
    }

    // 2. 親の決定
    // 整理が終わった後、スタックの一番上に残っているタスクが「直属の親」です！
    // スタックが空っぽなら、それは一番上の階層（ルートタスク）です。
    const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;

    newTasks.push({
      id: old.id,
      text: old.text,
      status: old.status,
      parentId: parentId, // 見つけ出した親IDをセット！
      order: index,
      estimate: old.estimate,
      deadline: old.deadline,
      section: old.section,
      routineType: old.routineType,
      routineId: old.routineId,
      difficulty: old.difficulty,
    });

    // 3. 自分が次のタスクの親になるかもしれないので、スタックに自分を積む
    stack.push({ id: old.id, indent: old.indent });
  });

  return newTasks;
};