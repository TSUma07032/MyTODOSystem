// src/hooks/useAppInitialization.ts
import { useEffect } from 'react';
import { format } from 'date-fns'; // 👈 復活
import type { Routine, DailyProgress, GamificationData, InfrastructureModule, Task } from '../types';
import { parseMarkdown } from '../utils/parser';
import { migrateMarkdownToJson } from '../utils/migrator';

interface InitializationProps {
  mode: 'dashboard' | 'daily' | 'sync' | 'history' | 'calendar';
  isReady: boolean;
  readFile: (filename: string) => Promise<string | null>;
  writeFile: (filename: string, content: string) => Promise<void>;
  initDailyProgress: (data: DailyProgress, allRoutines: Routine[]) => number;
  initGamification: (data: GamificationData) => void;
  initRoutines: (data: Routine[]) => void;
  initInfrastructure: (modules: InfrastructureModule[], debt: number) => void;
  setTasks: (tasks: Task[]) => void;
  setHistoryItems: (items: any[]) => void; // 👈 復活
  routines: Routine[]; 
  onPenalty: (missedCount: number) => void; 
}

export const useAppInitialization = ({
  mode, isReady, readFile, writeFile,
  initDailyProgress, initGamification, initRoutines, initInfrastructure,
  setTasks, setHistoryItems, // 👈 復活
  routines, onPenalty
}: InitializationProps) => {

  // 1. デイリー進捗（昨日までのチェック状態）の読み込み
  useEffect(() => {
    const loadDailyStatus = async () => {
      if (!isReady) return;
      try {
        const content = await readFile('daily_progress.json');
        if (content) {
          const missedCount = initDailyProgress(JSON.parse(content), routines);
          if (missedCount > 0) onPenalty(missedCount);
        }
      } catch (err) {
        console.log("Daily progress file not found.");
      }
    };
    loadDailyStatus();
  }, [isReady, routines.length > 0]);

  // 2. メインデータの読み込みと、ルーチンの自動生成（JSON版）
  useEffect(() => {
    const loadData = async () => {
      if ((mode === 'dashboard' || mode === 'calendar') && isReady) {
        
        // --- タスクの読み込み＆マイグレーション ---
        let loadedTasks: Task[] = [];
        const jsonContent = await readFile('current_active_todo.json');
        
        if (jsonContent) {
          loadedTasks = JSON.parse(jsonContent);
        } else {
          const mdContent = await readFile('current_active_todo.md') || "## Today\n- [ ] まだタスクがないよ！";
          const { tasks: parsed } = parseMarkdown(mdContent);
          loadedTasks = migrateMarkdownToJson(parsed as any);
          await writeFile('current_active_todo.json', JSON.stringify(loadedTasks, null, 2));
        }

        // --- インフラ・ゲーミフィケーションの読み込み ---
        try {
          const infraContent = await readFile('infrastructure.json');
          if (infraContent) {
            const parsed = JSON.parse(infraContent);
            initInfrastructure(parsed.modules || [], parsed.debt || 0);
          }
        } catch (e) { /* fresh start */ }
        
        let gameJson = await readFile('gamification.json');
        if (gameJson) initGamification(JSON.parse(gameJson));

        // --- ルーチンの読み込みと、新時代(JSON)のタスク自動追加 ---
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayDowStr = format(new Date(), 'E'); 
        const lastDate = localStorage.getItem('lastRoutineDate');
        
        let rJson = await readFile('routines.json');
        let currentRoutines = rJson ? JSON.parse(rJson) : [];
        initRoutines(currentRoutines);

        if (lastDate !== todayStr && currentRoutines.length > 0) {
          const tasksToInject = currentRoutines.filter((r: any) => r.type === 'daily' || (r.type === 'weekly' && r.generateOn === todayDowStr));
          
          if (tasksToInject.length > 0) {
            tasksToInject.forEach((r: any) => {
              let deadlineStr = undefined;
              if (r.deadlineRule === 'today') { 
                deadlineStr = format(new Date(), 'M/d');
              } else if (r.deadlineRule !== 'none') {
                 const daysMap: Record<string, number> = { 'Sun':0, 'Mon':1, 'Tue':2, 'Wed':3, 'Thu':4, 'Fri':5, 'Sat':6 };
                 let diff = daysMap[r.deadlineRule] - new Date().getDay();
                 if (diff < 0) diff += 7; 
                 const targetDate = new Date(new Date().setDate(new Date().getDate() + diff));
                 deadlineStr = `${targetDate.getMonth()+1}/${targetDate.getDate()}`;
              }

              // 🔥 新しい Task 型として配列に Push する！
              loadedTasks.push({
                id: `routine-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                text: r.text,
                status: 'todo',
                parentId: null,
                order: loadedTasks.length,
                difficulty: 2,
                routineType: r.type,
                routineId: r.id,
                deadline: deadlineStr
              });
            });
            await writeFile('current_active_todo.json', JSON.stringify(loadedTasks, null, 2));
          }
          localStorage.setItem('lastRoutineDate', todayStr);
        }

        setTasks(loadedTasks);
      }
    };
    loadData();
  }, [mode, isReady]);

  // 3. 過去履歴データの読み込み (復活)
  useEffect(() => { 
    const loadHistory = async () => { 
      if (mode === 'history' && isReady) { 
        const content = await readFile('history_index.json'); 
        if (content) setHistoryItems(JSON.parse(content)); 
      } 
    }; 
    loadHistory(); 
  }, [mode, isReady]);

};