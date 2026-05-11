// src/components/views/PomodoroView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play, Square, Coffee, Snowflake, Plus, Trash2, Check, BellRing, RefreshCcw, CheckCircle, Zap, LibraryBig, ExternalLink, Minimize2, BellOff, X, Pencil, ChevronDown, ChevronRight, Repeat, Sparkles, Target } from 'lucide-react'; 
import type { Task, Routine } from '../../types';
import { useTemplates, type Template } from '../../hooks/useTemplates';
import { invoke } from '@tauri-apps/api/core';
import { getTaskIndent } from '../../utils/taskLogic';

interface PomodoroViewProps {
  pomodoro: any;
  tasks: Task[];
  routines: Routine[];
  onToggleDaily: (id: string) => void;
  queue: string[];
  onAddToQueue: (id: string) => void;
  onRemoveFromQueue: (id: string) => void;
  onAddTemplate?: (templateName: string, subTasks: string[]) => void;
  onUpdateWorkTime?: (taskId: string, minutes: number) => void;
  addCoins?: (amount: number) => Promise<void>; // 即席タスク完了用
}

const formatTimeBig = (seconds: number) => {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const m = Math.floor(absSeconds / 60);
  const s = absSeconds % 60;
  const sign = isNegative ? "+" : "";
  return `${sign}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// TODO: 推定諸悪の根源
// ここが悪さをして、小窓モードでも全窓を表示している
// ============================================================================
// TimerPanel コンポーネント (そのまま)
// ============================================================================
const TimerPanel = ({
  isPiP, pipWindow, pomodoro, queue, allTasks, currentTask, targetTodo,
  startNextInQueue, onToggleTask, onRemoveFromQueue
}: any) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMini, setIsMini] = useState(false);

  useEffect(() => {
    const el = panelRef.current;
    if (!el || !isPiP) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setIsMini(entry.contentRect.width <= 320 || entry.contentRect.height <= 220);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isPiP]);

  return (
    <div 
      ref={panelRef}
      className={`w-full h-full flex flex-col items-center justify-center relative transition-colors duration-300 ${
        isPiP ? `bg-slate-900 text-white overflow-hidden ${isMini ? 'p-0 m-0' : 'p-2 sm:p-4'}` 
              : 'p-6 sm:p-10 bg-white/30 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm'
      }`}
    >
      {isPiP && !isMini && (
        <button onClick={() => pipWindow?.close()} className="absolute top-2 right-2 p-1.5 sm:top-4 sm:right-4 sm:p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors shadow-sm z-50 group flex items-center gap-2">
          <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-90 transition-transform" />
        </button>
      )}

      {pomodoro.isConfirming && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300 rounded-2xl p-2 sm:p-4">
          <div className={`bg-white rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full text-center animate-in zoom-in-95 duration-300 border-4 border-orange-400 max-h-full overflow-y-auto ${isPiP ? 'p-4' : 'p-8'}`}>
            <div className={`bg-orange-100 rounded-full animate-bounce ${isPiP ? 'p-2 mb-2' : 'p-4 mb-4'}`}><BellRing className={`${isPiP ? 'w-6 h-6' : 'w-10 h-10'} text-orange-500`} /></div>
            <h3 className={`${isPiP ? 'text-xl' : 'text-2xl'} font-black text-gray-800 mb-1`}>TIME'S UP!</h3>
            <p className="text-gray-500 text-xs sm:text-sm font-medium mb-4">タスクは完了しましたか？</p>
            <div className="flex flex-col gap-2 w-full mt-auto">
              <button onClick={() => { if (currentTask && !currentTask.id.startsWith('adhoc-')) onToggleTask(currentTask.id); if (currentTask) onRemoveFromQueue(currentTask.id); pomodoro.confirmComplete(); }} className="w-full py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg text-sm sm:text-base"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />完全に完了！ (+50🪙)</button>
              <button onClick={pomodoro.confirmExtend} className="w-full py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base"><RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" />まだ（休憩へ）</button>
            </div>
            <button onClick={pomodoro.muteAlarm} className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"><BellOff className="w-3 h-3 sm:w-4 sm:h-4" /> 音だけ止める</button>
          </div>
        </div>
      )}

      {pomodoro.isBreakAlarming && !isMini && (
        <button onClick={pomodoro.muteAlarm} className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white/80 p-2 sm:p-3 rounded-full shadow-md hover:bg-red-50 text-red-500 z-40 transition-all hover:scale-110"><BellOff className="w-4 h-4 sm:w-6 sm:h-6" /></button>
      )}

      {pomodoro.mode === 'idle' ? (
        <div className="text-center flex flex-col items-center w-full justify-center h-full">
          {!isMini && <Coffee className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-2 sm:mb-4" />}
          <h2 className={`${isMini ? 'text-lg' : 'text-xl'} font-bold ${isPiP ? 'text-white' : 'text-gray-600'} mb-1`}>準備完了</h2>
          {!isMini && <p className="text-xs sm:text-sm text-gray-500 mb-4">キューからタスクを選んで集中を開始</p>}
          {queue.length > 0 ? (
            <div className="flex flex-col items-center gap-2 sm:gap-4 w-full px-2 sm:px-4">
              {!isMini && <div className="w-full truncate px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-500/20 text-orange-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-orange-500/30 shadow-inner">次: {allTasks.find((t: Task) => t.id === queue[0])?.text}</div>}
              <button onClick={startNextInQueue} className="w-full max-w-sm py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black text-sm sm:text-lg shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"><Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />{isMini ? '開始' : '集中を開始！'}</button>
            </div>
          ) : <button disabled className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-200 text-gray-400 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 cursor-not-allowed">{isMini ? '空です' : 'キューにタスクがありません'}</button>}
        </div>
      ) : isMini ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
          <div className="text-[10px] font-bold text-orange-400 truncate w-full text-center px-1 mb-1">{currentTask?.text}</div>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[52%] font-mono font-black tabular-nums whitespace-nowrap leading-none transition-colors duration-300 ${pomodoro.mode === 'work' ? 'text-orange-500 drop-shadow-md' : pomodoro.mode === 'break' ? (pomodoro.isBreakAlarming ? 'text-red-500 animate-pulse' : 'text-green-500') : 'text-blue-500'}`} style={{ fontSize: 'min(26vw, 80vh)' }}>{formatTimeBig(pomodoro.remainingTime)}</div>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center justify-center w-full flex-1 gap-4 sm:gap-6">
          {/* 🌟 メイン表示: タスク名をデカデカと表示 */}
          <div className={`w-full p-4 sm:p-6 rounded-3xl shadow-lg border transition-all ${isPiP ? 'bg-white/5 border-white/10' : 'bg-white/60 border-orange-100'} ${pomodoro.isBreakAlarming ? 'border-red-400 bg-red-50' : ''}`}>
            {targetTodo && (
              <div className="mb-2 flex items-center justify-center gap-1.5 opacity-80">
                <Target className="w-3 h-3 text-orange-400" />
                <span className="text-[10px] sm:text-xs font-bold text-orange-400/90 uppercase tracking-[0.2em] truncate max-w-[80%]">Goal: {targetTodo.text}</span>
              </div>
            )}
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 block ${pomodoro.isBreakAlarming ? 'text-red-500' : 'text-orange-500'}`}>{pomodoro.mode === 'work' ? 'Now Focusing' : pomodoro.mode === 'break' ? (pomodoro.remainingTime < 0 ? 'Break Time Over!' : 'Break Time') : 'Freezed'}</span>
            <h2 className={`font-black break-words leading-tight line-clamp-2 ${isPiP ? 'text-white' : 'text-slate-800'}`} style={{ fontSize: isPiP ? 'clamp(1.2rem, 5vw, 2rem)' : '2.5rem' }}>{pomodoro.mode === 'work' && currentTask ? currentTask.text : pomodoro.mode === 'break' && queue.length > 0 ? `Next: ${allTasks.find((t: Task) => t.id === queue[0])?.text}` : pomodoro.mode === 'freeze' ? "凍結中..." : "休憩中..."}</h2>
          </div>
          <div className={`font-mono font-black tabular-nums transition-colors duration-300 w-full flex items-center justify-center tracking-tighter ${pomodoro.mode === 'work' ? 'text-orange-500 drop-shadow-md' : pomodoro.mode === 'break' ? (pomodoro.isBreakAlarming ? 'text-red-500 animate-pulse' : 'text-green-500') : 'text-blue-500'}`} style={{ fontSize: isPiP ? 'clamp(3rem, 15vw, 6rem)' : '6rem' }}>{formatTimeBig(pomodoro.remainingTime)}</div>
          <div className="flex items-center justify-center gap-3 sm:gap-4 w-full flex-wrap">
            {pomodoro.mode === 'work' && currentTask && <button onClick={() => { if (!currentTask.id.startsWith('adhoc-')) onToggleTask(currentTask.id); if (currentTask) onRemoveFromQueue(currentTask.id); pomodoro.completeTaskEarly(); }} className="flex flex-col items-center gap-1 text-gray-500 hover:text-green-600 transition-colors group"><div className="p-2 sm:p-3 bg-white rounded-full shadow-sm group-hover:bg-green-50"><Check className="w-5 h-5 sm:w-6 sm:h-6" /></div><span className="text-[10px] font-bold">完了</span></button>}
            {pomodoro.mode === 'break' && <div className="flex flex-col items-center gap-1 group relative"><button onClick={startNextInQueue} disabled={queue.length === 0} className={`p-2 sm:p-3 rounded-full shadow-sm transition-all ${queue.length > 0 ? (pomodoro.isBreakAlarming ? 'bg-red-500 text-white animate-bounce shadow-red-500/50' : 'bg-white hover:bg-orange-50 text-orange-500') : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}><Play className="w-5 h-5 sm:w-6 sm:h-6" /></button><span className={`text-[10px] font-bold ${pomodoro.isBreakAlarming ? 'text-red-500' : 'text-gray-500'}`}>次を開始</span></div>}
            {(pomodoro.mode === 'work' || pomodoro.mode === 'break' || pomodoro.mode === 'freeze') && <button onClick={pomodoro.toggleFreeze} className={`flex flex-col items-center gap-1 transition-colors group ${pomodoro.mode === 'freeze' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}><div className={`p-2 sm:p-3 rounded-full shadow-sm ${pomodoro.mode === 'freeze' ? 'bg-blue-100' : 'bg-white group-hover:bg-blue-50'}`}>{pomodoro.mode === 'freeze' ? <Play className="w-5 h-5 sm:w-6 sm:h-6" /> : <Snowflake className="w-5 h-5 sm:w-6 sm:h-6" />}</div><span className="text-[10px] font-bold">凍結 ({pomodoro.maxFreeze - pomodoro.freezeCount})</span></button>}
            {(pomodoro.mode === 'work' || pomodoro.mode === 'freeze') && <button onClick={() => { if(window.confirm("🚨 本当に中断しますか？ 100🪙のペナルティが発生します！")) { pomodoro.stopEarly(); } }} className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-500 transition-colors group"><div className="p-2 sm:p-3 bg-white rounded-full shadow-sm group-hover:bg-red-50"><Square className="w-5 h-5 sm:w-6 sm:h-6" /></div><span className="text-[10px] font-bold">中断</span></button>}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// メインの PomodoroView
// ============================================================================
export const PomodoroView: React.FC<PomodoroViewProps> = ({ 
  pomodoro, tasks, routines, queue, onAddToQueue, onRemoveFromQueue, 
  onAddTemplate, onUpdateWorkTime, addCoins
}) => {
  
  const [adhocText, setAdhocText] = useState('');
  const [adhocTasks, setAdhocTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('pomodoroAdhocTasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [targetTodoId, setTargetTodoId] = useState<string | null>(() => localStorage.getItem('pomodoroTargetTodoId'));

  // 小窓モード（URLハッシュが #timer）かどうかの判定
  const isSubWindow = typeof window !== 'undefined' && window.location.hash === '#timer'; //TODO:後でここを参照にリファクタリング

  const [expandedObjectiveIds, setExpandedObjectiveIds] = useState<Set<string>>(new Set());
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  useEffect(() => {
    localStorage.setItem('pomodoroAdhocTasks', JSON.stringify(adhocTasks));
  }, [adhocTasks]);

  useEffect(() => {
    if (targetTodoId) localStorage.setItem('pomodoroTargetTodoId', targetTodoId);
    else localStorage.removeItem('pomodoroTargetTodoId');
  }, [targetTodoId]);

  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplates();
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplTasks, setNewTplTasks] = useState("");

  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [editTplName, setEditTplName] = useState("");
  const [editTplTasks, setEditTplTasks] = useState("");

  // セクション開閉状態
  const [isTasksOpen, setIsTasksOpen] = useState(true);
  const [isRoutinesOpen, setIsRoutinesOpen] = useState(true);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(true);

  const currentTask = adhocTasks.find((t: Task) => t.id === pomodoro.taskId);
  const targetTodo = tasks.find(t => t.id === targetTodoId);

  const toggleObjectiveExpand = (id: string) => {
    setExpandedObjectiveIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isObjectiveVisible = (task: Task) => {
    if (!task.parentId) return true;
    let currentParentId: string | null = task.parentId;
    while (currentParentId) {
      if (!expandedObjectiveIds.has(currentParentId)) return false;
      const parent = tasks.find(t => t.id === currentParentId);
      currentParentId = parent?.parentId || null;
    }
    return true;
  };

  const startNextInQueue = () => {
    if (queue.length > 0) {
      const nextId = queue[0];
      pomodoro.startWork(nextId);
    }
  };

  const handleCompleteTask = async (id: string) => {
    if (id.startsWith('adhoc-')) {
      setAdhocTasks(prev => prev.filter(t => t.id !== id));
      if (addCoins) await addCoins(50);
    } else {
      pomodoro.onToggleTask(id);
    }
  };

  // 小窓モードの場合は、タイマーパネルのみを全画面で表示
  if (isSubWindow) {
    const currentTaskSub = adhocTasks.find((t: Task) => t.id === pomodoro.taskId);
    const targetTodoSub = tasks.find(t => t.id === targetTodoId);

    return (
      <div className="w-screen h-screen bg-slate-900 select-none overflow-hidden border-2 border-orange-500/30 rounded-lg" data-tauri-drag-region>
        <TimerPanel 
          isPiP={true} 
          pomodoro={pomodoro} 
          queue={queue} 
          allTasks={adhocTasks} 
          currentTask={currentTaskSub}
          targetTodo={targetTodoSub}
          startNextInQueue={() => { if (queue.length > 0) pomodoro.startWork(queue[0]); }}
          onToggleTask={handleCompleteTask}
          onRemoveFromQueue={onRemoveFromQueue}
        />
      </div>
    );
  }

  const handleAddAdhoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adhocText.trim()) return;
    const newTask: Task = {
      id: `adhoc-${Date.now()}`, text: `⚡ ${adhocText}`, status: 'todo', 
      parentId: null, order: 0, difficulty: 1
    };
    setAdhocTasks(prev => [...prev, newTask]);
    onAddToQueue(newTask.id);
    setAdhocText('');
  };

  const handleAddRoutineToQueue = (routine: Routine) => {
    const newTask: Task = {
      id: `adhoc-${Date.now()}`,
      text: `🔄 ${routine.text}`,
      status: 'todo',
      parentId: null,
      order: 0,
      difficulty: 1,
      routineId: routine.id
    };
    setAdhocTasks(prev => [...prev, newTask]);
    onAddToQueue(newTask.id);
  };

  const handleAddSingleTemplateTask = (taskName: string) => {
    const newTask: Task = {
      id: `adhoc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: `⚡ ${taskName}`,
      status: 'todo',
      parentId: null,
      order: 0,
      difficulty: 1
    };
    setAdhocTasks(prev => [...prev, newTask]);
    onAddToQueue(newTask.id);
  };

  const startEdit = (tpl: Template) => {
    setEditingTplId(tpl.id);
    setEditTplName(tpl.name);
    setEditTplTasks(tpl.subTasks.join(', '));
  };

  const togglePiP = async () => {
    // Tauri環境（デスクトップ）の場合の処理
    if ((window as any).__TAURI_INTERNALS__) {
      try {
        await invoke('open_sub_window');
        return;
      } catch (error) {
        console.error("Tauri window creation failed:", error);
      }
    }

    if (!('documentPictureInPicture' in window)) {
      alert('お使いのブラウザは小窓化機能に対応していません。\nChrome または Edge の最新版をご利用ください。');
      return;
    }

    if (pipWindow) {
      pipWindow.close();
      return;
    }

    try {
      const win = await (window as any).documentPictureInPicture.requestWindow({ width: 220, height: 120 });
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          win.document.head.appendChild(style);
        } catch (e) {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            win.document.head.appendChild(link);
          }
        }
      });
      win.document.body.className = "m-0 p-0 w-full h-[100vh] overflow-hidden bg-slate-900";
      win.addEventListener('pagehide', async () => {
        if ((window as any).__TAURI__) {
          const { appWindow } = await import('@tauri-apps/api/window' as any);
          await appWindow.setAlwaysOnTop(false);
        }
        setPipWindow(null);
      });
      setPipWindow(win);
    } catch (error) {
      console.error('PiP Error:', error);
      alert('小窓の起動に失敗しました。');
    }
  };

  return (
    <div className="w-full h-full flex max-w-[1600px] mx-auto p-4 sm:p-6 gap-4 sm:gap-6 animate-fadeIn relative overflow-hidden">
      {/* 左側：即席追加 ＆ ルーチン */}
      <div className="w-[25%] h-full min-w-[300px] flex flex-col bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/50 bg-white/50 z-10">
          <div className="flex items-center gap-2 mb-4">
             <Sparkles className="w-5 h-5 text-orange-500" />
             <h2 className="font-black text-gray-700 text-sm tracking-widest uppercase">Quick Start</h2>
          </div>
          <form onSubmit={handleAddAdhoc} className="mb-2 flex gap-2">
            <input type="text" placeholder="＋ 今から何をやる？" value={adhocText} onChange={e => setAdhocText(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-white/70 border-none outline-none focus:ring-2 focus:ring-orange-300 text-xs sm:text-sm text-gray-800 placeholder-gray-400 shadow-sm" />
            <button type="submit" className="bg-blue-500 text-white px-3 rounded-lg text-sm font-bold hover:bg-blue-600 shadow-sm transition-colors"><Zap className="w-4 h-4" /></button>
          </form>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 bg-white/20 pb-10 space-y-4">
          <section>
             <button onClick={() => setIsTasksOpen(!isTasksOpen)} className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black text-orange-400 uppercase tracking-widest hover:text-orange-600 transition-colors">
               <span className="flex items-center gap-1"><Target className="w-3 h-3"/> Objectives</span>
               {isTasksOpen ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
             </button>
             {isTasksOpen && (
               <div className="mt-1 space-y-0.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                 {tasks
                   .filter(t => t.routineType !== 'daily' && t.status !== 'done' && isObjectiveVisible(t))
                   .map(t => {
                     const hasChildren = tasks.some(child => child.parentId === t.id && child.status !== 'done');
                     const isExpanded = expandedObjectiveIds.has(t.id);
                     const indent = getTaskIndent(t.id, tasks);
                     
                     return (
                       <div key={t.id} className="flex items-center group">
                         <div style={{ paddingLeft: `${indent * 12}px` }} className="flex items-center">
                           {hasChildren ? (
                             <button 
                               onClick={(e) => { e.stopPropagation(); toggleObjectiveExpand(t.id); }} 
                               className="p-1 hover:bg-black/5 rounded text-gray-400 transition-colors"
                             >
                               {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                             </button>
                           ) : (
                             <div className="w-5 h-5" />
                           )}
                         </div>
                         <button 
                           onClick={() => setTargetTodoId(targetTodoId === t.id ? null : t.id)} 
                           className={`flex-1 text-left px-2 py-1 rounded-lg text-[11px] transition-all flex items-center gap-2 ${targetTodoId === t.id ? 'bg-orange-500/10 text-orange-600 font-bold' : 'text-gray-500 hover:bg-white/50'}`}
                         >
                            <Check className={`w-3 h-3 flex-shrink-0 ${targetTodoId === t.id ? 'opacity-100' : 'opacity-0'}`}/>
                            <span className="truncate">{t.text}</span>
                         </button>
                       </div>
                     );
                   })
                 }
               </div>
             )}
          </section>

          <section>
             <button onClick={() => setIsRoutinesOpen(!isRoutinesOpen)} className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
               <span className="flex items-center gap-1"><Repeat className="w-3 h-3"/> Rituals</span>
               {isRoutinesOpen ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
             </button>
             {isRoutinesOpen && (
               <div className="mt-1 space-y-1">
                 {routines.filter(r => r.type === 'daily').map(r => (
                   <button key={r.id} onClick={() => handleAddRoutineToQueue(r)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/50 text-xs text-gray-600 text-left group transition-all">
                      <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-500"/>
                      <span className="truncate">{r.text}</span>
                   </button>
                 ))}
               </div>
             )}
          </section>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 sm:gap-6 relative h-full overflow-hidden">
        <div className="flex-[1.8] h-0 min-h-[350px] relative overflow-hidden rounded-3xl shadow-sm border border-white/50">
          {pipWindow ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-3xl">
              <ExternalLink className="w-16 h-16 text-blue-300 mb-4 animate-pulse" />
              {createPortal(<TimerPanel isPiP={true} pipWindow={pipWindow} pomodoro={pomodoro} queue={queue} allTasks={adhocTasks} currentTask={currentTask} targetTodo={targetTodo} startNextInQueue={startNextInQueue} onToggleTask={handleCompleteTask} onRemoveFromQueue={onRemoveFromQueue} />, pipWindow.document.body)}
            </div>
          ) : (
            <TimerPanel isPiP={false} pipWindow={null} pomodoro={pomodoro} queue={queue} allTasks={adhocTasks} currentTask={currentTask} targetTodo={targetTodo} startNextInQueue={startNextInQueue} onToggleTask={handleCompleteTask} onRemoveFromQueue={onRemoveFromQueue} />
          )}
        </div>

        <div className="flex-1 h-0 min-h-[250px] flex gap-4 sm:gap-6">
          <div className={`flex flex-col bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden transition-all duration-300 ${isQueueOpen ? 'w-1/2' : 'w-12'}`}>
            <div className="p-3 sm:p-4 border-b border-white/50 bg-white/50 flex justify-between items-center z-10">
              {isQueueOpen ? (
                <>
                  <h2 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4 text-orange-500" /> Focus Queue
                  </h2>
                  <div className="flex items-center gap-2">
                    {!pipWindow && pomodoro.mode !== 'idle' && (
                      <button onClick={togglePiP} className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg shadow-sm transition-colors" title="常に最前面">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setIsQueueOpen(false)} className="p-1 hover:bg-black/5 rounded"><ChevronDown className="w-4 h-4 rotate-90"/></button>
                  </div>
                </>
              ) : <button onClick={() => setIsQueueOpen(true)} className="mx-auto p-1 hover:bg-black/5 rounded"><ChevronDown className="w-4 h-4 -rotate-90"/></button>}
            </div>
            {isQueueOpen && <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-black/5">
              {queue.map((id, index) => {
                const t = adhocTasks.find((task: Task) => task.id === id); 
                if (!t) return null;
                return (
                  <div key={id} className="flex items-center justify-between p-2.5 bg-white/60 rounded-xl border border-white/50 shadow-sm group hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-xs font-bold text-gray-400 w-3">{index + 1}.</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{t.text}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] sm:text-xs text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded cursor-pointer hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-sm whitespace-nowrap" onClick={() => { if(t.id.startsWith('adhoc-')) return; const newTime = window.prompt("このタスクの総作業時間(分)を入力して上書きします", String(t.totalWorkTime || 0)); if (newTime !== null && !isNaN(Number(newTime)) && onUpdateWorkTime) { onUpdateWorkTime(t.id, Number(newTime)); } }}>⏱️ {t.totalWorkTime || 0}m</span>
                      <button onClick={() => onRemoveFromQueue(id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                    </div>
                  </div>
                );
              })}
              {queue.length === 0 && <p className="text-xs sm:text-sm text-center text-gray-400 py-10">キューは空です</p>}
            </div>}
          </div>

          <div className={`flex flex-col bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden transition-all duration-300 ${isTemplatesOpen ? 'flex-1' : 'w-12'}`}>
            <div className="p-3 sm:p-4 border-b border-white/50 bg-white/50 flex items-center justify-between z-10">
              {isTemplatesOpen ? (
                <>
                  <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <LibraryBig className="w-4 h-4 text-blue-500" /> Blueprints
                  </h2>
                  <button onClick={() => setIsAddingTemplate(!isAddingTemplate)} className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-600 rounded flex items-center gap-1 transition-colors">
                    {isAddingTemplate ? <X className="w-3 h-3"/> : <Plus className="w-3 h-3"/>}
                  </button>
                  <button onClick={() => setIsTemplatesOpen(false)} className="p-1 hover:bg-black/5 rounded ml-1"><ChevronDown className="w-4 h-4 rotate-90"/></button>
                </>
              ) : <button onClick={() => setIsTemplatesOpen(true)} className="mx-auto p-1 hover:bg-black/5 rounded"><ChevronDown className="w-4 h-4 -rotate-90"/></button>}
            </div>
            {isTemplatesOpen && <div className="flex-1 overflow-y-auto p-3 bg-white/20">
              {isAddingTemplate && (
                <div className="mb-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col gap-2 animate-fadeIn shadow-sm">
                  <input 
                    type="text" placeholder="テンプレ名 (例: 🧽 お風呂掃除)" 
                    value={newTplName} onChange={e => setNewTplName(e.target.value)}
                    className="text-xs sm:text-sm px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-blue-300 shadow-sm text-gray-800"
                  />
                  <input 
                    type="text" placeholder="タスク (カンマ区切りで入力)" 
                    value={newTplTasks} onChange={e => setNewTplTasks(e.target.value)}
                    className="text-xs sm:text-sm px-3 py-2 rounded-lg border-none focus:ring-2 focus:ring-blue-300 shadow-sm text-gray-800"
                  />
                  <button 
                    onClick={() => {
                      if (!newTplName.trim() || !newTplTasks.trim()) return;
                      const tasksList = newTplTasks.split(',').map(s => s.trim()).filter(Boolean);
                      addTemplate(newTplName, tasksList);
                      setNewTplName('');
                      setNewTplTasks('');
                      setIsAddingTemplate(false);
                    }}
                    className="bg-blue-500 text-white text-xs sm:text-sm py-1.5 sm:py-2 rounded-lg font-bold hover:bg-blue-600 shadow-sm transition-colors mt-1"
                  >
                    保存する
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {templates.map(tpl => {
                  if (editingTplId === tpl.id) {
                    return (
                      <div key={tpl.id} className="p-3 bg-orange-50 rounded-xl border border-orange-200 flex flex-col gap-2 animate-fadeIn shadow-sm">
                        <input 
                          value={editTplName} onChange={e => setEditTplName(e.target.value)} 
                          className="text-xs px-3 py-2 rounded-lg border-none shadow-sm text-gray-800 focus:ring-2 focus:ring-orange-300" 
                          placeholder="テンプレ名" 
                        />
                        <input 
                          value={editTplTasks} onChange={e => setEditTplTasks(e.target.value)} 
                          className="text-xs px-3 py-2 rounded-lg border-none shadow-sm text-gray-800 focus:ring-2 focus:ring-orange-300" 
                          placeholder="タスク (カンマ区切り)" 
                        />
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => { if (!editTplName.trim()) return; const tasksList = editTplTasks.split(',').map(s => s.trim()).filter(Boolean); updateTemplate(tpl.id, editTplName, tasksList); setEditingTplId(null); }} className="flex-1 bg-orange-500 text-white text-xs py-1.5 rounded-lg font-bold hover:bg-orange-600 shadow-sm">更新</button>
                          <button onClick={() => setEditingTplId(null)} className="flex-1 bg-white text-gray-600 text-xs py-1.5 rounded-lg font-bold hover:bg-gray-100 border border-gray-200 shadow-sm">キャンセル</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={tpl.id} className="group relative flex flex-col p-3 bg-white/60 rounded-xl border border-white/60 shadow-sm hover:border-orange-200 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-1">
                          {tpl.name}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onAddTemplate && onAddTemplate(tpl.name, tpl.subTasks)} className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 font-bold shadow-sm" title="親タスクごとセットとして追加">セット追加</button>
                          <button onClick={() => startEdit(tpl)} className="text-[10px] p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 shadow-sm"><Pencil className="w-3 h-3" /></button>
                          <button onClick={(e) => { e.stopPropagation(); if(window.confirm(`テンプレート「${tpl.name}」を削除しますか？`)) { deleteTemplate(tpl.id); } }} className="text-[10px] p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 shadow-sm"><X className="w-3 h-3" /></button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {tpl.subTasks.map((subTask, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAddSingleTemplateTask(subTask)}
                            className="text-[10px] sm:text-xs px-2 py-1 bg-white border border-gray-200 rounded-md hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 transition-all shadow-sm text-gray-600 flex items-center gap-1"
                            title="このタスクだけをキューに追加"
                          >
                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {subTask}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {templates.length === 0 && (
                  <span className="text-xs sm:text-sm text-gray-400 w-full text-center py-4">テンプレートがありません</span>
                )}
              </div>
            </div>
          }
          </div>
          
        </div>
      </div>

    </div>
  );
};