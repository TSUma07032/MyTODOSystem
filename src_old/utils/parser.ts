// src/utils/parser.ts
import type { ParsedTask, ParseResult } from '../types';

export const parseMarkdown = (markdown: string): ParseResult => {
  const lines = markdown.split('\n');
  
  // 🚀 修正1: Task[] ではなく ParsedTask[] を使う！
  const tasks: ParsedTask[] = []; 
  
  let currentSection = '';

  lines.forEach((line, index) => {
    const headerMatch = line.match(/^#+\s+(.+)$/);
    if (headerMatch) {
      currentSection = headerMatch[1];
      return;
    }

    const taskMatch = line.match(/^(\s*)-\s\[([ xX])\]\s+(.+)$/);
    
    if (taskMatch) {
      // タブ文字をスペース4つに換算する超寛容アルゴリズム
      const rawIndentWidth = taskMatch[1].replace(/\t/g, '    ').length;
      
      const status = taskMatch[2].trim() ? 'done' : 'todo';
      let text = taskMatch[3];

      // 各種メタデータの抽出
      const routineRegex = /\((daily|weekly):([-\w]+)\)/;
      const routineMatch = text.match(routineRegex);
      let routineType: 'daily' | 'weekly' | undefined = undefined;
      let routineId: string | undefined = undefined;

      if (routineMatch) {
        routineType = routineMatch[1] as 'daily' | 'weekly';
        routineId = routineMatch[2];
        text = text.replace(routineRegex, '').trim(); 
      }

      let difficulty = 2;
      const diffMatch = text.match(/\(★(\d+)\)/);
      if (diffMatch) {
        difficulty = parseInt(diffMatch[1], 10);
        text = text.replace(/\(★\d+\)/, '').trim();
      }

      const deadlineMatch = text.match(/\(@(\d{1,2}\/\d{1,2})\)/);
      const deadline = deadlineMatch ? deadlineMatch[1] : undefined;
      text = text.replace(/\(@\d{1,2}\/\d{1,2}\)/, '').trim();

      const estimateMatch = text.match(/\(([^)]+)\)$/);
      const estimate = estimateMatch ? estimateMatch[1] : undefined;
      if (estimateMatch) {
        text = text.replace(/\([^)]+\)$/, '').trim();
      }

      // 🚀 修正2: ParsedTaskの型に合わせて、物理インデントや行番号をしっかり持たせる！
      tasks.push({
        id: `task-line-${index}`, 
        text,
        status,
        indent: rawIndentWidth,     // 👈 これを入れることでエラー3が消滅！
        lineNumber: index + 1,      // 👈 Markdownとしての物理行番号
        originalRaw: line,          // 👈 Markdownとしての生テキスト
        estimate,
        deadline,
        section: currentSection,
        routineType,
        routineId,
        difficulty,
      });
    }
  });

  // 🚀 修正3: 型通り、ParsedTask[] が入った ParseResult を返す
  return { tasks };
};