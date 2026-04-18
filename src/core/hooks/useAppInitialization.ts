// src/core/hooks/useAppInitialization.ts

import { useEffect, useState } from 'react';
import { useFileSystem } from './useFileSystem';
// ※ここにタスク生成ロジックは書かない！

export const useAppInitialization = (/* 各種セッター */) => {
  const { isReady, readFile, writeFile } = useFileSystem();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const bootstrapApp = async () => {
      if (!isReady) return;

      try {
        // 1. ひたすら読み込む（I/O処理に専念）
        const [todoStr, infraStr, gameStr, routineStr] = await Promise.all([
          readFile('current_active_todo.json'),
          readFile('routines.json')
        ]);

        // 2. パースして各FeatureのStoreに渡す
        if (infraStr) initInfrastructure(JSON.parse(infraStr));
        if (gameStr) initGamification(JSON.parse(gameStr));
        
        let routines = routineStr ? JSON.parse(routineStr) : [];
        initRoutines(routines);

        let tasks = todoStr ? JSON.parse(todoStr) : [];
        
        // 🚨 修正ポイント：ルーチンからタスクを生成するロジックは、
        // features/routines/logic/routineGenerator.ts のような外部関数に任せる！
        // tasks = generateTodayRoutineTasks(tasks, routines); 
        // await writeFile('current_active_todo.json', JSON.stringify(tasks));

        setTasks(tasks);

        // 完了
        setIsInitialized(true);

      } catch (error) {
        console.error("初期化エラー:", error);
      }
    };

    bootstrapApp();
  }, [isReady]);

  return { isInitialized };
};