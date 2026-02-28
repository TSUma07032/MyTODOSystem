// src/hooks/useRoutines.ts
import { useState } from 'react';
import { format } from 'date-fns';
import type { Routine, DailyProgress } from '../types';
import { isRoutineActiveToday, calculateRoutineDeadlineTag } from '../logic/dateUtils';

export const useRoutines = (
  writeFile: (filename: string, content: string) => Promise<void>,
  appendTaskToInput: (newLine: string) => Promise<void> // 活性化したルーチンをタスクリストに追記するためのコールバック
) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completedDailyIds, setCompletedDailyIds] = useState<string[]>([]);
  
  // Drawer用UIステート
  const [isRoutineDrawerOpen, setIsRoutineDrawerOpen] = useState(false);
  const [drawerRoutineType, setDrawerRoutineType] = useState<'daily'|'weekly'>('daily');
  const [drawerRoutineText, setDrawerRoutineText] = useState('');
  const [drawerGenerateOn, setDrawerGenerateOn] = useState('Mon'); 
  const [drawerDeadline, setDrawerDeadline] = useState('none');

  // ファイルからの初期データ読み込み用
  const initRoutines = (data: Routine[]) => setRoutines(data);
  const initDailyProgress = (data: DailyProgress, allRoutines: Routine[]) => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
    
      if (data.date === todayStr) {
        setCompletedDailyIds(data.completedRoutineIds);
        return 0; // 今日ならペナルティなし
      } else {
        // 【判定ロジック】
        // 1. 前回保存された日付(data.date)において、本来やるべきだったルーチンを特定
        const lastLoginDate = new Date(data.date);
        const activeRoutinesCount = allRoutines.filter(r => 
          isRoutineActiveToday(r, lastLoginDate) // dateUtils の判定関数を使用
        ).length;
    
        // 2. 未達成数を算出 (本来の数 - 実際に完了した数)
        const missedCount = Math.max(0, activeRoutinesCount - data.completedRoutineIds.length);
        
        setCompletedDailyIds([]);
        // 日付を更新して保存
        writeFile('daily_progress.json', JSON.stringify({ date: todayStr, completedRoutineIds: [] }, null, 2));
        
        return missedCount; // 未達成数を返して App.tsx でコインを減らす
      }
    };

  const saveRoutineJSON = async (newRoutineData: Omit<Routine, 'id'>) => {
    const routine: Routine = { ...newRoutineData, id: `r-${Date.now()}` };
    const newRoutines = [...routines, routine];
    setRoutines(newRoutines);
    await writeFile('routines.json', JSON.stringify(newRoutines, null, 2));

    // 今日が活性日の場合、Markdownテキスト側に追記する処理を呼び出す
    if (isRoutineActiveToday(routine)) {
      const tag = calculateRoutineDeadlineTag(routine);
      const newLine = `- [ ] ${routine.text} (${routine.type}:${routine.id})${tag} `;
      await appendTaskToInput(newLine);
    }
  };

  const deleteRoutineJSON = async (id: string) => { 
    const newRoutines = routines.filter(r => r.id !== id); 
    setRoutines(newRoutines); 
    await writeFile('routines.json', JSON.stringify(newRoutines, null, 2)); 
  };

  const handleAddRoutineFromDrawer = async () => { 
    if (drawerRoutineText.trim()) { 
      await saveRoutineJSON({ 
        text: drawerRoutineText.trim(), 
        type: drawerRoutineType, 
        generateOn: drawerRoutineType === 'weekly' ? (drawerGenerateOn as any) : undefined, 
        deadlineRule: drawerRoutineType === 'daily' ? 'none' : (drawerDeadline as any) 
      }); 
      setDrawerRoutineText(''); 
    } 
  };

  // デイリールーチンの完了トグル（UI側から呼び出され、コイン変動量を返す）
  const toggleDailyProgress = async (routineId: string) => {
    const isNowCompleted = !completedDailyIds.includes(routineId);
    const newCompletedIds = isNowCompleted
      ? [...completedDailyIds, routineId]
      : completedDailyIds.filter(id => id !== routineId);

    setCompletedDailyIds(newCompletedIds);

    const progress: DailyProgress = {
      date: format(new Date(), 'yyyy-MM-dd'),
      completedRoutineIds: newCompletedIds
    };
    await writeFile('daily_progress.json', JSON.stringify(progress, null, 2));

    // コイン計算用情報を返す（ルーチンは難易度1、倍率5として固定計算）
    return { isCompleted: isNowCompleted, coinDiff: 5 };
  };

  return {
    routines, initRoutines,
    completedDailyIds, initDailyProgress,
    isRoutineDrawerOpen, setIsRoutineDrawerOpen,
    drawerRoutineType, setDrawerRoutineType,
    drawerRoutineText, setDrawerRoutineText,
    drawerGenerateOn, setDrawerGenerateOn,
    drawerDeadline, setDrawerDeadline,
    saveRoutineJSON,
    deleteRoutineJSON,
    handleAddRoutineFromDrawer,
    toggleDailyProgress
  };
};