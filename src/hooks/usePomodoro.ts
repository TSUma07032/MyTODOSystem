// src/hooks/usePomodoro.ts
import { useState, useEffect } from 'react';
import type { PomodoroMode } from '../types';

const WORK_TIME = 25 * 60;    // 25分（秒）
const BREAK_TIME = 10 * 60;   // 10分休憩
const FREEZE_TIME = 40 * 60;  // 40分ご飯・緊急離席
const PENALTY_COINS = 100;    // 中断ペナルティ
const MAX_FREEZE = 3;         // 1日の凍結上限

export const usePomodoro = (
  removeCoins: (amount: number) => Promise<void>,
  addCoins: (amount: number) => Promise<void>,
  onAddWorkTime: (taskId: string, minutes: number) => Promise<void>,
  showToast: (msg: string, difficulty: number) => void
) => {
  const [mode, setMode] = useState<PomodoroMode>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const [savedWorkTime, setSavedWorkTime] = useState(0); // 凍結復帰用
  const [freezeCount, setFreezeCount] = useState(0);     // 本日の凍結回数

  // 1日の凍結回数をリセット＆ロード
  useEffect(() => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastFreezeDate');
    if (lastDate !== today) {
      setFreezeCount(0);
      localStorage.setItem('lastFreezeDate', today);
      localStorage.setItem('freezeCount', '0');
    } else {
      setFreezeCount(Number(localStorage.getItem('freezeCount') || 0));
    }
  }, []);

  // タイマーのカウントダウン処理
  useEffect(() => {
    if (mode === 'idle') return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode]);

  // 各モードの時間がゼロになった時の処理
  const handleTimerEnd = async () => {
    if (mode === 'work') {
      setMode('break');
      setRemainingTime(BREAK_TIME);
      await addCoins(50);
      if (taskId) await onAddWorkTime(taskId, 25);
      showToast("🎉 25分達成！ 50🪙獲得＆10分休憩に入ります", 1);
    } else if (mode === 'break') {
      setMode('idle');
      setTaskId(null);
      showToast("休憩終了。次のタスクを選びましょう！", 2);
    } else if (mode === 'freeze') {
      // 🚨 40分以内に戻らなかった場合の強制ペナルティ
      setMode('idle');
      setTaskId(null);
      await removeCoins(PENALTY_COINS);
      showToast(`🚨 凍結時間オーバー！ペナルティ -${PENALTY_COINS}🪙`, 5);
    }
  };

  // --- アクション群 ---
  const startWork = (id: string) => {
    setTaskId(id);
    setMode('work');
    setRemainingTime(WORK_TIME);
    showToast("集中モード開始！離脱するとペナルティです", 3);
  };

  const stopEarly = async () => {
    await removeCoins(PENALTY_COINS);
    setMode('idle');
    setTaskId(null);
    showToast(`🚨 早期離脱ペナルティ: -${PENALTY_COINS}🪙`, 5);
  };

  const completeTaskEarly = async () => {
    const minutesWorked = Math.ceil((WORK_TIME - remainingTime) / 60);
    if (taskId) await onAddWorkTime(taskId, minutesWorked);
    await addCoins(50); // 早く終わらせたご褒美
    setMode('break');
    setRemainingTime(BREAK_TIME);
    showToast(`タスク完了！ (${minutesWorked}分) 10分休憩に入ります`, 1);
  };

  const toggleFreeze = () => {
    if (mode === 'freeze') {
      // 解凍して作業再開
      setMode('work');
      setRemainingTime(savedWorkTime);
      showToast("作業を再開します", 1);
    } else if (mode === 'work') {
      // 凍結開始
      if (freezeCount >= MAX_FREEZE) {
        showToast("本日のご飯(凍結)ボタンは上限(3回)に達しています", 4);
        return;
      }
      setSavedWorkTime(remainingTime);
      setMode('freeze');
      setRemainingTime(FREEZE_TIME);
      const newCount = freezeCount + 1;
      setFreezeCount(newCount);
      localStorage.setItem('freezeCount', newCount.toString());
      showToast(`一時凍結 (${newCount}/${MAX_FREEZE})。40分以内に戻らないとペナルティです`, 2);
    }
  };

  return { mode, taskId, remainingTime, freezeCount, maxFreeze: MAX_FREEZE, startWork, stopEarly, completeTaskEarly, toggleFreeze };
};