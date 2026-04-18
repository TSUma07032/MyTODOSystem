// src/features/routines/store/useRoutines.ts
import { useState, useCallback } from 'react';
import type { Routine } from '../types';
import { useFileSystem } from '@/core/hooks/useFileSystem';

// シングルトン的に状態を保持（Contextなしで複数箇所から呼ぶため）
let globalRoutines: Routine[] = [];
let globalIsOpen = false; // 🚀 追加：開閉状態を保持

export const useRoutines = () => {
  const [routines, setRoutinesState] = useState<Routine[]>(globalRoutines);
  const [isOpen, setIsOpenState] = useState(globalIsOpen); // 🚀 追加：UI用のステート
  const { writeFile } = useFileSystem();

  // 🚀 追加：開閉を切り替える関数
  const setIsOpen = useCallback((open: boolean) => {
    globalIsOpen = open;
    setIsOpenState(open);
  }, []);

  const syncAndSave = useCallback(async (newRoutines: Routine[]) => {
    globalRoutines = newRoutines;
    setRoutinesState(newRoutines);
    await writeFile('routines.json', JSON.stringify(newRoutines, null, 2));
  }, [writeFile]);

  const addRoutine = useCallback((newRoutine: Routine) => {
    syncAndSave([...globalRoutines, newRoutine]);
  }, [syncAndSave]);

  const deleteRoutine = useCallback((id: string) => {
    syncAndSave(globalRoutines.filter(r => r.id !== id));
  }, [syncAndSave]);

  const initRoutines = useCallback((loadedRoutines: Routine[]) => {
    globalRoutines = loadedRoutines;
    setRoutinesState(loadedRoutines);
  }, []);

  return { 
    routines, 
    isOpen,      
    setIsOpen,   
    addRoutine, 
    deleteRoutine, 
    initRoutines 
  };
};