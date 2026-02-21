import { useState, useEffect, useMemo } from 'react';
import { parseMarkdown } from './utils/parser';
import { type Task, type Routine, type GamificationData, type DailyProgress} from './types';
import { TaskRow } from './components/TaskRow';
import { useFileSystem } from './hooks/useFileSystem';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns'; 
import { FolderOpen, Sparkles, ArrowRight, Copy, Sun, Moon, CheckCircle, Search, History as HistoryIcon, Coffee, CalendarDays, ChevronLeft, ChevronRight, Plus, X, Repeat, Trash2, ShoppingCart, Coins, Settings2, Edit2, Save } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<'dashboard' | 'daily' | 'sync' | 'history' | 'calendar'>('dashboard');
const [completedDailyIds, setCompletedDailyIds] = useState<string[]>([]);
  const [input, setInput] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [viewingLog, setViewingLog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newTaskText, setNewTaskText] = useState("");

  const { dirHandle, isReady, pickDirectory, verifyPermission, writeFile, readFile, saveDeepFile, readDeepFile, appendToHistoryIndex } = useFileSystem();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isRoutineDrawerOpen, setIsRoutineDrawerOpen] = useState(false);
  const [drawerRoutineType, setDrawerRoutineType] = useState<'daily'|'weekly'>('daily');
  const [drawerRoutineText, setDrawerRoutineText] = useState('');
  const [drawerGenerateOn, setDrawerGenerateOn] = useState('Mon'); 
  const [drawerDeadline, setDrawerDeadline] = useState('none');

  const [gamification, setGamification] = useState<GamificationData>({
    coins: 0,
    shopItems: [
      { id: 'item-1', name: 'ラムネ1個', cost: 50, icon: '🍬' },
      { id: 'item-2', name: 'ゲーム30分', cost: 300, icon: '🎮' },
      { id: 'item-3', name: '罪悪感のない昼寝', cost: 500, icon: '🛌' }
    ]
  });
  const [isShopDrawerOpen, setIsShopDrawerOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, difficulty: number, id: number} | null>(null);

  const [isShopEditMode, setIsShopEditMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<{name: string, cost: number, icon: string}>({name: '', cost: 100, icon: '🎁'});
  const [newItemData, setNewItemData] = useState<{name: string, cost: number, icon: string}>({name: '', cost: 100, icon: '🎁'});

  // App.tsx の useEffect (loadDataの近く) に追加
useEffect(() => {
  const loadDailyStatus = async () => {
    // フォルダの準備ができていない場合はスキップ
    if (!isReady) return;

    try {
      const content = await readFile('daily_progress.json'); //
      if (content) {
        const progress: DailyProgress = JSON.parse(content);
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        // 保存された日付が今日なら状態を復元、そうでなければリセット
        if (progress.date === todayStr) {
          setCompletedDailyIds(progress.completedRoutineIds);
        } else {
          setCompletedDailyIds([]);
          // 古いデータは消しておく（任意）
          await writeFile('daily_progress.json', JSON.stringify({ date: todayStr, completedRoutineIds: [] }, null, 2));
        }
      }
    } catch (err) {
      console.log("Daily progress file not found, starting fresh.");
    }
  };

  loadDailyStatus();
}, [isReady]); //

  const showToast = (message: string, difficulty: number) => {
    setToast({ message, difficulty, id: Date.now() });
    setTimeout(() => setToast(null), 3000); 
  };

  const isRoutineActiveToday = (routine: Routine) => {
    if (routine.type === 'daily') return true;
    if (!routine.generateOn) return false;
    const daysMap: Record<string, number> = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
    const gen = daysMap[routine.generateOn];
    const today = new Date().getDay() || 7;
    const dueStr = routine.deadlineRule;
    const due = (dueStr === 'none' || dueStr === 'today') ? null : daysMap[dueStr];
    if (!due) return today >= gen;
    if (gen <= due) return today >= gen && today <= due;
    return today >= gen || today <= due;
  };

  useEffect(() => {
    const result = parseMarkdown(input);
    setTasks(result.tasks);
  }, [input]);

  useEffect(() => {
    const loadData = async () => {
      if ((mode === 'dashboard' || mode === 'calendar') && isReady) {
        let content = await readFile('current_active_todo.md') || "## Today\n- [ ] まだタスクがないよ！\n- [ ] 夜モードで同期して生成しよう";
        
        let gameJson = await readFile('gamification.json');
        if (gameJson) setGamification(JSON.parse(gameJson));

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayDowStr = format(new Date(), 'E'); 
        const lastDate = localStorage.getItem('lastRoutineDate');
        
        let rJson = await readFile('routines.json');
        let currentRoutines: Routine[] = rJson ? JSON.parse(rJson) : [];
        setRoutines(currentRoutines);

        if (lastDate !== todayStr && currentRoutines.length > 0) {
          const tasksToInject = currentRoutines.filter(r => r.type === 'daily' || (r.type === 'weekly' && r.generateOn === todayDowStr));
          if (tasksToInject.length > 0) {
            let textToAppend = "\n## Routines\n";
            tasksToInject.forEach(r => {
              let tag = "";
              if (r.deadlineRule === 'today') { tag = ` (@${format(new Date(), 'M/d')})`; } 
              else if (r.deadlineRule !== 'none') {
                 const daysMap: Record<string, number> = { 'Sun':0, 'Mon':1, 'Tue':2, 'Wed':3, 'Thu':4, 'Fri':5, 'Sat':6 };
                 let diff = daysMap[r.deadlineRule] - new Date().getDay();
                 if (diff < 0) diff += 7; 
                 const targetDate = addDays(new Date(), diff);
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

  const saveGamificationData = async (newData: GamificationData) => {
    setGamification(newData);
    await writeFile('gamification.json', JSON.stringify(newData, null, 2));
  };

  // ★ 追加: ショップアイテム管理ロジック
const handleAddShopItem = async () => {
  if (!newItemData.name.trim()) return;
  const newItem = {
    id: `item-${Date.now()}`,
    name: newItemData.name.trim(),
    cost: Math.max(1, newItemData.cost), // コストは1以上
    icon: newItemData.icon || '🎁'
  };
  await saveGamificationData({
    ...gamification,
    shopItems: [...gamification.shopItems, newItem]
  });
  setNewItemData({name: '', cost: 100, icon: '🎁'}); // フォームリセット
};

const handleDeleteShopItem = async (id: string) => {
  if (!window.confirm("このアイテムを削除してもよろしいですか？")) return;
  await saveGamificationData({
    ...gamification,
    shopItems: gamification.shopItems.filter(item => item.id !== id)
  });
};

const handleUpdateShopItem = async (id: string) => {
  if (!editItemData.name.trim()) return;
  await saveGamificationData({
    ...gamification,
    shopItems: gamification.shopItems.map(item => 
      item.id === id ? { ...item, ...editItemData } : item
    )
  });
  setEditingItemId(null); // 編集モード終了
};

const startEditing = (item: any) => {
  setEditingItemId(item.id);
  setEditItemData({ name: item.name, cost: item.cost, icon: item.icon });
};

  const calculateCoins = (t: Task) => {
    let multiplier = 20;
    if (t.routineType === 'daily') multiplier = 5;
    if (t.routineType === 'weekly') multiplier = 10;
    return t.difficulty * multiplier;
  };

  const handleSyncAndSave = async () => {
    if (!dirHandle) { await pickDirectory(); return; }
    if (!isReady && !(await verifyPermission())) return;
    const now = new Date();
    const year = format(now, 'yyyy');
    const month = format(now, 'MM');
    const timestamp = format(now, 'yyyy-MM-dd_HH-mm-ss');
    const filename = `${timestamp}.md`;
    const doneTasks = tasks.filter(t => t.status === 'done');
    await appendToHistoryIndex(doneTasks, filename, [year, month]);
    await saveDeepFile([year, month], filename, input);
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const nextInput = tasks.filter(t => t.status !== 'done' && t.routineType !== 'daily').map(t => t.originalRaw).join('\n');
    setInput(nextInput);
    await writeFile(`current_active_todo.md`, nextInput);
    setIsSyncing(false);
  };

  const saveRoutineJSON = async (newRoutine: Omit<Routine, 'id'>) => {
    const routine: Routine = { ...newRoutine, id: `r-${Date.now()}` };
    const newRoutines = [...routines, routine];
    setRoutines(newRoutines);
    await writeFile('routines.json', JSON.stringify(newRoutines, null, 2));

    if (isRoutineActiveToday(routine)) {
       let activeContent = await readFile('current_active_todo.md') || "";
       let tag = "";
       if (routine.deadlineRule === 'today') { tag = ` (@${format(new Date(), 'M/d')})`; } 
       else if (routine.deadlineRule !== 'none') {
           const jsDaysMap: Record<string, number> = { 'Sun':0, 'Mon':1, 'Tue':2, 'Wed':3, 'Thu':4, 'Fri':5, 'Sat':6 };
           let diff = jsDaysMap[routine.deadlineRule] - new Date().getDay();
           if (diff < 0) diff += 7; 
           const targetDate = addDays(new Date(), diff);
           tag = ` (@${targetDate.getMonth()+1}/${targetDate.getDate()})`;
       }
       const newLine = `- [ ] ${routine.text} (${routine.type}:${routine.id})${tag} `;
       activeContent += (activeContent.endsWith('\n') ? '' : '\n') + newLine;
       setInput(activeContent);
       await writeFile('current_active_todo.md', activeContent);
    }
  };

  const toggleTaskStatus = async (taskId: string) => { 
    const targetTask = tasks.find(t => t.id === taskId); 
    if (!targetTask) return; 
    const lines = input.split('\n'); 
    const idx = targetTask.lineNumber - 1; 
    const targetIndent = targetTask.indent; 
    const taskIndicesToToggle = [idx]; 
    
    for (let i = idx + 1; i < lines.length; i++) { 
      const match = lines[i].match(/^(\s*)-\s\[/); 
      if (match && Math.floor(match[1].length / 2) > targetIndent) taskIndicesToToggle.push(i); 
      else if (!match) break; 
      else break; 
    } 
    const isCurrentlyTodo = targetTask.status === 'todo'; 

    let earnedCoins = 0;
    let maxDifficulty = 0;

    taskIndicesToToggle.forEach(i => { 
      const t = tasks.find(tsk => tsk.lineNumber === i + 1);
      if (t) {
        earnedCoins += calculateCoins(t);
        if (t.difficulty > maxDifficulty) maxDifficulty = t.difficulty;
      }
      if (lines[i]) { 
        lines[i] = isCurrentlyTodo ? lines[i].replace(/- \[[ \] ]\]/g, '- [x]') : lines[i].replace(/- \[[xX]\]/g, '- [ ]'); 
      } 
    }); 

    if (isCurrentlyTodo) {
      await saveGamificationData({ ...gamification, coins: gamification.coins + earnedCoins });
      showToast(`+${earnedCoins} 🪙`, maxDifficulty);
    } else {
      await saveGamificationData({ ...gamification, coins: Math.max(0, gamification.coins - earnedCoins) });
      showToast(`-${earnedCoins} 🪙`, 1);
    }

    const newContent = lines.join('\n'); 
    setInput(newContent); 
    await writeFile('current_active_todo.md', newContent); 
  };

  /**
 * デイリー完了トグル関数
 * 1. 完了状態の反転
 * 2. ゲーミフィケーション（コイン）との連動
 * 3. daily_progress.json への永続化
 */
const handleToggleDaily = async (routineId: string) => {
  const routine = routines.find(r => r.id === routineId);
  if (!routine) return;

  const isNowCompleted = !completedDailyIds.includes(routineId);
  const newCompletedIds = isNowCompleted
    ? [...completedDailyIds, routineId]
    : completedDailyIds.filter(id => id !== routineId);

  // 1. 完了状態の更新
  setCompletedDailyIds(newCompletedIds);

  // 2. コイン計算 (ルーチンは一律難易度1、倍率5として計算)
  const coinDiff = 1 * 5; 
  if (isNowCompleted) {
    await saveGamificationData({ ...gamification, coins: gamification.coins + coinDiff });
    showToast(`習慣達成! +${coinDiff} 🪙`, 1);
  } else {
    await saveGamificationData({ ...gamification, coins: Math.max(0, gamification.coins - coinDiff) });
    showToast(`-${coinDiff} 🪙`, 1);
  }

  // 3. ファイルへの永続化 (日付とセットで保存)
  const progress: DailyProgress = {
    date: format(new Date(), 'yyyy-MM-dd'),
    completedRoutineIds: newCompletedIds
  };
  await writeFile('daily_progress.json', JSON.stringify(progress, null, 2));
};

  const changeDifficulty = async (taskId: string, currentDiff: number) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;
    const nextDiff = currentDiff >= 5 ? 1 : currentDiff + 1;
    const lines = input.split('\n');
    const idx = targetTask.lineNumber - 1;
    
    if (lines[idx] !== undefined) {
      let line = lines[idx];
      
      // ① どこにあろうと、既存の (★X) を一度きれいに消し去る
      // \s* をつけることで、行頭の (★3) を消した後の余分なスペースも一緒に消えます
      line = line.replace(/\(★\d+\)\s*/g, '');
      line = line.trimEnd(); // 末尾のゴミスペースも掃除
      
      // ② ルーチンの隠しタグがあるかチェック
      const routineMatch = line.match(/\((daily|weekly):[-\w]+\)/);
      
      if (routineMatch) {
          // [0] にマッチした文字列全体（例: "(daily:r-123)"）が入るので、それを使って置換・結合します
          line = line.replace(routineMatch[0], '').trimEnd();
          line = `${line} (★${nextDiff}) ${routineMatch[0]}`;
      } else {
          // 何もない通常のタスクなら、単純に一番最後に追加
          line = `${line} (★${nextDiff})`;
      }
      
      lines[idx] = line;
      const newContent = lines.join('\n');
      setInput(newContent);
      await writeFile('current_active_todo.md', newContent);
    }
  };

  const deleteRoutineJSON = async (id: string) => { const newRoutines = routines.filter(r => r.id !== id); setRoutines(newRoutines); await writeFile('routines.json', JSON.stringify(newRoutines, null, 2)); };
  const handleAddRoutineFromDrawer = async () => { if (drawerRoutineText.trim()) { await saveRoutineJSON({ text: drawerRoutineText.trim(), type: drawerRoutineType, generateOn: drawerRoutineType === 'weekly' ? (drawerGenerateOn as any) : undefined, deadlineRule: drawerRoutineType === 'daily' ? 'none' : (drawerDeadline as any) }); setDrawerRoutineText(''); } };
  const handleCopy = async () => { await navigator.clipboard.writeText(input); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  
  useEffect(() => { const loadHistory = async () => { if (mode === 'history' && isReady) { const content = await readFile('history_index.json'); if (content) setHistoryItems(JSON.parse(content)); } }; loadHistory(); }, [mode, isReady]);
  
  const handleHistoryClick = async (item: any) => { const content = await readDeepFile(item.sourcePath, item.sourceFile); setViewingLog(content); };
  const groupedHistory = useMemo(() => { const groups: Record<string, any[]> = {}; historyItems.forEach(item => { if (searchQuery && !item.text.toLowerCase().includes(searchQuery.toLowerCase())) return; if (!groups[item.text]) groups[item.text] = []; groups[item.text].push(item); }); return groups; }, [historyItems, searchQuery]);
  const updateDeadline = async (taskId: string, newDate: string) => { const targetTask = tasks.find(t => t.id === taskId); if (!targetTask) return; const [_, m, d] = newDate.split('-'); const deadlineTag = `(@${Number(m)}/${Number(d)})`; const lines = input.split('\n'); const targetLineIndex = targetTask.lineNumber - 1; if (lines[targetLineIndex]) { let line = lines[targetLineIndex]; line = line.match(/\(@\d{1,2}\/\d{1,2}\)/) ? line.replace(/\(@\d{1,2}\/\d{1,2}\)/, deadlineTag) : `${line.trimEnd()} ${deadlineTag}`; lines[targetLineIndex] = line; const newContent = lines.join('\n'); setInput(newContent); await writeFile('current_active_todo.md', newContent); } };
  const updateTaskText = async (taskId: string, newText: string) => { const targetTask = tasks.find(t => t.id === taskId); if (!targetTask) return; const lines = input.split('\n'); const idx = targetTask.lineNumber - 1; if (lines[idx]) { lines[idx] = lines[idx].replace(targetTask.text, newText); const newContent = lines.join('\n'); setInput(newContent); await writeFile('current_active_todo.md', newContent); } };
  const deleteTask = async (taskId: string) => { const targetTask = tasks.find(t => t.id === taskId); if (!targetTask) return; const lines = input.split('\n'); let removeCount = 1; for (let i = targetTask.lineNumber; i < lines.length; i++) { const match = lines[i].match(/^(\s*)-\s\[/); if (match && Math.floor(match[1].length / 2) > targetTask.indent) removeCount++; else break; } lines.splice(targetTask.lineNumber - 1, removeCount); const newContent = lines.join('\n'); setInput(newContent); await writeFile('current_active_todo.md', newContent); };
  const moveTask = async (dragTaskId: string, dropTaskId: string) => { if (dragTaskId === dropTaskId) return; const dragTask = tasks.find(t => t.id === dragTaskId); const dropTask = tasks.find(t => t.id === dropTaskId); if (!dragTask || !dropTask) return; const lines = input.split('\n'); const dragIdx = dragTask.lineNumber - 1; let moveLines = [lines[dragIdx]]; let removeCount = 1; for (let i = dragIdx + 1; i < lines.length; i++) { const match = lines[i].match(/^(\s*)-\s\[/); if (match && Math.floor(match[1].length / 2) > dragTask.indent) { moveLines.push(lines[i]); removeCount++; } else break; } const dropIdxOrig = dropTask.lineNumber - 1; if (dropIdxOrig >= dragIdx && dropIdxOrig < dragIdx + removeCount) return; lines.splice(dragIdx, removeCount); let newDropIdx = dropIdxOrig; if (dragIdx < dropIdxOrig) newDropIdx -= removeCount; const baseIndentDiff = dropTask.indent - dragTask.indent; const adjustedLines = moveLines.map(line => { const match = line.match(/^(\s*)/); const newSpacesCount = Math.max(0, (match ? match[1].length : 0) + baseIndentDiff * 2); return " ".repeat(newSpacesCount) + line.trimStart(); }); lines.splice(newDropIdx, 0, ...adjustedLines); const newContent = lines.join('\n'); setInput(newContent); await writeFile('current_active_todo.md', newContent); };
  const addSubTask = async (parentId: string, text: string) => { const parentTask = tasks.find(t => t.id === parentId); if (!parentTask || !text.trim()) return; const lines = input.split('\n'); const parentIndex = parentTask.lineNumber - 1; if (lines[parentIndex] !== undefined) { lines.splice(parentIndex + 1, 0, `${"  ".repeat(parentTask.indent + 1)}- [ ] ${text}`); const newContent = lines.join('\n'); setInput(newContent); await writeFile('current_active_todo.md', newContent); } };

  const addNewTask = async () => {
    if (!newTaskText.trim()) return;
    const newContent = input + (input.endsWith('\n') ? '' : '\n') + `- [ ] ${newTaskText}`;
    setInput(newContent);
    setNewTaskText("");
    await writeFile('current_active_todo.md', newContent);
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });
    return days.map(day => {
        const dateStr = `${day.getMonth() + 1}/${day.getDate()}`;
        const rootTasks = tasks.filter(t => t.deadline === dateStr && t.status !== 'done');
        let displayTasks: Task[] = [];
        rootTasks.forEach(root => {
            displayTasks.push(root);
            const rootIndex = tasks.findIndex(t => t.id === root.id);
            if (rootIndex === -1) return;
            for (let i = rootIndex + 1; i < tasks.length; i++) {
                if (tasks[i].indent <= root.indent) break;
                if (tasks[i].status !== 'done') displayTasks.push(tasks[i]);
            }
        });
        return { date: day, tasks: Array.from(new Map(displayTasks.map(t => [t.id, t])).values()), isCurrentMonth: day.getMonth() === currentDate.getMonth() };
    });
  }, [currentDate, tasks]);

  const themeConfig = useMemo(() => {
    switch(mode) {
      case 'dashboard': return { bg: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50", accent: "orange", icon: Sun };
      case 'sync': return { bg: "bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950 text-white", accent: "purple", icon: Moon };
      case 'history': return { bg: "bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50", accent: "blue", icon: HistoryIcon };
      case 'calendar': return { bg: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50", accent: "emerald", icon: CalendarDays };
      case 'daily': return { bg: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50", accent: "orange", icon: Sun };
      default: return { bg: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50", accent: "orange", icon: Sun };
    }
  }, [mode]);
  const CurrentIcon = themeConfig.icon;

  return (
  <div className={`h-screen flex flex-col font-sans transition-all duration-700 animate-gradient-flow ${themeConfig.bg}`}>
    
    {/* 1. グローバル通知 (Toast) */}
    {toast && (
      <div key={toast.id} className={`fixed top-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-full font-black text-white shadow-2xl transition-all pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300
        ${toast.difficulty >= 5 ? 'bg-gradient-to-r from-red-500 to-pink-600 scale-125 rotate-2' : 
          toast.difficulty >= 3 ? 'bg-gradient-to-r from-amber-400 to-orange-500 scale-110' : 
          'bg-emerald-500'}
      `}>
        {toast.difficulty >= 5 ? `💥 CRITICAL! ${toast.message}` : 
         toast.difficulty >= 3 ? `✨ ${toast.message}` : toast.message}
      </div>
    )}

    {/* 2. メインヘッダー */}
    <header className={`px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-700 ${mode === 'sync' ? "bg-black/20 border-white/10" : "bg-white/60 border-white/40"}`}>
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-xl shadow-sm transition-all duration-500 active:scale-90 ${mode === 'sync' ? 'bg-white/10 text-white' : `bg-${themeConfig.accent}-100 text-${themeConfig.accent}-500`}`}>
          <CurrentIcon className="w-6 h-6" />
        </div>
        <h1 className={`text-xl font-black tracking-tight transition-colors duration-700 ${mode === 'sync' ? "text-white" : "text-slate-800"}`}>
          My Ultimate TODO
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {/* コイン・ルーチン設定・フォルダ接続ボタン */}
        <button onClick={() => setIsShopDrawerOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black shadow-sm transition-all active:scale-95 bg-yellow-100 text-yellow-700 border border-yellow-200 hover:bg-yellow-200">
          <Coins className="w-5 h-5 fill-yellow-500 text-yellow-600" />
          {gamification.coins.toLocaleString()}
        </button>
        <button onClick={() => setIsRoutineDrawerOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-sm bg-white text-indigo-500 border border-indigo-100 hover:bg-indigo-50"><Repeat className="w-4 h-4" />Routines</button>
        <button onClick={!dirHandle ? pickDirectory : verifyPermission} className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all ${isReady ? "bg-green-500 text-white" : "bg-white text-red-500 border-2 border-red-200 animate-pulse"}`}>
          <FolderOpen className="w-4 h-4" />{isReady ? "Local Linked" : "Connect Folder"}
        </button>
      </div>
    </header>

    {/* 3. メインコンテンツエリア */}
    <div className="flex-1 flex overflow-hidden relative animate-fadeIn">
      
      {/* 3-A. 履歴モード表示 */}
      {mode === 'history' && (
           <div className="flex w-full h-full bg-white/40 backdrop-blur-xl animate-fadeIn">
             <div className="w-1/3 border-r border-white/30 p-4 flex flex-col gap-4 bg-white/20">
               <div className="relative group z-10">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input type="text" placeholder="Search memories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-blue-300 outline-none transition-all shadow-sm text-sm text-slate-800" />
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-purple-200">
                {Object.entries(groupedHistory).map(([taskText, logs]) => (
                  <div key={taskText} onClick={() => handleHistoryClick(logs[0])} className="group p-4 bg-white/60 hover:bg-white/90 rounded-xl shadow-sm border border-transparent hover:border-blue-200 cursor-pointer transition-all">
                    <h3 className="font-bold text-gray-700 group-hover:text-blue-700 text-sm line-clamp-2 leading-relaxed">{taskText}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">{logs[0].completedAt.split('T')[0]}</span>
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded-full">x{logs.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-2/3 p-8 overflow-y-auto bg-white/30 backdrop-blur-md">
              {viewingLog ? (
                <div className="prose prose-sm max-w-none text-gray-700 animate-fadeIn"><pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-white/70 p-6 rounded-2xl shadow-sm border border-white/50">{viewingLog}</pre></div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 animate-pulse"><HistoryIcon className="w-16 h-16 mb-4 text-blue-200" /><p className="text-lg font-bold">Select a history to recall</p></div>
              )}
            </div>
          </div>
        )}

      {/* 3-B. TODO / DAILY / CALENDAR / SYNC モード共通のラッパー */}
      {(mode === 'dashboard' || mode === 'daily' || mode === 'sync' || mode === 'calendar') && (
        <div className="flex w-full h-full animate-fadeIn">
          
          {/* 左側：生テキストエディタ（Syncモード時のみ表示） */}
          <div className={`w-1/2 flex flex-col border-r transition-all duration-500 ${mode === 'dashboard' || mode === 'daily' || mode === 'calendar' ? 'hidden' : 'flex bg-white/80 backdrop-blur-xl border-white/20'}`}>
            <textarea className="flex-1 w-full p-8 resize-none font-mono text-sm outline-none bg-transparent text-slate-700" value={input} onChange={(e) => setInput(e.target.value)} />
          </div>

          {/* 右側（メイン）：タスクリスト表示エリア */}
          <div className={`flex flex-col transition-all duration-700 ${mode === 'dashboard' || mode === 'daily' ? 'w-full max-w-3xl mx-auto' : 'w-1/2 bg-black/10 backdrop-blur-lg'}`}>
            
            {/* モード切替タブ・アクションボタン */}
            <div className={`p-4 flex justify-between items-center sticky top-0 z-10 backdrop-blur-xl border-b transition-colors duration-700 ${mode === 'sync' ? "bg-black/20 border-white/10 text-white" : "bg-white/60 border-white/40 text-slate-800"}`}>
               <div className="flex bg-black/5 p-1 rounded-full backdrop-blur-sm relative shadow-inner">
                  <button onClick={() => setMode('dashboard')} className={`relative z-10 px-4 py-2 text-xs font-bold rounded-full transition-colors ${mode === 'dashboard' ? 'bg-white shadow text-orange-600' : 'text-gray-500'}`}>Mission</button>
                  <button onClick={() => setMode('daily')} className={`relative z-10 px-4 py-2 text-xs font-bold rounded-full transition-colors ${mode === 'daily' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>Daily</button>
                  <button onClick={() => setMode('calendar')} className={`relative z-10 px-4 py-2 text-xs font-bold rounded-full transition-colors ${mode === 'calendar' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>Calendar</button>
                  <button onClick={() => setMode('sync')} className={`relative z-10 px-4 py-2 text-xs font-bold rounded-full transition-colors ${mode === 'sync' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>Night Sync</button>
               </div>
               {/* 実行ボタン：モードに応じて「コピー」か「一日終了」か */}
               {mode === 'sync' ? (
                  <button onClick={handleSyncAndSave} disabled={isSyncing} className="flex items-center gap-3 px-8 py-3 rounded-full shadow-lg font-bold text-white bg-gradient-to-r from-slate-800 to-purple-800 transition-all active:scale-95">
                    {isSyncing ? <Sparkles className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />} Finish Day
                  </button>
               ) : (
                  <button onClick={handleCopy} className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg font-bold text-white transition-all active:scale-95 ${copied ? "bg-green-500" : "bg-gradient-to-r from-orange-400 to-pink-500"}`}>
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />} {copied ? "Copied!" : "Copy Mission"}
                  </button>
               )}
            </div>

            {/* 各モードに応じたコンテンツレンダリング */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-2 ${mode === 'sync' && "text-white"}`}>
              
              {/* C-1: カレンダー表示 */}
                  {mode === 'calendar' ? (
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-black text-slate-700">{format(currentDate, 'yyyy MMMM')}</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-black/5 rounded-full"><ChevronLeft className="w-5 h-5 text-slate-600"/></button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200">Today</button>
                            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-black/5 rounded-full"><ChevronRight className="w-5 h-5 text-slate-600"/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (<div key={day} className="text-center font-bold text-slate-400 text-[10px] uppercase">{day}</div>))}
                    </div>
                    <div className="flex-1 grid grid-cols-7 gap-2 auto-rows-fr overflow-y-auto"> 
                        {calendarDays.map((dayItem, idx) => (
                            <div key={idx} onClick={() => setSelectedDay(dayItem.date)} className={`flex flex-col p-2 rounded-lg border transition-all ${dayItem.isCurrentMonth ? 'bg-white/60 border-white/50' : 'bg-gray-50/30 border-transparent opacity-50'} ${isToday(dayItem.date) ? 'ring-2 ring-emerald-400' : ''} min-h-[100px]`}> 
                                <div className={`text-xs font-bold mb-1 ${isToday(dayItem.date) ? 'text-emerald-600' : 'text-slate-500'}`}>{dayItem.date.getDate()}</div>
                                <div className="space-y-1 overflow-y-auto scrollbar-none flex-1">
                                    {dayItem.tasks.map(task => (
                                        <div key={task.id} className={`text-[10px] px-1 rounded truncate font-medium shadow-sm transition-all hover:opacity-80 ${task.deadline ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"}`} style={{ marginLeft: `${task.indent * 6}px`, borderLeftWidth: task.indent > 0 ? '2px' : '1px' }} title={task.text}>
                                            {task.indent > 0 && <span className="opacity-50 mr-1">└</span>}{task.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedDay && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-fadeIn p-4" onClick={() => setSelectedDay(null)}>
                            <div className="bg-white w-full max-w-lg max-h-[80%] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50">
                                    <div>
                                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{format(selectedDay, 'yyyy MMMM')}</p>
                                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">{format(selectedDay, 'd')}<span className="text-lg font-medium text-slate-400">({format(selectedDay, 'EEEE')})</span></h3>
                                    </div>
                                    <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-white">
                                    {(() => {
                                        const dayTasks = calendarDays.find(d => d.date.getTime() === selectedDay.getTime())?.tasks || [];
                                        if (dayTasks.length === 0) return <div className="flex flex-col items-center justify-center h-40 text-slate-400 opacity-60"><Coffee className="w-10 h-10 mb-2" /><p>No tasks planned for this day.</p></div>;
                                        return dayTasks.map(task => (
                                            <div key={task.id} className={`group relative p-3 rounded-xl border transition-all hover:shadow-sm ${task.deadline ? "bg-emerald-50 border-emerald-100" : "bg-white border-gray-100"}`} style={{ marginLeft: `${task.indent * 20}px` }}>
                                                {task.indent > 0 && <div className="absolute -left-3 top-0 bottom-0 border-l-2 border-gray-100 group-hover:border-emerald-200" />}
                                                {task.indent > 0 && <div className="absolute -left-3 top-1/2 w-2 border-t-2 border-gray-100 group-hover:border-emerald-200" />}
                                                <div className="flex items-start gap-3">
                                                    <button onClick={() => toggleTaskStatus(task.id)} className={`mt-1 flex-shrink-0 transition-colors ${task.status === 'done' ? "text-emerald-500" : "text-slate-300 hover:text-emerald-400"}`}>
                                                        {task.status === 'done' ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                                                    </button>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-medium leading-relaxed ${task.status === 'done' ? "line-through text-slate-400" : "text-slate-700"}`}>{task.text}</p>
                                                        <div className="flex gap-2 mt-2">
                                                            {task.deadline && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Due Today</span>}
                                                            {task.estimate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">{task.estimate}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>
                                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-slate-400">Press ESC or click outside to close</div>
                            </div>
                        </div>
                    )}
                </div>
              ) : mode === 'daily' ? (
                  /* --- デイリー完了✅機能の実装箇所 --- */
                  <div className="space-y-4 animate-fadeIn">
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-6">
                      <h2 className="text-lg font-black text-indigo-700 flex items-center gap-2"><Repeat className="w-5 h-5" /> Daily Rituals</h2>
                      <p className="text-xs text-indigo-400 font-bold">毎日リセットされる、あなたの「核」となる習慣</p>
                    </div>
                    {routines.filter(r => r.type === 'daily').map(r => (
                      <div key={r.id} className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleToggleDaily(r.id)} className={`transition-all ${completedDailyIds.includes(r.id) ? "text-green-500" : "text-slate-300 hover:text-indigo-400"}`}>
                            {completedDailyIds.includes(r.id) ? <CheckCircle className="w-6 h-6" /> : <div className="w-6 h-6 rounded-full border-2 border-current" />}
                          </button>
                          <span className={`font-bold text-sm ${completedDailyIds.includes(r.id) ? "line-through text-slate-400" : "text-slate-700"}`}>{r.text}</span>
                        </div>
                      </div>
                    ))}
                  </div>
              ) : (
                  /* C-3: 通常のミッション表示 (Dashboard / Sync) */
                  <>
                    {tasks
                      .filter(t => t.routineType !== 'daily') // デイリーは専用タブに逃がしたのでここでは除外
                      .map((task) => (
                      <TaskRow 
                        key={task.id} task={task} isSyncing={isSyncing} onUpdateDeadline={updateDeadline}
                        isNightMode={mode === 'sync'} onToggle={toggleTaskStatus} onAddSubTask={addSubTask}
                        onUpdateText={updateTaskText} onDeleteTask={deleteTask} onMoveTask={moveTask}
                        onPromoteToRoutine={(text) => saveRoutineJSON({ text, type: 'daily', deadlineRule: 'none' })}
                        onChangeDifficulty={changeDifficulty} 
                      />
                    ))}
                    {mode === 'dashboard' && (
                      <div className="mt-6 flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-dashed border-gray-300">
                        <Plus className="w-5 h-5 text-gray-400" />
                        <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addNewTask()} placeholder="Add a new mission..." className="flex-1 bg-transparent outline-none text-sm" />
                      </div>
                    )}
                  </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

    

    {/* 4. 各種ドロワー (Shop, Routines) */}

      <div className={`fixed inset-y-0 right-0 w-96 bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-yellow-100 transform transition-transform duration-500 z-[100] flex flex-col text-slate-800 ${isShopDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-5 flex justify-between items-center border-b border-yellow-50 bg-yellow-50/80">
          <div className="flex items-center gap-2 text-yellow-700">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="font-bold">Reward Shop</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* ★ 編集モードトグルボタン */}
            <button 
              onClick={() => { setIsShopEditMode(!isShopEditMode); setEditingItemId(null); }} 
              className={`p-2 rounded-full transition-colors ${isShopEditMode ? 'bg-yellow-200 text-yellow-800' : 'hover:bg-yellow-100 text-yellow-600'}`}
              title="Edit Shop Items"
            >
              <Settings2 className="w-5 h-5" />
            </button>
            <button onClick={() => setIsShopDrawerOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-yellow-600"><X className="w-5 h-5" /></button>
          </div>
        </div>
        
        <div className="p-6 text-center border-b border-gray-100 bg-white">
            <p className="text-xs text-gray-500 font-bold mb-1">YOUR COINS</p>
            <div className="text-4xl font-black text-yellow-500 flex items-center justify-center gap-2">
                <Coins className="w-8 h-8 fill-yellow-400" />
                {gamification.coins.toLocaleString()}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {/* ★ 編集モード時の「新規追加フォーム」 */}
            {isShopEditMode && (
              <div className="p-3 bg-white rounded-xl border-2 border-dashed border-yellow-300 shadow-sm flex flex-col gap-2 mb-4 animate-fadeIn">
                <p className="text-xs font-bold text-yellow-600 uppercase">Add New Reward</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Icon (e.g. 🍺)" value={newItemData.icon} onChange={e => setNewItemData({...newItemData, icon: e.target.value})} className="w-12 text-center bg-gray-50 border border-gray-200 rounded-lg text-lg focus:border-yellow-400 outline-none" />
                  <input type="text" placeholder="Reward Name" value={newItemData.name} onChange={e => setNewItemData({...newItemData, name: e.target.value})} className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-yellow-400 outline-none" />
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-bold text-gray-400">Cost:</span>
                  <input type="number" min="1" value={newItemData.cost} onChange={e => setNewItemData({...newItemData, cost: Number(e.target.value)})} className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-yellow-400 outline-none" />
                  <span className="text-xs text-yellow-600 font-bold">🪙</span>
                  <div className="flex-1" />
                  <button onClick={handleAddShopItem} className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xs font-bold rounded-lg transition-colors flex items-center gap-1">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>
            )}

            {gamification.shopItems.map(item => (
                <div key={item.id} className="flex flex-col p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-yellow-200 hover:shadow-md transition-all group">
                    
                    {/* ★ インライン編集モード */}
                    {editingItemId === item.id ? (
                      <div className="flex flex-col gap-2 animate-fadeIn">
                        <div className="flex gap-2">
                          <input type="text" value={editItemData.icon} onChange={e => setEditItemData({...editItemData, icon: e.target.value})} className="w-12 text-center bg-yellow-50 border border-yellow-200 rounded-lg text-lg outline-none" />
                          <input type="text" value={editItemData.name} onChange={e => setEditItemData({...editItemData, name: e.target.value})} className="flex-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-bold outline-none" autoFocus />
                        </div>
                        <div className="flex gap-2 items-center justify-end">
                          <input type="number" min="1" value={editItemData.cost} onChange={e => setEditItemData({...editItemData, cost: Number(e.target.value)})} className="w-20 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-sm outline-none" />
                          <span className="text-xs text-yellow-600 font-bold mr-2">🪙</span>
                          <button onClick={() => setEditingItemId(null)} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                          <button onClick={() => handleUpdateShopItem(item.id)} className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-green-600"><Save className="w-4 h-4"/> Save</button>
                        </div>
                      </div>
                    ) : (
                      // 通常表示
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <span className="text-2xl">{item.icon}</span>
                              <span className="font-bold text-sm text-gray-700">{item.name}</span>
                          </div>
                          
                          {isShopEditMode ? (
                            // 編集モード時のアクション
                            <div className="flex gap-1 opacity-100 transition-opacity">
                              <button onClick={() => startEditing(item)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteShopItem(item.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            // 通常の購入ボタン
                            <button 
                                disabled={gamification.coins < item.cost}
                                onClick={() => {
                                    if (gamification.coins >= item.cost) {
                                        saveGamificationData({ ...gamification, coins: gamification.coins - item.cost });
                                        alert(`🎉 「${item.name}」を購入しました！自分へのご褒美を楽しんで！`);
                                    }
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-sm transition-all ${gamification.coins >= item.cost ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                                {item.cost} 🪙
                            </button>
                          )}
                      </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <div className={`fixed inset-y-0 right-0 w-80 bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-indigo-100 transform transition-transform duration-500 z-[100] flex flex-col text-slate-800 ${isRoutineDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-5 flex justify-between items-center border-b border-indigo-50 bg-indigo-50/50">
          <div className="flex items-center gap-2 text-indigo-700"><Repeat className="w-5 h-5" /><h2 className="font-bold">JSON Routines</h2></div>
          <button onClick={() => setIsRoutineDrawerOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-indigo-400"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6 p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm">
            <div className="flex gap-2 mb-2">
              <select value={drawerRoutineType} onChange={(e) => setDrawerRoutineType(e.target.value as any)} className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-400 w-1/3">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              
              {drawerRoutineType === 'weekly' && (
                <select value={drawerGenerateOn} onChange={(e) => setDrawerGenerateOn(e.target.value)} className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-400 w-1/3">
                  <option value="Mon">On Mon</option>
                  <option value="Tue">On Tue</option>
                  <option value="Wed">On Wed</option>
                  <option value="Thu">On Thu</option>
                  <option value="Fri">On Fri</option>
                  <option value="Sat">On Sat</option>
                  <option value="Sun">On Sun</option>
                </select>
              )}

              <select 
                value={drawerRoutineType === 'daily' ? 'none' : drawerDeadline} 
                onChange={(e) => setDrawerDeadline(e.target.value)} 
                disabled={drawerRoutineType === 'daily'}
                className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-400 flex-1 disabled:opacity-50 disabled:bg-gray-100"
              >
                <option value="none">No Due</option>
                <option value="today">Due Today</option>
                <option value="Mon">by Mon</option>
                <option value="Fri">by Fri</option>
                <option value="Sun">by Sun</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input type="text" value={drawerRoutineText} onChange={(e) => setDrawerRoutineText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddRoutineFromDrawer()} placeholder="Add JSON routine..." className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400" />
              <button onClick={handleAddRoutineFromDrawer} className="bg-indigo-500 text-white p-1.5 rounded-lg hover:bg-indigo-600 transition-colors"><Plus className="w-5 h-5" /></button>
            </div>
          </div>

          {['daily', 'weekly'].map(type => {
            const sectionRoutines = routines.filter(r => r.type === type);
            if (sectionRoutines.length === 0) return null;
            return (
              <div key={type} className="mb-6">
                <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  {type}
                  <div className="flex-1 h-px bg-indigo-50"></div>
                </h3>
                <div className="space-y-1">
                  {sectionRoutines.map(r => {
                    const isCompletedToday = tasks.some(activeTask => activeTask.routineId === r.id && activeTask.status === 'done');
                    return (
                      <div key={r.id} className={`group flex flex-col p-2 rounded-lg transition-colors border ${isCompletedToday ? "bg-green-50/50 border-green-100" : "border-transparent hover:bg-indigo-50/50 hover:border-indigo-100"}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm truncate pr-2 flex items-center flex-1 ${isCompletedToday ? "text-slate-400 line-through" : "text-slate-700"}`}>
                            {isCompletedToday && <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-500 flex-shrink-0" />}
                            <span className="truncate" title={r.text}>{r.text}</span>
                          </span>
                          <button onClick={() => deleteRoutineJSON(r.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        {r.type === 'weekly' && (
                          <div className="text-[10px] text-indigo-400 mt-1 flex gap-2 ml-5">
                             <span className="bg-indigo-50 px-1 rounded">Gen: {r.generateOn}</span>
                             {r.deadlineRule !== 'none' && <span className="bg-orange-50 text-orange-400 px-1 rounded">Due: {r.deadlineRule}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;