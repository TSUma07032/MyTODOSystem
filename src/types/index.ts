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