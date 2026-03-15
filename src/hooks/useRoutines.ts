// src/hooks/useRoutines.ts
import { useState } from 'react';
import { format } from 'date-fns';
import type { Routine, DailyProgress } from '../types';
import { isRoutineActiveToday } from '../logic/dateUtils'; // calculateRoutineDeadlineTag はもう不要なので消しました

export const useRoutines = (
  writeFile: (filename: string, content: string) => Promise<void>,
  // 🚀 修正: Markdown文字列ではなく、Routineオブジェクトそのものを渡すように変更！
  onRoutineActivated: (routine: Routine) => Promise<void> 
) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completedDailyIds, setCompletedDailyIds] = useState<string[]>([]);
  
  const [isRoutineDrawerOpen, setIsRoutineDrawerOpen] = useState(false);
  const [drawerRoutineType, setDrawerRoutineType] = useState<'daily'|'weekly'>('daily');
  const [drawerRoutineText, setDrawerRoutineText] = useState('');
  const [drawerGenerateOn, setDrawerGenerateOn] = useState('Mon'); 
  const [drawerDeadline, setDrawerDeadline] = useState('none');

  const initRoutines = (data: Routine[]) => setRoutines(data);
  
  const initDailyProgress = (data: DailyProgress, allRoutines: Routine[]) => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
    
      // 🚀 修正: date -> lastCheckDate, completedRoutineIds -> completedDailyIds
      if (data.lastCheckDate === todayStr) {
        setCompletedDailyIds(data.completedDailyIds);
        return 0; 
      } else {
        const lastLoginDate = new Date(data.lastCheckDate);
        const activeRoutinesCount = allRoutines.filter(r => 
          isRoutineActiveToday(r, lastLoginDate)
        ).length;
    
        const missedCount = Math.max(0, activeRoutinesCount - data.completedDailyIds.length);
        
        setCompletedDailyIds([]);
        // 🚀 修正: 保存時のプロパティ名も新しい型に合わせる
        writeFile('daily_progress.json', JSON.stringify({ lastCheckDate: todayStr, completedDailyIds: [] }, null, 2));
        
        return missedCount; 
      }
    };

  const saveRoutineJSON = async (newRoutineData: Omit<Routine, 'id'>) => {
    const routine: Routine = { ...newRoutineData, id: `r-${Date.now()}` };
    const newRoutines = [...routines, routine];
    setRoutines(newRoutines);
    await writeFile('routines.json', JSON.stringify(newRoutines, null, 2));

    // 今日が活性日の場合、文字列ではなくRoutineオブジェクトをそのまま通知！
    if (isRoutineActiveToday(routine)) {
      await onRoutineActivated(routine);
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

  const toggleDailyProgress = async (routineId: string) => {
    const isNowCompleted = !completedDailyIds.includes(routineId);
    const newCompletedIds = isNowCompleted
      ? [...completedDailyIds, routineId]
      : completedDailyIds.filter(id => id !== routineId);

    setCompletedDailyIds(newCompletedIds);

    const progress: DailyProgress = {
      lastCheckDate: format(new Date(), 'yyyy-MM-dd'), // 🚀 修正
      completedDailyIds: newCompletedIds               // 🚀 修正
    };
    await writeFile('daily_progress.json', JSON.stringify(progress, null, 2));

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