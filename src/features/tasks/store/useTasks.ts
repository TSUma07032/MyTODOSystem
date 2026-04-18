import { useState, useCallback, useRef } from 'react';
import type { Task } from '../types';
import { useFileSystem } from '@/core/hooks/useFileSystem';
import { getDescendantIds } from '../logic/taskHierarchy';

// グローバルにタスクを保持（簡易的な状態共有）
let globalTasks: Task[] = [];

export const useTasks = () => {
  const [tasks, setTasksState] = useState<Task[]>(globalTasks);
  const { writeFile } = useFileSystem();
  
  // デバウンス（遅延保存）用のタイマーを保持するRef
  const saveTimeoutRef = useRef<number | null>(null);

  // 1. 内部状態の更新と、ファイルへの自動保存（2秒遅延）を行うコア関数
  const syncAndSave = useCallback((newTasks: Task[]) => {
    // UIは即座に更新する（サクサク動く）
    globalTasks = newTasks;
    setTasksState(newTasks);

    // 既存のタイマーがあればキャンセル
    if (saveTimeoutRef.current !== null) {
      window.clearTimeout(saveTimeoutRef.current);
    }

    // 2秒後にファイルに書き込む予約をする
    saveTimeoutRef.current = window.setTimeout(async () => {
      try {
        await writeFile('current_active_todo.json', JSON.stringify(newTasks, null, 2));
        console.log('[Store] 💾 タスクをファイルに自動保存しました！');
      } catch (error) {
        console.error('タスク保存エラー:', error);
      }
    }, 2000);
  }, [writeFile]);

  // 2. 初期化用関数（useAppInitialization から呼ばれる）
  const initTasks = useCallback((loadedTasks: Task[]) => {
    globalTasks = loadedTasks;
    setTasksState(loadedTasks);
  }, []);

  // ==========================================
  // 3. アプリから呼ばれるタスク操作（CRUD）
  // ==========================================

  const addTask = useCallback((newTask: Task) => {
    syncAndSave([...globalTasks, newTask]);
  }, [syncAndSave]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const updated = globalTasks.map(t => t.id === id ? { ...t, ...updates } : t);
    syncAndSave(updated);
  }, [syncAndSave]);

  const deleteTask = useCallback((id: string) => {
    // 自分自身と、その「すべての子孫タスク」を一緒に削除する
    const idsToRemove = new Set([id, ...getDescendantIds(id, globalTasks)]);
    const filtered = globalTasks.filter(t => !idsToRemove.has(t.id));
    syncAndSave(filtered);
  }, [syncAndSave]);

  const reorderTasks = useCallback((reorderedTasks: Task[]) => {
    syncAndSave(reorderedTasks);
  }, [syncAndSave]);

  return { 
    tasks, 
    initTasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    reorderTasks 
  };
};