// src/features/tasks/types.ts (整理後)
export interface Task {
  id: string;
  text: string;
  status: 'todo' | 'done';
  parentId: string | null;
  order: number;
  deadline?: string;
  difficulty: number; // 優先度の指標として残すと便利
  totalWorkTime?: number; // ポモドーロとの連携用
}