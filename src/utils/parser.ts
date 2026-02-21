import { type Task, type ParseResult } from '../types';

export const parseMarkdown = (markdown: string): ParseResult => {
  const lines = markdown.split('\n');
  const tasks: Task[] = [];
  let currentSection = '';

  lines.forEach((line, index) => {
    // 見出しの抽出
    const headerMatch = line.match(/^#+\s+(.+)$/);
    if (headerMatch) {
      currentSection = headerMatch[1];
      return;
    }

    // ★ 標準的で美しいMarkdownリストのみを許容する正規表現
    const taskMatch = line.match(/^(\s*)-\s\[([ xX])\]\s+(.+)$/);
    
    if (taskMatch) {
      const indent = Math.floor(taskMatch[1].length / 2);
      const status = taskMatch[2].trim() ? 'done' : 'todo';
      let text = taskMatch[3]; // ここには「タスク名 + 各種タグ」が入る

      // 1. ルーチンの隠しタグの抽出
      const routineRegex = /\((daily|weekly):([-\w]+)\)/;
      const routineMatch = text.match(routineRegex);
      let routineType: 'daily' | 'weekly' | undefined = undefined;
      let routineId: string | undefined = undefined;

      if (routineMatch) {
        routineType = routineMatch[1] as 'daily' | 'weekly';
        routineId = routineMatch[2];
        text = text.replace(routineRegex, '').trim(); 
      }

      // 2. 難易度の抽出 (★X)
      let difficulty = 2; // デフォルトは★2
      const diffMatch = text.match(/\(★(\d+)\)/);
      if (diffMatch) {
        difficulty = parseInt(diffMatch[1], 10);
        text = text.replace(/\(★\d+\)/, '').trim();
      }

      // 3. 期限の抽出 (@MM/DD)
      const deadlineMatch = text.match(/\(@(\d{1,2}\/\d{1,2})\)/);
      const deadline = deadlineMatch ? deadlineMatch[1] : undefined;
      text = text.replace(/\(@\d{1,2}\/\d{1,2}\)/, '').trim();

      // 4. 見積もりの抽出 (30m) など
      const estimateMatch = text.match(/\(([^)]+)\)$/);
      const estimate = estimateMatch ? estimateMatch[1] : undefined;
      if (estimateMatch) {
        text = text.replace(/\([^)]+\)$/, '').trim();
      }

      // 最後に残った text が、純粋なタスク名になる
      tasks.push({
        id: `task-line-${index}`, // 行番号固定ID（DOM破壊防止）
        text,
        status,
        indent,
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

  return { tasks };
};