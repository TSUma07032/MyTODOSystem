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
  const [savedMode, setSavedMode] = useState<'work' | 'break'>('work'); // 🌟 追加：凍結前のモードを記憶
  const [freezeCount, setFreezeCount] = useState(0);     

  const [isConfirming, setIsConfirming] = useState(false);
  const [isBreakAlarming, setIsBreakAlarming] = useState(false); // 🌟 追加：休憩超過アラーム状態
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const playAlarm = () => {
    stopAlarm(); // 🌟 バグ修正：重複して鳴るのを防ぐ
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

  const muteAlarm = () => stopAlarm(); // 🌟 手動停止用

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

  useEffect(() => {
    if (mode === 'idle' || isConfirming) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        // 🌟 変更：休憩中は0になっても止まらず、マイナスに突入させる！
        if (mode === 'break') {
          if (prev === 1) { 
            setIsBreakAlarming(true);
            playAlarm(); // ちょうど0になる瞬間にアラーム
          }
          return prev - 1; 
        } else {
          // work または freeze
          if (prev <= 1) {
            clearInterval(timer);
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        }
      });
    }, 1000);

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
    stopAlarm(); // 🌟 次を開始する時にアラームを止める
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
      setMode(savedMode); // 🌟 work か break の元の状態に戻る！
      setRemainingTime(savedWorkTime);
      showToast(savedMode === 'work' ? "作業を再開します" : "休憩を再開します", 1);
    } else if (mode === 'work' || mode === 'break') { // 🌟 休憩中も凍結可能に！
      if (freezeCount >= MAX_FREEZE) {
        showToast("本日のご飯(凍結)ボタンは上限(3回)に達しています", 4);
        return;
      }
      setSavedMode(mode); // 🌟 元のモードを記録
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
    isConfirming, confirmComplete, confirmExtend, muteAlarm, isBreakAlarming // 🌟 追加エクスポート
  };
};