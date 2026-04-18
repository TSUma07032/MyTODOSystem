// src/types/index.ts

// ==========================================
// 1. TODOコアシステム関連の型
// ==========================================

export type AppMode = 'dashboard' | 'daily' | 'sync' | 'history' | 'calendar' | 'pomodoro';

/**
 * 🚀 新時代（JSON）のメインタスク型
 * アプリケーション全体で引き回される、美しくフラットなデータ構造
 */
export interface Task {
  id: string;
  text: string;
  status: 'todo' | 'done';
  parentId: string | null; // 木構造を表現する絶対的な繋がり
  order: number;           // 同じ階層内での並び順
  estimate?: string;
  deadline?: string;
  section?: string;
  routineType?: 'daily' | 'weekly';
  routineId?: string;
  difficulty: number;
  totalWorkTime?: number;
  isQueue?: boolean; // ポモドーロキューに入っているかどうか
}

export type PomodoroMode = 'idle' | 'work' | 'break' | 'freeze';

/**
 * 📝 パーサー用の中間データ型
 * Markdownからパースされた直後で、物理的なインデント等を持つ（最終的にTask型に変換される）
 */
export interface ParsedTask {
  id: string;
  text: string;
  status: 'todo' | 'done';
  indent: number;       // 物理的な空白の数
  lineNumber: number;   // Markdown上の行番号
  originalRaw: string;  // Markdownの生テキスト
  estimate?: string;
  deadline?: string;
  section?: string;
  routineType?: 'daily' | 'weekly';
  routineId?: string;
  difficulty: number;
}

export interface ParseResult {
  tasks: ParsedTask[];
}

// ==========================================
// 2. ルーチン（習慣）関連の型
// ==========================================

export interface Routine {
  id: string;
  text: string;
  type: 'daily' | 'weekly';
  generateOn?: 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  deadlineRule: 'none' | 'today' | 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
}

export interface DailyProgress {
  lastCheckDate: string; // "yyyy-MM-dd"
  completedDailyIds: string[];
}

// カレンダー用の表示アイテム（CalendarViewで使われる）
export interface CalendarDayItem {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string;       // "YYYY-MM-DD" 形式 (カレンダー上の配置日)
  startTime?: string; // "10:00" など (任意)
  endTime?: string;   // "11:00" など (任意)
  memo?: string;      // 補足情報 (任意)
  color?: string;     // UIでの表示色（例: 'bg-blue-100'）(任意)
}