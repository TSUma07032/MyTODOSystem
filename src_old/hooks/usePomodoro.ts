// src/hooks/usePomodoro.ts
import { useState, useEffect, useRef } from 'react';
import type { PomodoroMode } from '../types';

const WORK_TIME = 25 * 60;    
const BREAK_TIME = 10 * 60;   
const FREEZE_TIME = 40 * 60;  
const PENALTY_COINS = 100;    
const MAX_FREEZE = 3;         

export const usePomodoro = (
  removeCoins: (amount: number) => Promise<void>,
  addCoins: (amount: number) => Promise<void>,
  onAddWorkTime: (taskId: string, minutes: number) => Promise<void>,
  showToast: (msg: string, difficulty: number) => void
) => {
  const [mode, setMode] = useState<PomodoroMode>('idle');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const [savedWorkTime, setSavedWorkTime] = useState(0); 
  const [savedMode, setSavedMode] = useState<'work' | 'break'>('work');
  const [freezeCount, setFreezeCount] = useState(0);     

  const [isConfirming, setIsConfirming] = useState(false);
  const [isBreakAlarming, setIsBreakAlarming] = useState(false); 
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const playAlarm = () => {
    stopAlarm(); 
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 2;
    lfo.connect(gainNode.gain);
    lfo.start();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();

    audioCtxRef.current = ctx;
    oscillatorRef.current = osc;
  };

  const stopAlarm = () => {
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch(e){}
      oscillatorRef.current.disconnect();
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch(e){}
    }
    oscillatorRef.current = null;
    audioCtxRef.current = null;
  };

  const muteAlarm = () => stopAlarm(); 

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

  // ======================================================================
  // 🌟 バックグラウンド完全対応版のタイマーロジック
  // ======================================================================
  useEffect(() => {
    if (mode === 'idle' || isConfirming) return;

    let lastTickTime = Date.now(); // 最後に計算した時間を記録

    // 🌟 インターバルを500msにしておくことで、タブに戻った瞬間の表示復帰を早くする
    const timer = setInterval(() => {
      const now = Date.now();
      // 前回から何秒経過したかを計算（タブが裏にあるとここが数分＝数百秒になる）
      const deltaSeconds = Math.floor((now - lastTickTime) / 1000);

      if (deltaSeconds > 0) {
        lastTickTime += deltaSeconds * 1000; // 処理した秒数分だけ基準時間を進める

        setRemainingTime((prev) => {
          const nextTime = prev - deltaSeconds;

          if (mode === 'break') {
            // 休憩中はマイナスに突入させる
            // ちょうど0をまたいだ瞬間にアラームを鳴らす
            if (prev > 0 && nextTime <= 0) {
              // 状態更新(setState)の中で副作用を呼ぶのはReactの非推奨パターンのため、
              // setTimeoutで非同期に逃がして安全に実行する
              setTimeout(() => {
                setIsBreakAlarming(true);
                playAlarm();
              }, 0);
            }
            return nextTime; 
          } else {
            // work または freeze の場合は 0 で止まる
            if (nextTime <= 0) {
              clearInterval(timer);
              // これも同様にsetTimeoutで逃がす
              setTimeout(() => handleTimerEnd(), 0);
              return 0;
            }
            return nextTime;
          }
        });
      }
    }, 500);

    return () => clearInterval(timer);
  }, [mode, isConfirming]);

  const handleTimerEnd = async () => {
    if (mode === 'work') {
      setIsConfirming(true);
      playAlarm();
    } else if (mode === 'freeze') {
      setMode('idle');
      setTaskId(null);
      await removeCoins(PENALTY_COINS);
      showToast(`🚨 凍結時間オーバー！ペナルティ -${PENALTY_COINS}🪙`, 5);
    }
  };

  const resetToIdle = () => {
    stopAlarm();
    setIsConfirming(false);
    setIsBreakAlarming(false);
    setMode('idle');
    setTaskId(null);
  };

  const confirmComplete = async () => {
    stopAlarm();
    setIsConfirming(false);
    setMode('break');
    setRemainingTime(BREAK_TIME);
    await addCoins(50);
    if (taskId) await onAddWorkTime(taskId, 25);
    showToast("🎉 25分達成！ 50🪙獲得＆10分休憩に入ります", 1);
  };

  const confirmExtend = async () => {
    stopAlarm();
    setIsConfirming(false);
    setMode('break');
    setRemainingTime(BREAK_TIME);
    if (taskId) await onAddWorkTime(taskId, 25); 
    showToast("💪 ナイスファイト！一旦10分休憩して次に備えましょう", 2);
  };

  const startWork = (id: string) => {
    stopAlarm(); 
    setIsBreakAlarming(false);
    setTaskId(id);
    setMode('work');
    setRemainingTime(WORK_TIME);
    setIsConfirming(false); 
    showToast("集中モード開始！離脱するとペナルティです", 3);
  };

  const stopEarly = async () => {
    await removeCoins(PENALTY_COINS);
    resetToIdle();
    showToast(`🚨 早期離脱ペナルティ: -${PENALTY_COINS}🪙`, 5);
  };

  const completeTaskEarly = async () => {
    const minutesWorked = Math.ceil((WORK_TIME - remainingTime) / 60);
    if (taskId) await onAddWorkTime(taskId, minutesWorked);
    await addCoins(50); 
    setMode('break');
    setRemainingTime(BREAK_TIME);
    showToast(`タスク完了！ (${minutesWorked}分) 10分休憩に入ります`, 1);
  };

  const toggleFreeze = () => {
    if (mode === 'freeze') {
      setMode(savedMode); 
      setRemainingTime(savedWorkTime);
      showToast(savedMode === 'work' ? "作業を再開します" : "休憩を再開します", 1);
    } else if (mode === 'work' || mode === 'break') { 
      if (freezeCount >= MAX_FREEZE) {
        showToast("本日のご飯(凍結)ボタンは上限(3回)に達しています", 4);
        return;
      }
      setSavedMode(mode); 
      setSavedWorkTime(remainingTime);
      setMode('freeze');
      setRemainingTime(FREEZE_TIME);
      const newCount = freezeCount + 1;
      setFreezeCount(newCount);
      localStorage.setItem('freezeCount', newCount.toString());
      showToast(`一時凍結 (${newCount}/${MAX_FREEZE})。40分以内に戻らないとペナルティです`, 2);
    }
  };

  return { 
    mode, taskId, remainingTime, freezeCount, maxFreeze: MAX_FREEZE, 
    startWork, stopEarly, completeTaskEarly, toggleFreeze,
    isConfirming, confirmComplete, confirmExtend, muteAlarm, isBreakAlarming 
  };
};