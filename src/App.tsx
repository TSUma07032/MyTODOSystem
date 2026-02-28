// src/App.tsx
import { useState } from 'react';
import { format } from 'date-fns';

// Hooks
import { useFileSystem } from './hooks/useFileSystem';
import { useTasks } from './hooks/useTasks';
import { useGamification } from './hooks/useGamification';
import { useRoutines } from './hooks/useRoutines';

// Components (Layout & Views)
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { DailyView } from './components/views/DailyView';
import { CalendarView } from './components/views/CalendarView';
import { HistoryView } from './components/views/HistoryView';

// Components (Features & UI)
import { ShopDrawer } from './components/features/shops/ShopDrawer';
import { RoutineDrawer } from './components/features/routines/RoutineDrawer';
import { Toast } from './components/ui/Toast';

// Custom Hooks
import { useAppInitialization } from './hooks/useAppInitialization';

// View用の導出ロジックをまとめたカスタムフック
import { useAppViewData } from './hooks/useAppViewData';

// Icons
import { ArrowRight, Sparkles, Copy, CheckCircle } from 'lucide-react';

function App() {
  // 1. アプリケーションのグローバルな状態
  const [mode, setMode] = useState<'dashboard' | 'daily' | 'sync' | 'history' | 'calendar'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{message: string, difficulty: number, id: number} | null>(null);

  // 履歴・検索用の状態
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [viewingLog, setViewingLog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // カレンダー用の状態
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // ダッシュボード用の新規タスク入力状態
  const [newTaskText, setNewTaskText] = useState("");

  // 2. カスタムフックの初期化
  const { 
    dirHandle, isReady, pickDirectory, verifyPermission, 
    writeFile, readFile, saveDeepFile, readDeepFile, appendToHistoryIndex 
  } = useFileSystem();

  const {
    input, setInput, tasks, toggleTaskStatus, changeDifficulty,
    updateDeadline, updateTaskText, deleteTask, addSubTask, moveTask, addNewTask, updateInputAndSave
  } = useTasks("", writeFile);

  const {
    gamification, initGamification,
    isShopDrawerOpen, setIsShopDrawerOpen, isShopEditMode, setIsShopEditMode,
    editingItemId, setEditingItemId, editItemData, setEditItemData, newItemData, setNewItemData,
    handleAddShopItem, handleDeleteShopItem, handleUpdateShopItem, startEditing,
    calculateTaskCoins, addCoins, removeCoins
  } = useGamification(writeFile);

  const {
    routines, initRoutines, completedDailyIds, initDailyProgress,
    isRoutineDrawerOpen, setIsRoutineDrawerOpen,
    drawerRoutineType, setDrawerRoutineType, drawerRoutineText, setDrawerRoutineText,
    drawerGenerateOn, setDrawerGenerateOn, drawerDeadline, setDrawerDeadline,
    saveRoutineJSON, deleteRoutineJSON, handleAddRoutineFromDrawer, toggleDailyProgress
  } = useRoutines(writeFile, async (newLine) => {
    // ルーチンが活性化した際にタスクリストへ追記するコールバック
    const activeContent = (await readFile('current_active_todo.md')) || "";
    const nextContent = activeContent + (activeContent.endsWith('\n') ? '' : '\n') + newLine;
    await updateInputAndSave(nextContent);
  });

  // 3. ユーティリティ・アクション関数
  const showToast = (message: string, difficulty: number) => {
    setToast({ message, difficulty, id: Date.now() });
    setTimeout(() => setToast(null), 3000); 
  };

  const handleToggleTaskApp = async (taskId: string) => {
    const result = await toggleTaskStatus(taskId);
    if (!result) return;
    const { isCurrentlyTodo, toggledTasks } = result;

    let earnedCoins = 0;
    let maxDifficulty = 0;
    
    toggledTasks.forEach(t => {
      earnedCoins += calculateTaskCoins(t);
      if (t.difficulty > maxDifficulty) maxDifficulty = t.difficulty;
    });

    if (isCurrentlyTodo) {
      await addCoins(earnedCoins);
      showToast(`+${earnedCoins} 🪙`, maxDifficulty);
    } else {
      await removeCoins(earnedCoins);
      showToast(`-${earnedCoins} 🪙`, 1);
    }
  };

  const handleToggleDailyApp = async (routineId: string) => {
    const { isCompleted, coinDiff } = await toggleDailyProgress(routineId);
    if (isCompleted) {
      await addCoins(coinDiff);
      showToast(`習慣達成! +${coinDiff} 🪙`, 1);
    } else {
      await removeCoins(coinDiff);
      showToast(`-${coinDiff} 🪙`, 1);
    }
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
    await updateInputAndSave(nextInput);
    setIsSyncing(false);
  };

  const handleCopy = async () => { 
    await navigator.clipboard.writeText(input); 
    setCopied(true); 
    setTimeout(() => setCopied(false), 2000); 
  };

  // 4. 初期データの読み込み (useEffect群)
  useAppInitialization({
    mode, isReady, readFile, writeFile,
    initDailyProgress, initGamification, initRoutines,
    setInput, setHistoryItems
  });

  // 5. 導出ステート (useMemo群)
  const { groupedHistory, calendarDays, themeConfig } = useAppViewData({
    mode, historyItems, searchQuery, currentDate, tasks
  });


  // 6. メインレンダリング
  return (
    <div className={`h-screen flex flex-col font-sans transition-all duration-700 animate-gradient-flow ${themeConfig.bg}`}>
      
      {/* トースト通知 */}
      {toast && <Toast message={toast.message} difficulty={toast.difficulty} />}

      {/* トップヘッダー */}
      <Header 
        mode={mode} 
        themeIcon={themeConfig.icon} 
        themeAccent={themeConfig.accent} 
        coins={gamification.coins} 
        isReady={isReady} 
        onOpenShop={() => setIsShopDrawerOpen(true)} 
        onOpenRoutines={() => setIsRoutineDrawerOpen(true)} 
        onConnectFolder={!dirHandle ? pickDirectory : verifyPermission} 
      />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex overflow-hidden relative animate-fadeIn">
        
        {/* History モード */}
        {mode === 'history' && (
          <HistoryView 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            groupedHistory={groupedHistory} 
            viewingLog={viewingLog} 
            onHistoryClick={async (item) => {
              const content = await readDeepFile(item.sourcePath, item.sourceFile);
              setViewingLog(content);
            }} 
          />
        )}

        {/* Dashboard, Daily, Sync, Calendar モード共通ラッパー */}
        {(mode === 'dashboard' || mode === 'daily' || mode === 'sync' || mode === 'calendar') && (
          <div className="flex w-full h-full animate-fadeIn">
            
            {/* 左側：生テキストエディタ（Syncモード時のみ表示） */}
            <div className={`w-1/2 flex flex-col border-r transition-all duration-500 ${mode === 'sync' ? 'flex bg-white/80 backdrop-blur-xl border-white/20' : 'hidden'}`}>
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

              {/* 各モードに応じたビューのレンダリング */}
              <div className={`flex-1 overflow-y-auto p-6 space-y-2 ${mode === 'sync' && "text-white"}`}>
                {mode === 'calendar' && (
                  <CalendarView 
                    currentDate={currentDate} setCurrentDate={setCurrentDate} 
                    calendarDays={calendarDays} selectedDay={selectedDay} 
                    setSelectedDay={setSelectedDay} onToggleTask={handleToggleTaskApp} 
                  />
                )}
                
                {mode === 'daily' && (
                  <DailyView 
                    routines={routines} 
                    completedDailyIds={completedDailyIds} 
                    onToggleDaily={handleToggleDailyApp} 
                  />
                )}
                
                {(mode === 'dashboard' || mode === 'sync') && (
                  <DashboardView 
                    tasks={tasks} mode={mode} isSyncing={isSyncing} 
                    newTaskText={newTaskText} setNewTaskText={setNewTaskText} 
                    onAddNewTask={() => { addNewTask(newTaskText); setNewTaskText(''); }} 
                    onToggleTask={handleToggleTaskApp} onUpdateDeadline={updateDeadline} 
                    onAddSubTask={addSubTask} onUpdateText={updateTaskText} 
                    onDeleteTask={deleteTask} onMoveTask={moveTask} 
                    onPromoteToRoutine={(text) => saveRoutineJSON({ text, type: 'daily', deadlineRule: 'none' })} 
                    onChangeDifficulty={changeDifficulty} 
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 各種ドロワー */}
      <ShopDrawer 
        isOpen={isShopDrawerOpen} onClose={() => setIsShopDrawerOpen(false)} 
        gamification={gamification} isShopEditMode={isShopEditMode} setIsShopEditMode={setIsShopEditMode} 
        editingItemId={editingItemId} setEditingItemId={setEditingItemId} 
        editItemData={editItemData} setEditItemData={setEditItemData} 
        newItemData={newItemData} setNewItemData={setNewItemData} 
        handleAddShopItem={handleAddShopItem} handleDeleteShopItem={handleDeleteShopItem} 
        handleUpdateShopItem={handleUpdateShopItem} startEditing={startEditing} removeCoins={removeCoins} 
      />
      
      <RoutineDrawer 
        isOpen={isRoutineDrawerOpen} onClose={() => setIsRoutineDrawerOpen(false)} 
        routines={routines} tasks={tasks} drawerRoutineType={drawerRoutineType} 
        setDrawerRoutineType={setDrawerRoutineType} drawerRoutineText={drawerRoutineText} 
        setDrawerRoutineText={setDrawerRoutineText} drawerGenerateOn={drawerGenerateOn} 
        setDrawerGenerateOn={setDrawerGenerateOn} drawerDeadline={drawerDeadline} 
        setDrawerDeadline={setDrawerDeadline} handleAddRoutineFromDrawer={handleAddRoutineFromDrawer} 
        deleteRoutineJSON={deleteRoutineJSON} 
      />
    </div>
  );
}

export default App;