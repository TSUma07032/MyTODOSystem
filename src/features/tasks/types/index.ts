export type TaskStatus = 'todo' | 'done';

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  parentId: string | null;
  order: number;
  difficulty: number;      // 1-5の重要度
  deadline?: string;       // "YYYY-MM-DD"
  totalWorkTime?: number;  // 累計作業時間 (分)
  createdAt: number;
}