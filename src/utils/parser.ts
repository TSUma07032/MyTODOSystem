import { v4 as uuidv4 } from 'uuid';
import { type Task, type ParseResult } from '../types';

// セクション見出しの正規形 (例: "## Today")
const SECTION_REGEX = /^(#+)\s+(.*)$/;
const TASK_REGEX = /^(\s*)-\s\[( |x|X)\]\s(.*?)(?:\s+\(@(\d{1,4}[/-]\d{1,2}(?:[/-]\d{1,2})?)\))?\s*$/;
const ESTIMATE_REGEX = /[（(](.+?)[)）]/;

export const parseMarkdown = (markdown: string): ParseResult => {
  const lines = markdown.split(/\r?\n/);
  const tasks: Task[] = [];
  const errors: string[] = [];
  
  // 現在のセクション名を保持する変数（初期値は "Backlog" としておきます）
  let currentSection = "Backlog"; 

  lines.forEach((line, index) => {
    if (!line.trim()) return;

    // ★ 見出し行の判定
    const sectionMatch = line.match(SECTION_REGEX);
    if (sectionMatch) {
      currentSection = sectionMatch[2].trim(); // "Today" などを取得
      return; // タスクではないので次へ
    }

    const match = line.match(TASK_REGEX);

    if (match) {
      const [, spaces, statusChar, rawText, deadlineDate] = match;
      const indentLevel = Math.floor(spaces.length / 2);
      const isDone = statusChar.toLowerCase() === 'x';
      const estimateMatch = rawText.match(ESTIMATE_REGEX);
      const estimate = estimateMatch ? estimateMatch[1] : undefined;
      const cleanText = rawText.trim();

      tasks.push({
        id: uuidv4(),
        text: cleanText,
        status: isDone ? 'done' : 'todo',
        indent: indentLevel,
        estimate: estimate,
        deadline: deadlineDate,
        originalRaw: line,
        lineNumber: index + 1,
        section: currentSection, // ★ ここでセクションを保存！
      });
    }
  });

  return { tasks, errors };
};