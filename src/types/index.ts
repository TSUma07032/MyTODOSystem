// src/types/index.ts

export interface Task {
  id: string;        // システム管理用ID (UUID)
  text: string;      // タスクの中身
  status: 'todo' | 'done'; 
  indent: number;    // 階層レベル (0, 1, 2...)
  estimate?: string; // 見積もり時間（例: "半日"）
  originalRaw: string; // 解析前の原文（保存時に元に戻すため）
  lineNumber: number;  // エディタの何行目か
  deadline?: string;
  section: string;
}

export interface ParseResult {
  tasks: Task[];
  errors: string[]; // HCI的優しさ：読めなかった行をここに溜める
}