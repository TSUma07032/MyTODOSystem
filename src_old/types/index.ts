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

// ==========================================
// 3. ゲーミフィケーション（ショップ）関連の型
// ==========================================

export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  icon: string;
  description?: string;
}

export interface GamificationData {
  coins: number;
  shopItems: ShopItem[];
}

// ==========================================
// 4. インフラ（放置ゲーム要素）関連の型
// ==========================================

export type ModuleStatus = 'on' | 'off';

export interface InfrastructureModule {
  id: string;
  name: string;
  level: number;       // 現在のレベル (1〜10)
  rank: number;        // 転生回数（星の数）
  status: ModuleStatus;
  
  // 基礎性能（レベル1・ランク0の時の値）
  baseIncome: number;      // 1日あたりのコイン生成量
  baseMultiplier: number;  // タスク完了時のボーナス倍率 (例: 0.1 なら +10%)
  baseMaintenance: number; // 1日あたりの維持費
  
  // 個性（生成時のレアリティや属性を表現。UIの装飾などに使う）
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  color: string; // Tailwindのテキストカラークラス等

  // 動的に変動する性能
  currentIncomeMultiplier?: number;      // 1.0 〜 2.0 倍
  currentMaintenanceMultiplier?: number; // 1.0~5.0 倍
  
  lastProcessedAt?: string; // "yyyy-MM-dd" (追加したプロパティ)
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