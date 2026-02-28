// src/hooks/useAppInitialization.ts
import { useEffect } from 'react';
import { format } from 'date-fns';
import type { Routine, DailyProgress, GamificationData, InfrastructureModule } from '../types';

interface InitializationProps {
  mode: 'dashboard' | 'daily' | 'sync' | 'history' | 'calendar';
  isReady: boolean;
  readFile: (filename: string) => Promise<string | null>;
  writeFile: (filename: string, content: string) => Promise<void>;
  initDailyProgress: (data: DailyProgress, allRoutines: Routine[]) => number;
  initGamification: (data: GamificationData) => void;
  initRoutines: (data: Routine[]) => void;
  initInfrastructure: (modules: InfrastructureModule[], debt: number) => void;
  setInput: (text: string) => void;
  setHistoryItems: (items: any[]) => void;
  routines: Routine[]; 
  onPenalty: (missedCount: number) => void; 
}

export const useAppInitialization = ({
  mode, isReady, readFile, writeFile,
  initDailyProgress, initGamification, initRoutines, initInfrastructure,
  setInput, setHistoryItems,
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
          if (missedCount > 0) {
            onPenalty(missedCount); // ペナルティを親に報告
          }
        }
      } catch (err) {
        console.log("Daily progress file not found.");
      }
    };
    loadDailyStatus();
  }, [isReady, routines.length > 0]);

  // 2. メインデータ（タスク、コイン、ルーチン）の読み込みと、日付変更時の自動注入
  useEffect(() => {
    const loadData = async () => {
      if ((mode === 'dashboard' || mode === 'calendar') && isReady) {
        let content = await readFile('current_active_todo.md') || "## Today\n- [ ] まだタスクがないよ！\n- [ ] 夜モードで同期して生成しよう";

        try {
          const infraContent = await readFile('infrastructure.json');
          if (infraContent) {
            const parsed = JSON.parse(infraContent);
            initInfrastructure(parsed.modules || [], parsed.debt || 0);
          }
        } catch (e) {
          console.log("Infrastructure data not found, starting fresh.");
        }
        
        let gameJson = await readFile('gamification.json');
        if (gameJson) initGamification(JSON.parse(gameJson));

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayDowStr = format(new Date(), 'E'); 
        const lastDate = localStorage.getItem('lastRoutineDate');
        
        let rJson = await readFile('routines.json');
        let currentRoutines = rJson ? JSON.parse(rJson) : [];
        initRoutines(currentRoutines);

        // 日付が変わっていたら、ルーチンをタスクリストに自動追加する
        if (lastDate !== todayStr && currentRoutines.length > 0) {
          const tasksToInject = currentRoutines.filter((r: any) => r.type === 'daily' || (r.type === 'weekly' && r.generateOn === todayDowStr));
          if (tasksToInject.length > 0) {
            let textToAppend = "\n## Routines\n";
            tasksToInject.forEach((r: any) => {
              let tag = "";
              if (r.deadlineRule === 'today') { 
                tag = ` (@${format(new Date(), 'M/d')})`; 
              } else if (r.deadlineRule !== 'none') {
                 const daysMap: Record<string, number> = { 'Sun':0, 'Mon':1, 'Tue':2, 'Wed':3, 'Thu':4, 'Fri':5, 'Sat':6 };
                 let diff = daysMap[r.deadlineRule] - new Date().getDay();
                 if (diff < 0) diff += 7; 
                 const targetDate = new Date(new Date().setDate(new Date().getDate() + diff));
                 tag = ` (@${targetDate.getMonth()+1}/${targetDate.getDate()})`;
              }
              textToAppend += `- [ ] ${r.text} (${r.type}:${r.id})${tag} \n`;
            });
            content = content + (content.endsWith('\n') ? '' : '\n') + textToAppend.trimEnd();
            await writeFile('current_active_todo.md', content);
          }
          localStorage.setItem('lastRoutineDate', todayStr);
        }
        setInput(content);
      }
    };
    loadData();
  }, [mode, isReady]);

  // 3. 過去履歴データの読み込み
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