/*
// 以前のタスク構造体は、Markdownの行をそのまま表現するためのものでしたが、
// 挙動が不安定になってきたため破棄しました。
export interface Task {
  id: string;
  text: string;
  status: 'todo' | 'done';
  indent: number;
  lineNumber: number;
  originalRaw: string;
  estimate?: string;
  deadline?: string;
  section?: string;
  routineType?: 'daily' | 'weekly';
  routineId?: string;
  difficulty: number; // ★追加：難易度(星)
}
*/

export interface ParseResult {
  tasks: Task[];
}

export interface Routine {
  id: string;
  text: string;
  type: 'daily' | 'weekly';
  generateOn?: 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  deadlineRule: 'none' | 'today' | 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
}

// ★追加：ゲーミフィケーション用
export interface ShopItem {
  id: string;
  name: string;
  cost: number;
  icon: string;
}

export interface GamificationData {
  coins: number;
  shopItems: ShopItem[];
}

export interface DailyProgress {
  date: string; // "2024-03-20"
  completedRoutineIds: string[]; // 完了したルーチンのIDリスト
}

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
  color: string; // Tailwindのテキストカラークラス等（例: 'text-purple-500'）

  // 動的に変動する性能
  currentIncomeMultiplier?: number;      // 1.0 〜 2.0 倍
  currentMaintenanceMultiplier?: number; // 1.0~5.0 倍
}

// json用のタスク構造体（木構造を表現）
export interface Task {
  id: string;
  text: string;
  status: 'todo' | 'done';
  
  // 木構造
  parentId: string | null; // 親を持たないルートタスクは null
  order: number;           // 表示順（ドラッグ＆ドロップで入れ替える用）
  
  // --- 以下のビジネスロジック・メタデータはそのまま維持 ---
  estimate?: string;
  deadline?: string;
  section?: string;
  routineType?: 'daily' | 'weekly';
  routineId?: string;
  difficulty: number;
}