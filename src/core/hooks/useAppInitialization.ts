import { useEffect, useState } from 'react';
import { useFileSystem } from './useFileSystem';
import { useTasks } from '@/features/tasks/store/useTasks'; 
import { useRoutines } from '@/features/routines/store/useRoutines'; 

export const useAppInitialization = () => {
  const { isReady, readFile } = useFileSystem();
  const [isInitialized, setIsInitialized] = useState(false);
  const { initTasks } = useTasks();      // Storeから初期化関数を取得
  const { initRoutines } = useRoutines();

  useEffect(() => {
    const bootstrapApp = async () => {
      if (!isReady) return;
      try {
        // 🚨 修正：読み込むファイルの数と変数の数を合わせる
        const [todoStr, routineStr] = await Promise.all([
          readFile('current_active_todo.json'),
          readFile('routines.json')
        ]);

        if (todoStr) initTasks(JSON.parse(todoStr));
        if (routineStr) initRoutines(JSON.parse(routineStr));

        setIsInitialized(true);
      } catch (error) {
        console.error("初期化エラー:", error);
      }
    };
    bootstrapApp();
  }, [isReady, readFile, initTasks, initRoutines]);

  return { isInitialized };
};