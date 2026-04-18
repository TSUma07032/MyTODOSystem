// src/components/views/PomodoroView.tsx
import React, { useState, useRef, useEffect, type DragEvent, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Play, Square, Coffee, Snowflake, Plus, Trash2, Check, BellRing, RefreshCcw, CheckCircle, Zap, LibraryBig, ExternalLink, Minimize2, BellOff, X, Pencil, ChevronDown, ChevronRight, ListTodo, GripVertical } from 'lucide-react'; 
import type { Task } from '../../types';
import { useTemplates, type Template } from '../../hooks/useTemplates';

interface PomodoroViewProps {
  pomodoro: any;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  queue: string[];
  onAddToQueue: (id: string) => void;
  onRemoveFromQueue: (id: string) => void;
  onAddTemplate?: (templateName: string, subTasks: string[]) => void;
  onUpdateWorkTime?: (taskId: string, minutes: number) => void;
  onReorderQueue?: (startIndex: number, endIndex: number) => void;
}

const formatTimeBig = (seconds: number) => {
  const isNegative = seconds < 0;
  const absSeconds = Math.abs(seconds);
  const m = Math.floor(absSeconds / 60);
  const s = absSeconds % 60;
  const sign = isNegative ? "+" : "";
  return `${sign}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// ============================================================================
// TimerPanel コンポーネント (そのまま)
// ============================================================================
const TimerPanel = ({
  isPiP, pipWindow, pomodoro, queue, allTasks, currentTask,
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
        isPiP ? `bg-slate-50 overflow-hidden ${isMini ? 'p-0 m-0' : 'p-2 sm:p-4'}` 
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
              <button onClick={() => { 
                if (currentTask && !currentTask.id.startsWith('adhoc-')) onToggleTask(currentTask.id); 
                if (currentTask) onRemoveFromQueue(currentTask.id); 
                pomodoro.confirmComplete(queue.length > 0); 
              }}
              className="w-full py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg text-sm sm:text-base"><CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />完全に完了！ (+50🪙)
              </button>
              <button onClick={pomodoro.confirmExtend} className="w-full py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 text-sm sm:text-base"><RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" />まだ（休憩へ）</button>
            </div>
            <button onClick={pomodoro.muteAlarm} className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"><BellOff className="w-3 h-3 sm:w-4 sm:h-4" /> 音だけ止める</button>
          </div>
        </div>
      )}

      {pomodoro.isBreakAlarming && !isMini && (
        <button onClick={pomodoro.muteAlarm} className="absolute top-4 right-4 sm:top-8 sm:right-8 bg-white/80 p-2 sm:p-3 rounded-full shadow-md hover:bg-red-50 text-red-500 z-40 transition-all hover:scale-110"><BellOff className="w-4 h-4 sm:w-6 sm:h-6" /></button>
      )}

      {pomodoro.mode === 'break' && !pomodoro.isBreakAlarming && (
        <button 
          onClick={pomodoro.muteAlarm} 
          className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-gray-400 transition-all shadow-sm"
          title={pomodoro.isMuted ? "音を出す" : "カチカチ音を消す"}
        >
          {pomodoro.isMuted ? <BellOff className="w-4 h-4 text-red-400" /> : <BellRing className="w-4 h-4" />}
        </button>
      )}

      {pomodoro.mode === 'idle' ? (
        <div className="text-center flex flex-col items-center w-full justify-center h-full">
          {!isMini && <Coffee className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-2 sm:mb-4" />}
          <h2 className={`${isMini ? 'text-lg' : 'text-xl'} font-bold text-gray-600 mb-1`}>準備完了</h2>
          {!isMini && <p className="text-xs sm:text-sm text-gray-500 mb-4">キューからタスクを選んで集中を開始</p>}
          {queue.length > 0 ? (
            <div className="flex flex-col items-center gap-2 sm:gap-4 w-full px-2 sm:px-4">
              {!isMini && <div className="w-full truncate px-3 py-1.5 sm:px-4 sm:py-2 bg-orange-100 text-orange-800 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-orange-200 shadow-inner">次: {allTasks.find((t: Task) => t.id === queue[0])?.text}</div>}
              <button onClick={startNextInQueue} className="w-full max-w-sm py-3 sm:py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black text-sm sm:text-lg shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"><Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />{isMini ? '開始' : '集中を開始！'}</button>
            </div>
          ) : <button disabled className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-200 text-gray-400 rounded-full font-bold text-xs sm:text-sm flex items-center gap-2 cursor-not-allowed">{isMini ? '空です' : 'キューにタスクがありません'}</button>}
        </div>
      ) : isMini ? (
        <div className="relative w-full h-full flex-1 overflow-hidden">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[52%] font-mono font-black tabular-nums whitespace-nowrap leading-none transition-colors duration-300 ${pomodoro.mode === 'work' ? 'text-orange-500 drop-shadow-md' : pomodoro.mode === 'break' ? (pomodoro.isBreakAlarming ? 'text-red-500 animate-pulse' : 'text-green-500') : 'text-blue-500'}`} style={{ fontSize: 'min(26vw, 80vh)' }}>{formatTimeBig(pomodoro.remainingTime)}</div>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center justify-center w-full flex-1 gap-4 sm:gap-6">
          <div className={`w-full p-2 sm:p-4 bg-white/60 rounded-xl sm:rounded-2xl shadow-sm border transition-colors ${pomodoro.isBreakAlarming ? 'border-red-400 bg-red-50' : 'border-orange-100'}`}>
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 block ${pomodoro.isBreakAlarming ? 'text-red-500' : 'text-orange-500'}`}>{pomodoro.mode === 'work' ? 'Now Focusing' : pomodoro.mode === 'break' ? (pomodoro.remainingTime < 0 ? 'Break Time Over!' : 'Break Time') : 'Freezed'}</span>
            <h2 className="font-bold text-gray-800 break-words leading-tight line-clamp-2" style={{ fontSize: isPiP ? 'clamp(1rem, 4vw, 1.5rem)' : '1.5rem' }}>{pomodoro.mode === 'work' && currentTask ? currentTask.text : pomodoro.mode === 'break' && queue.length > 0 ? `Next: ${allTasks.find((t: Task) => t.id === queue[0])?.text}` : pomodoro.mode === 'freeze' ? "凍結中..." : "休憩中..."}</h2>
          </div>
          <div className={`font-mono font-black tabular-nums transition-colors duration-300 w-full flex items-center justify-center tracking-tighter ${pomodoro.mode === 'work' ? 'text-orange-500 drop-shadow-md' : pomodoro.mode === 'break' ? (pomodoro.isBreakAlarming ? 'text-red-500 animate-pulse' : 'text-green-500') : 'text-blue-500'}`} style={{ fontSize: isPiP ? 'clamp(3rem, 15vw, 6rem)' : '6rem' }}>{formatTimeBig(pomodoro.remainingTime)}</div>
          <div className="flex items-center justify-center gap-3 sm:gap-4 w-full flex-wrap">
            {pomodoro.mode === 'work' && currentTask && <button onClick={() => { if (!currentTask.id.startsWith('adhoc-')) onToggleTask(currentTask.id); if (currentTask) onRemoveFromQueue(currentTask.id); pomodoro.completeTaskEarly(queue.length > 0); }} className="flex flex-col items-center gap-1 text-gray-500 hover:text-green-600 transition-colors group"><div className="p-2 sm:p-3 bg-white rounded-full shadow-sm group-hover:bg-green-50"><Check className="w-5 h-5 sm:w-6 sm:h-6" /></div><span className="text-[10px] font-bold">完了</span></button>}
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
// 🛡️ 防波堤 1: 左側のタスク一覧 (React.memo でタイマー更新による再描画をブロック)
// ============================================================================
const TaskSidebar = React.memo(({ 
  tasks, queue, pomodoroTaskId, onAddToQueue, onAddAdhocTask
}: { 
  tasks: Task[], queue: string[], pomodoroTaskId: string | null, onAddToQueue: (id: string) => void, onAddAdhocTask: (t: Task) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [adhocText, setAdhocText] = useState('');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  const baseTasks = useMemo(() => tasks.filter((t: Task) => t.status !== 'done' && t.routineType !== 'daily'), [tasks]);
  const parentTasks = useMemo(() => baseTasks.filter(t => !t.parentId).sort((a,b) => a.order - b.order), [baseTasks]);
  const searchResults = useMemo(() => baseTasks.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase())), [baseTasks, searchQuery]);

  const handleAddAdhoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adhocText.trim()) return;
    const newTask: Task = { id: `adhoc-${Date.now()}`, text: `⚡ ${adhocText}`, status: 'todo', parentId: null, order: 0, difficulty: 1 };
    
    // 🟢 親の関数を使って追加する
    onAddAdhocTask(newTask);
    onAddToQueue(newTask.id);
    setAdhocText('');
  };

  const toggleTaskExpand = useCallback((id: string) => {
    setExpandedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  }, []);

  const isTaskAvailable = useCallback((id: string) => !queue.includes(id) && pomodoroTaskId !== id, [queue, pomodoroTaskId]);

  const renderTask = (task: Task, level = 0) => {
    const children = baseTasks.filter(t => t.parentId === task.id).sort((a,b)=>a.order - b.order);
    const isExpanded = expandedTaskIds.has(task.id);
    const available = isTaskAvailable(task.id);
    
    return (
      <div key={task.id} className="flex flex-col">
        <div className={`flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg hover:bg-white/50 transition-colors group ${level > 0 ? 'ml-3 sm:ml-4 border-l-2 border-orange-200/50 pl-2' : ''}`}>
          {children.length > 0 ? (
            <button onClick={() => toggleTaskExpand(task.id)} className="p-1 hover:bg-white/60 rounded text-gray-500 transition-colors">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4"/> : <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>}
            </button>
          ) : (
            <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 flex-shrink-0" />
          )}
          <span className={`flex-1 text-xs sm:text-sm truncate ${available ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{task.text}</span>
          {available ? (
            <button onClick={() => onAddToQueue(task.id)} className="p-1 sm:p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 shadow-sm flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" title="キューに追加"><Plus className="w-3.5 h-3.5" /></button>
          ) : (
            <div className="p-1 sm:p-1.5 text-gray-400 flex-shrink-0" title="追加済み"><Check className="w-3.5 h-3.5" /></div>
          )}
        </div>
        {isExpanded && children.length > 0 && (
          <div className="flex flex-col mt-0.5 sm:mt-1 gap-0.5 sm:gap-1">
            {children.map(child => renderTask(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderSearchResults = () => {
    if (!searchQuery) {
      if (parentTasks.length === 0) return <p className="text-xs text-center text-gray-400 py-4">タスクがありません</p>;
      return parentTasks.map(t => renderTask(t, 0));
    } else {
      if (searchResults.length === 0) return <p className="text-xs text-center text-gray-400 py-4">見つかりませんでした</p>;
      return searchResults.map(t => {
        const available = isTaskAvailable(t.id);
        return (
          <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/50 transition-colors">
            <div className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 flex flex-col overflow-hidden">
              <span className={`text-sm truncate ${available ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{t.text}</span>
            </div>
            {available ? (
              <button onClick={() => onAddToQueue(t.id)} className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 shadow-sm flex-shrink-0"><Plus className="w-3.5 h-3.5" /></button>
            ) : (
              <div className="p-1.5 text-gray-400 flex-shrink-0"><Check className="w-3.5 h-3.5" /></div>
            )}
          </div>
        )
      });
    }
  };

  return (
    <div className="w-[30%] h-full min-w-[280px] flex flex-col bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-white/50 bg-white/50 z-10">
        <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-3">
          <ListTodo className="w-5 h-5 text-blue-500" />タスク一覧 (TODO)
        </h2>
        <form onSubmit={handleAddAdhoc} className="mb-2 flex gap-2">
          <input type="text" placeholder="＋ 即席タスク (保存不要)..." value={adhocText} onChange={e => setAdhocText(e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg bg-white/70 border-none outline-none focus:ring-2 focus:ring-blue-300 text-xs sm:text-sm text-gray-800 placeholder-gray-400 shadow-sm" />
          <button type="submit" className="bg-blue-500 text-white px-3 rounded-lg text-sm font-bold hover:bg-blue-600 shadow-sm transition-colors"><Zap className="w-4 h-4" /></button>
        </form>
        <input type="text" placeholder="🔍 タスクを検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full px-3 py-1.5 rounded-lg bg-white/70 border-none outline-none focus:ring-2 focus:ring-orange-300 text-xs sm:text-sm text-gray-800 font-medium placeholder-gray-400 shadow-sm" />
      </div>
      <div className="flex-1 overflow-y-auto p-2 bg-white/20 pb-10">
        {renderSearchResults()}
      </div>
    </div>
  );
});

// ============================================================================
// 🛡️ 防波堤 2: 右側のテンプレート一覧 (React.memo で保護)
// ============================================================================
const TemplateSidebar = React.memo(({ 
  onAddTemplate, 
  onAddToQueue, 
  onAddAdhocTask
}: { 
  onAddTemplate?: (name: string, tasks: string[]) => void, 
  onAddToQueue: (id: string) => void, 
  onAddAdhocTask: (t: Task) => void;
}) => {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useTemplates();
  
  // テンプレート操作用のローカルステート
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTplName, setNewTplName] = useState("");
  const [newTplTasks, setNewTplTasks] = useState("");

  const [editingTplId, setEditingTplId] = useState<string | null>(null);
  const [editTplName, setEditTplName] = useState("");
  const [editTplTasks, setEditTplTasks] = useState("");

  // テンプレート内の単一タスクを即席タスクとして追加するハンドラー
  const handleAddSingleTemplateTask = useCallback((taskName: string) => {
    const newTask: Task = {
      id: `adhoc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: `⚡ ${taskName}`,
      status: 'todo',
      parentId: null,
      order: 0,
      difficulty: 1
    };
    onAddAdhocTask(newTask);
    // adhocTasksはサイドバー内部で管理されているため、
    // 本来は共通のステート管理が必要ですが、一旦プロップス経由でキュー追加のみ行います
    onAddToQueue(newTask.id);
  }, [onAddToQueue, onAddAdhocTask]);

  const startEdit = (tpl: Template) => {
    setEditingTplId(tpl.id);
    setEditTplName(tpl.name);
    setEditTplTasks(tpl.subTasks.join(', '));
  };

  return (
    <div className="w-1/2 flex flex-col bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-white/50 bg-white/50 flex items-center justify-between z-10">
        <h2 className="text-sm sm:text-base font-bold text-gray-700 flex items-center gap-2">
          <LibraryBig className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> テンプレート
        </h2>
        <button 
          onClick={() => setIsAddingTemplate(!isAddingTemplate)}
          className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 flex items-center gap-1 transition-colors shadow-sm"
        >
          {isAddingTemplate ? <X className="w-3 h-3"/> : <Plus className="w-3 h-3"/>}
          {isAddingTemplate ? '閉じる' : '新規作成'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 bg-white/20">
        {/* 新規作成フォーム */}
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
            // 編集モード
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

            // 通常モード
            return (
              <div key={tpl.id} className="group relative flex flex-col p-3 bg-white/60 rounded-xl border border-white/60 shadow-sm hover:border-orange-200 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-1">
                    {tpl.name}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onAddTemplate && onAddTemplate(tpl.name, tpl.subTasks)} className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 font-bold shadow-sm" title="セット追加">セット追加</button>
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
    </div>
  );
});

// ============================================================================
// メインの PomodoroView
// ============================================================================
export const PomodoroView: React.FC<PomodoroViewProps> = ({ 
  pomodoro, tasks, onToggleTask, queue, onAddToQueue, onRemoveFromQueue, 
  onAddTemplate, onUpdateWorkTime, onReorderQueue
}) => {

  // 🟢 1. 即席タスクのデータを親で管理する（復活！）
  const [adhocTasks, setAdhocTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('pomodoroAdhocTasks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pomodoroAdhocTasks', JSON.stringify(adhocTasks));
  }, [adhocTasks]);

  // 🟢 2. allTasks を作成（これでエラーが消えます！）
  const allTasks = useMemo(() => [...tasks, ...adhocTasks], [tasks, adhocTasks]);

  // 🟢 3. 子コンポーネントから即席タスクを追加してもらうための関数
  const handleAddAdhocTask = useCallback((newTask: Task) => {
    setAdhocTasks(prev => [...prev, newTask]);
  }, []);

  // 🟢 残すのは PiP と D&D のステートだけ！
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // ❌ ここにあった searchQuery や adhocTasks, isAddingTemplate などの
  // 大量の useState や useEffect, renderTask などの関数は、
  // すべて上の Sidebar コンポーネントに移動したので丸ごと削除してOKです！

  const startNextInQueue = () => {
    if (queue.length > 0) {
      pomodoro.startWork(queue[0]);
    }
  };

  const currentTask = allTasks.find((t: Task) => t.id === pomodoro.taskId);

  // ↓ ここから下の D&D用関数 や togglePiP 関数はそのまま残しておいてください ↓
  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    if (onReorderQueue) onReorderQueue(draggedIndex, index);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const togglePiP = async () => {
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
      win.document.body.className = "m-0 p-0 w-full h-[100vh] overflow-hidden bg-slate-50";
      win.addEventListener('pagehide', () => setPipWindow(null));
      setPipWindow(win);
    } catch (error) {
      console.error('PiP Error:', error);
      alert('小窓の起動に失敗しました。');
    }
  };



  return (
<div className="w-full h-full flex max-w-[1400px] mx-auto p-4 sm:p-6 gap-4 sm:gap-6 animate-fadeIn relative overflow-hidden">
      {/* ★ 防波堤1: TaskSidebar を呼び出すだけ！ */}
      <TaskSidebar 
        tasks={tasks} 
        queue={queue} 
        pomodoroTaskId={pomodoro.taskId} 
        onAddToQueue={onAddToQueue} 
        onAddAdhocTask={handleAddAdhocTask}
      />

      {/* 右側：タイマー、キュー、テンプレート */}
      <div className="flex-1 flex flex-col gap-4 sm:gap-6 relative h-full overflow-hidden">
        
        {/* 右側上部：Timer Panel */}
        <div className="flex-[1.4] h-0 min-h-[300px] relative overflow-hidden rounded-2xl shadow-sm">
          {pipWindow ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white/30 backdrop-blur-md rounded-2xl border border-white/50 border-dashed">
              <ExternalLink className="w-16 h-16 text-blue-300 mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-500 mb-4">最前面の小窓で実行中...</h2>
              <button onClick={() => pipWindow.close()} className="px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full font-bold transition-colors shadow-sm">画面に戻す</button>
              {createPortal(<TimerPanel isPiP={true} pipWindow={pipWindow} pomodoro={pomodoro} queue={queue} allTasks={allTasks} currentTask={currentTask} startNextInQueue={startNextInQueue} onToggleTask={onToggleTask} onRemoveFromQueue={onRemoveFromQueue} />, pipWindow.document.body)}
            </div>
          ) : (
            <TimerPanel isPiP={false} pipWindow={null} pomodoro={pomodoro} queue={queue} allTasks={allTasks} currentTask={currentTask} startNextInQueue={startNextInQueue} onToggleTask={onToggleTask} onRemoveFromQueue={onRemoveFromQueue} />
          )}
        </div>

        {/* 右側下部：左右分割 (Queue & Templates) */}
        <div className="flex-1 h-0 min-h-[250px] flex gap-4 sm:gap-6">
          
          {/* 左半分：Focus Queue */}
          <div className="w-1/2 flex flex-col bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-white/50 bg-white/50 flex justify-between items-center z-10">
              <h2 className="font-bold text-gray-700 flex items-center gap-2 text-sm sm:text-base">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                Focus Queue
              </h2>
              {!pipWindow && pomodoro.mode !== 'idle' && (
                <button onClick={togglePiP} className="flex items-center gap-1 px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 text-[10px] sm:text-xs font-bold rounded-lg transition-colors shadow-sm" title="常に最前面で表示">
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />小窓化
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-black/5">
              {queue.map((id, index) => {
                const t = allTasks.find((task: Task) => task.id === id); 
                if (!t) return null;
                const isDragging = draggedIndex === index;
                return (
                  <div 
                    key={id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)} 
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd} 
                    className={`flex items-center justify-between p-2.5 bg-white/60 rounded-xl border shadow-sm group transition-colors cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 border-dashed border-orange-400 bg-orange-50' : 'border-white/50 hover:border-orange-200'}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {/* ★ ドラッグハンドルを追加 */}
                      <div className="text-gray-300 group-hover:text-gray-500">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-gray-400 w-3">{index + 1}.</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{t.text}</span>
                    </div>
                    {/* ... (右側の時間や削除ボタンはそのまま) ... */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] sm:text-xs text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded cursor-pointer hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-sm whitespace-nowrap" onClick={() => { if(t.id.startsWith('adhoc-')) return; const newTime = window.prompt("このタスクの総作業時間(分)を入力して上書きします", String(t.totalWorkTime || 0)); if (newTime !== null && !isNaN(Number(newTime)) && onUpdateWorkTime) { onUpdateWorkTime(t.id, Number(newTime)); } }}>⏱️ {t.totalWorkTime || 0}m</span>
                      <button onClick={() => onRemoveFromQueue(id)} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                    </div>
                  </div>
                );
              })}
              {queue.length === 0 && <p className="text-xs sm:text-sm text-center text-gray-400 py-10">キューは空です</p>}
            </div>
          </div>

          {/* ★ 防波堤2: TemplateSidebar を呼び出すだけ！ */}
          <TemplateSidebar 
            onAddTemplate={onAddTemplate} 
            onAddToQueue={onAddToQueue} 
            onAddAdhocTask={handleAddAdhocTask}
          />
          
        </div>
      </div>

    </div>
  );
};