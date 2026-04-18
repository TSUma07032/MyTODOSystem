import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';

export const usePomodoroQueue = (currentTaskId: string | null | undefined) => {
  const [queue, setQueueState] = useState<string[]>([]);

  useEffect(() => {
    get<string[]>('pomodoro-queue').then(saved => saved && setQueueState(saved));
  }, []);

  const saveAndSetQueue = useCallback((newQueue: string[]) => {
    setQueueState(newQueue);
    set('pomodoro-queue', newQueue);
  }, []);

  const addToQueue = useCallback((taskId: string) => {
    if (queue.includes(taskId) || currentTaskId === taskId) return;
    saveAndSetQueue([...queue, taskId]);
  }, [queue, currentTaskId, saveAndSetQueue]);

  const removeFromQueue = useCallback((taskId: string) => {
    saveAndSetQueue(queue.filter(id => id !== taskId));
  }, [queue, saveAndSetQueue]);

  return { queue, addToQueue, removeFromQueue };
};