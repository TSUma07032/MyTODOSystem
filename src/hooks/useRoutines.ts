import { useState } from 'react';
import type { Routine } from '../types';
import { isRoutineActiveToday, calculateRoutineDeadlineTag } from '../logic/dateUtils';

export const useRoutines = (
  writeFile: (filename: string, content: string) => Promise<void>,
  readFile: (filename: string) => Promise<string | null>
) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isRoutineDrawerOpen, setIsRoutineDrawerOpen] = useState(false);

  // ルーチンを読み込む (1機能: データロード)
  const loadRoutines = async () => {
    const content = await readFile('routines.json');
    if (content) {
      setRoutines(JSON.parse(content));
    }
  };

  // 新規ルーチンの保存 (1機能: 永続化)
  const saveRoutine = async (newRoutine: Omit<Routine, 'id'>) => {
    const routine: Routine = { ...newRoutine, id: `r-${Date.now()}` };
    const newRoutines = [...routines, routine];
    setRoutines(newRoutines);
    await writeFile('routines.json', JSON.stringify(newRoutines, null, 2));
    return routine;
  };

  // ルーチンの削除
  const deleteRoutine = async (id: string) => {
    const newRoutines = routines.filter(r => r.id !== id);
    setRoutines(newRoutines);
    await writeFile('routines.json', JSON.stringify(newRoutines, null, 2));
  };

  // 今日のタスクに注入すべきテキストを生成する (1機能: テキスト変換)
  const generateRoutineTasksText = (currentRoutines: Routine[]): string => {
    const today = new Date();
    const tasksToInject = currentRoutines.filter(r => isRoutineActiveToday(r, today));
    
    if (tasksToInject.length === 0) return "";

    let textToAppend = "\n## Routines\n";
    tasksToInject.forEach(r => {
      const tag = calculateRoutineDeadlineTag(r, today);
      textToAppend += `- [ ] ${r.text}${tag} \n`;
    });
    return textToAppend;
  };

  return {
    routines,
    setRoutines,
    loadRoutines,
    saveRoutine,
    deleteRoutine,
    generateRoutineTasksText,
    isRoutineDrawerOpen,
    setIsRoutineDrawerOpen,
  };
};