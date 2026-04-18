import { useState, useEffect, useRef, useCallback } from 'react';
import type { PomodoroMode } from '../types';
import { useTasks } from '@/features/tasks/store/useTasks'; // 🚀 タスクを直接操作！
// import { useGamification } from '@/features/gamification/store/useGamification'; // 🚀 コインを直接操作！
// import { toast } from '@/core/components/Toast'; // 🚀 トーストも直接呼ぶ！

// --- 定数群 ---
const WORK_TIME = 25 * 60;    
const BREAK_TIME = 10 * 60;   
const FREEZE_TIME = 40 * 60;  
const PENALTY_COINS = 100;    
const MAX_FREEZE = 3;         

// 簡易的なグローバル状態（再描画を防ぐためのシングルトンキュー）
let globalQueue: string[] = [];

export const usePomodoro = () => {
  // 🚀 他のドメインのStoreを直接読み込む
  const { tasks, updateTask } = useTasks();

  // --- キューの状態管理 ---
  const [queue, setQueueState] = useState<string[]>(globalQueue);

  // --- タイマーの状態管理 ---
  const [mode, setMode] = useState<PomodoroMode>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // (※その他の freezeCount, isMuted, isBreakAlarming などの State は元のまま保持)
  const [freezeCount, setFreezeCount] = useState(0);     
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBreakAlarming, setIsBreakAlarming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // =========================================================
  // 🎵 オーディオロジック (元のplayTick, playAlarmなどをそのまま配置)
  // =========================================================
  const playAlarm = useCallback(() => { /* 元のコード */ }, []);
  const stopAlarm = useCallback(() => { /* 元のコード */ }, []);
  const playTick = useCallback(() => { /* 元のコード */ }, [isMuted]);

  // =========================================================
  // ⏱️ タイマーロジック (バックグラウンド対応版そのまま)
  // =========================================================
  useEffect(() => {
    // ... 元のインターバル処理 (500msの deltaSeconds 計算) ...
  }, [mode, isConfirming, isMuted, isBreakAlarming]);


  // =========================================================
  // 🎯 アクション群 (Propsからの注入を廃止し、ここで完結させる)
  // =========================================================

  const confirmComplete = async (hasMoreTasks: boolean) => {
    stopAlarm();
    setIsConfirming(false);

    // 🚀 useTasks と useGamification の関数を直接呼ぶ！
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        updateTask(taskId, { totalWorkTime: (task.totalWorkTime || 0) + 25 });
      }
    }
    // await addCoins(50);

    if (hasMoreTasks) {
      setMode('break');
      setRemainingTime(BREAK_TIME);
      // toast.success("🎉 25分達成！ 50🪙獲得＆10分休憩に入ります");
    } else {
      setMode('idle');
      setTaskId(null);
      // toast.success("🎊 全てのキューを完了しました！");
    }
  };

  const stopEarly = async () => {
    // await removeCoins(PENALTY_COINS);
    stopAlarm();
    setMode('idle');
    setTaskId(null);
    // toast.critical(`🚨 早期離脱ペナルティ: -${PENALTY_COINS}🪙`);
  };

  // --- キュー操作のアクション ---
  const addToQueue = useCallback((newTaskId: string) => {
    if (globalQueue.includes(newTaskId) || taskId === newTaskId) return;
    globalQueue = [...globalQueue, newTaskId];
    setQueueState(globalQueue);
    // toast.info("Focus Queueに追加しました！");
  }, [taskId]);

  const removeFromQueue = useCallback((removeId: string) => {
    globalQueue = globalQueue.filter(id => id !== removeId);
    setQueueState(globalQueue);
  }, []);

  const startNextInQueue = useCallback(() => {
    if (globalQueue.length > 0) {
      const nextId = globalQueue[0];
      removeFromQueue(nextId);
      
      stopAlarm(); 
      setIsBreakAlarming(false);
      setTaskId(nextId);
      setMode('work');
      setRemainingTime(WORK_TIME);
      setIsConfirming(false); 
      // toast.warning("集中モード開始！離脱するとペナルティです");
    }
  }, [removeFromQueue, stopAlarm]);

  return { 
    mode, taskId, remainingTime, freezeCount, maxFreeze: MAX_FREEZE, 
    isConfirming, isBreakAlarming, isMuted,
    queue, addToQueue, removeFromQueue, startNextInQueue,
    stopEarly, confirmComplete, /* その他の関数 */
  };
};