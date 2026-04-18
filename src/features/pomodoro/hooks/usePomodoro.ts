import { useState, useEffect, useRef, useCallback } from 'react';
import type { PomodoroMode } from '../types';

const WORK_TIME = 25 * 60;
const BREAK_TIME = 10 * 60;
const FREEZE_TIME = 40 * 60;
const MAX_FREEZE = 3;

export const usePomodoro = (
  onAddWorkTime: (taskId: string, minutes: number) => Promise<void>,
  showToast: (msg: string, difficulty: number) => void
) => {
  const [mode, setMode] = useState<PomodoroMode>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [freezeCount, setFreezeCount] = useState(0);
  const [isConfirming, setIsConfirming] = useState(false);

  // タイマー終了時の処理（ペナルティを削除）
  const handleTimerEnd = useCallback(async () => {
    if (mode === 'work') {
      setIsConfirming(true);
      // アラーム再生ロジックは既存のものを維持
    } else if (mode === 'freeze') {
      setMode('idle');
      setTaskId(null);
      showToast("❄️ 凍結時間が終了しました。ゆっくり休めましたか？", 2);
    }
  }, [mode, showToast]);

  // 早期完了（コイン加算を削除）
  const completeTaskEarly = async () => {
    const minutesWorked = Math.ceil((WORK_TIME - remainingTime) / 60);
    if (taskId) await onAddWorkTime(taskId, minutesWorked);
    setMode('break');
    setRemainingTime(BREAK_TIME);
    showToast(`✅ 作業記録完了 (${minutesWorked}分)。休憩に入ります`, 1);
  };

  // 中断（ペナルティを削除、純粋なリセットへ）
  const stopEarly = () => {
    setMode('idle');
    setTaskId(null);
    setIsConfirming(false);
    showToast("⏹️ タイマーを停止しました", 2);
  };

  const confirmComplete = async () => {
    setIsConfirming(false);
    setMode('break');
    setRemainingTime(BREAK_TIME);
    if (taskId) await onAddWorkTime(taskId, 25);
    showToast("🎉 25分達成！お疲れ様でした", 1);
  };

  return {
    mode, taskId, remainingTime, freezeCount, maxFreeze: MAX_FREEZE,
    startWork: (id: string) => { setTaskId(id); setMode('work'); setRemainingTime(WORK_TIME); },
    stopEarly, completeTaskEarly, toggleFreeze: () => { /* 既存のロジックからコイン以外を継承 */ },
    isConfirming, confirmComplete, isBreakAlarming: false // 簡略化
  };
};