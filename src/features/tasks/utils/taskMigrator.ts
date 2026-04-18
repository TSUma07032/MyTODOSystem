import type { Task, ParsedTask } from '../types';

// 🚀 改善ポイント: 新たに OldTask インターフェースを作らず、
// 先ほどの taskParser から出てきた ParsedTask 型をそのまま再利用します！

export const migrateToHierarchy = (parsedTasks: ParsedTask[]): Task[] => {
  const newTasks: Task[] = [];
  
  // 階層を管理するスタック { id, indent(空白の数) }
  const stack: { id: string; indent: number }[] = [];

  parsedTasks.forEach((parsed, index) => {
    
    // 1. スタックの整理
    while (stack.length > 0 && stack[stack.length - 1].indent >= parsed.indent) {
      stack.pop();
    }

    // 2. 親の決定
    const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;

    newTasks.push({
      id: parsed.id,
      text: parsed.text,
      status: parsed.status,
      parentId: parentId,
      order: index,
      estimate: parsed.estimate,
      deadline: parsed.deadline,
      section: parsed.section,
      routineType: parsed.routineType,
      routineId: parsed.routineId,
      difficulty: parsed.difficulty,
    });

    // 3. 次のタスクの親候補としてスタックに積む
    stack.push({ id: parsed.id, indent: parsed.indent });
  });

  return newTasks;
};