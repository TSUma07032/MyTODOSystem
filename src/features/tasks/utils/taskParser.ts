import type { ParsedTask } from '../types'; // features/tasks/types からインポート

// 🚀 改善ポイント：正規表現を外に出して定数化（テストや仕様変更が超ラクになります）
const PATTERNS = {
  HEADER: /^#+\s+(.+)$/,
  TASK: /^(\s*)-\s\[([ xX])\]\s+(.+)$/,
  ROUTINE: /\((daily|weekly):([-\w]+)\)/,
  DIFFICULTY: /\(★(\d+)\)/,
  DEADLINE: /\(@(\d{1,2}\/\d{1,2})\)/,
  ESTIMATE: /\(([^)]+)\)$/
};

export const parseMarkdownTasks = (markdown: string): ParsedTask[] => {
  const lines = markdown.split('\n');
  const tasks: ParsedTask[] = []; 
  let currentSection = '';

  lines.forEach((line, index) => {
    const headerMatch = line.match(PATTERNS.HEADER);
    if (headerMatch) {
      currentSection = headerMatch[1];
      return;
    }

    const taskMatch = line.match(PATTERNS.TASK);
    if (taskMatch) {
      const rawIndentWidth = taskMatch[1].replace(/\t/g, '    ').length;
      const status = taskMatch[2].trim() ? 'done' : 'todo';
      let text = taskMatch[3];

      // ルーチンの抽出
      const routineMatch = text.match(PATTERNS.ROUTINE);
      let routineType: 'daily' | 'weekly' | undefined;
      let routineId: string | undefined;
      if (routineMatch) {
        routineType = routineMatch[1] as 'daily' | 'weekly';
        routineId = routineMatch[2];
        text = text.replace(PATTERNS.ROUTINE, '').trim(); 
      }

      // 難易度の抽出
      let difficulty = 2;
      const diffMatch = text.match(PATTERNS.DIFFICULTY);
      if (diffMatch) {
        difficulty = parseInt(diffMatch[1], 10);
        text = text.replace(PATTERNS.DIFFICULTY, '').trim();
      }

      // 期日の抽出
      const deadlineMatch = text.match(PATTERNS.DEADLINE);
      const deadline = deadlineMatch ? deadlineMatch[1] : undefined;
      text = text.replace(PATTERNS.DEADLINE, '').trim();

      // 見積もりの抽出
      const estimateMatch = text.match(PATTERNS.ESTIMATE);
      const estimate = estimateMatch ? estimateMatch[1] : undefined;
      if (estimateMatch) {
        text = text.replace(PATTERNS.ESTIMATE, '').trim();
      }

      tasks.push({
        id: `task-line-${index}`, 
        text,
        status,
        indent: rawIndentWidth,
        lineNumber: index + 1,
        originalRaw: line,
        estimate,
        deadline,
        section: currentSection,
        routineType,
        routineId,
        difficulty,
      });
    }
  });

  return tasks; // ParseResultというラッパーオブジェクトをやめ、配列を直接返すシンプル設計に
};