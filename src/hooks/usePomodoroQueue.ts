import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';

export const usePomodoroQueue = (
  currentTaskId: string | null | undefined, 
  showToast: (msg: string, diff: number) => void
) => {
  const [queue, setQueueState] = useState<string[]>([]);

  // 1. 初回マウント時に IndexedDB からデータを復元 (Load)
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const savedQueue = await get<string[]>('pomodoro-queue');
        if (savedQueue && Array.isArray(savedQueue)) {
          setQueueState(savedQueue);
        }
      } catch (err) {
        console.error('Failed to load pomodoro queue', err);
      }
    };
    loadQueue();
  }, []);

  // 2. キュー状態を更新しつつ、自動的に IndexedDB に保存 (Save)
  const setQueue = useCallback((newQueue: string[] | ((prev: string[]) => string[])) => {
    setQueueState(prev => {
      const updatedQueue = typeof newQueue === 'function' ? newQueue(prev) : newQueue;
      set('pomodoro-queue', updatedQueue).catch(e => console.error('Failed to save queue', e));
      return updatedQueue;
    });
  }, []);

  // 3. アクション（追加）
  const addToQueue = useCallback((taskId: string) => {
    setQueue(prev => {
      // 既にキューにある、または現在タイマーにセットされている場合は追加しない
      if (prev.includes(taskId) || currentTaskId === taskId) return prev;
      showToast("Focus Queueに追加しました！", 1);
      return [...prev, taskId];
    });
  }, [currentTaskId, showToast, setQueue]);

  // 4. アクション（削除）
  const removeFromQueue = useCallback((taskId: string) => {
    setQueue(prev => prev.filter(id => id !== taskId));
  }, [setQueue]);

  // 5. アクション（次を取り出す：PomodoroView側で連続実行する際に便利です）
  const popNextTask = useCallback(() => {
    let nextTask: string | null = null;
    setQueue(prev => {
      if (prev.length === 0) return prev;
      nextTask = prev[0];
      return prev.slice(1);
    });
    return nextTask;
  }, [setQueue]);

  // 6. アクション（並び替えを追加！）
  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, [setQueue]);

  // ★ 戻り値に reorderQueue を追加
  return { queue, addToQueue, removeFromQueue, popNextTask, reorderQueue };
};