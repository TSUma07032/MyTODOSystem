// src/App.tsx
import { useState, useEffect } from 'react';
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
import { useInfrastructure } from './hooks/useInfrastructure';
import { InfrastructureDrawer } from './components/features/infrastructure/InfrastructureDrawer';

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

  // ドロワーの開閉ステートを追加
  const [isInfrastructureDrawerOpen, setIsInfrastructureDrawerOpen] = useState(false);

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
    modules, debt, initInfrastructure, mineModule, toggleModuleStatus, processSettlement, upgradeModule, resonateModule, repayDebt, sellModule
  } = useInfrastructure(gamification.coins, addCoins, removeCoins, writeFile);

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
      earnedCoins += calculateTaskCoins(t); // taskLogicからの戻り値（マイナスも有り得る）
      if (t.difficulty > maxDifficulty) maxDifficulty = t.difficulty;
    });

    const activeModules = modules.filter(m => m.status === 'on');
    const totalMultiplier = activeModules.reduce((sum, m) => 
      sum + (m.baseMultiplier * m.level * (1 + m.rank * 0.2)), 0
    );
    
    // 🛡️ バフ込みの最終獲得予定コイン（ペナルティのマイナス値にはバフを掛けない安全設計！）
    const finalCoins = earnedCoins >= 0 
      ? Math.floor(earnedCoins * (1 + totalMultiplier)) 
      : earnedCoins; 

    if (isCurrentlyTodo) {
      if (finalCoins >= 0) {
        // 🟢 通常クリア or 早期クリアボーナスの処理
        let actualCoinsToAdd = finalCoins;
        let deductedForDebt = 0;

        if (debt > 0) {
          deductedForDebt = Math.min(Math.ceil(finalCoins * 0.5), debt);
          actualCoinsToAdd = finalCoins - deductedForDebt;
          await repayDebt(deductedForDebt);
        }

        if (actualCoinsToAdd > 0) {
          await addCoins(actualCoinsToAdd);
        }

        let toastMsg = `+${actualCoinsToAdd} 🪙`;
        if (totalMultiplier > 0) toastMsg += ` (Boost: +${Math.floor(totalMultiplier * 100)}%)`;
        if (deductedForDebt > 0) toastMsg += `\n💸 借金返済: -${deductedForDebt} 🪙`;
        
        showToast(toastMsg, maxDifficulty);
      } else {
        // 🔴 期限超過ペナルティの処理 (finalCoins がマイナスの場合)
        const penaltyAmount = Math.abs(finalCoins);
        await removeCoins(penaltyAmount);
        showToast(`期限超過ペナルティ... -${penaltyAmount} 🪙`, 5); // 赤色(難易度5)のトーストで警告
      }
      
    } else {
      // 🔙 タスクを未完了に戻した場合（誤タップ対応）
      if (finalCoins >= 0) {
        await removeCoins(finalCoins);
        showToast(`-${finalCoins} 🪙`, 1);
      } else {
        // ペナルティだったタスクを戻した場合は、没収分を返還する親切設計
        const returnAmount = Math.abs(finalCoins);
        await addCoins(returnAmount);
        showToast(`ペナルティ返還 +${returnAmount} 🪙`, 1);
      }
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

  const handlePenalty = async (missedCount: number) => {
    const penaltyPerTask = 50; // 1つサボるごとに50コイン没収
    const totalPenalty = missedCount * penaltyPerTask;
    
    await removeCoins(totalPenalty);
    showToast(`不履行ペナルティ: -${totalPenalty} 🪙 (未達成: ${missedCount}件)`, 5); // 難易度5で赤い警告
  };


  // 4. 初期データの読み込み (useEffect群)
  useAppInitialization({
    mode, isReady, readFile, writeFile,
    initDailyProgress, initGamification, initRoutines,
    setInput, setHistoryItems,
    routines, onPenalty: handlePenalty,
    initInfrastructure
  });

  useEffect(() => { //後で隔離
    const runSettlement = async () => {
      // isReady になり、モジュールデータが存在する場合のみ実行
      if (isReady && modules.length > 0) {
        const result = await processSettlement(gamification.coins);
        
        if (result) {
          // 清算が発生した場合、結果をトーストで通知
          const sign = result.netDifference > 0 ? "+" : "";
          const msg = `[${result.daysPassed}日分の清算] 収益:${Math.floor(result.totalIncome)} 維持費:-${Math.floor(result.totalMaintenance)} (収支: ${sign}${result.netDifference} 🪙)`;
          
          showToast(msg, result.netDifference < 0 ? 5 : 1);
          
          if (result.newDebt > debt) {
            setTimeout(() => showToast(`⚠️ 資金ショート！借金が ${result.newDebt.toLocaleString()} 🪙 に膨れ上がりました！`, 5), 3500);
          }
        }
      }
    };
    runSettlement();
  }, [isReady, modules.length]); // 初回ロード後に発火

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
        onOpenInfrastructure={() => setIsInfrastructureDrawerOpen(true)}
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

      <InfrastructureDrawer 
        isOpen={isInfrastructureDrawerOpen}
        onClose={() => setIsInfrastructureDrawerOpen(false)}
        modules={modules}
        debt={debt}
        coins={gamification.coins}
        onMine={async () => {
          const newMod = await mineModule();
          if (newMod) {
             // マイニング成功時にトースト通知を出すと気持ちいいです
             showToast(`[${newMod.rarity}] ${newMod.name} を発掘しました！`, newMod.rarity === 'Legendary' ? 5 : 2);
          }
        }}
        onToggleStatus={toggleModuleStatus}
        // レベルアップ処理を繋ぐ
        onUpgrade={async (id, currentCoins) => {
          const success = await upgradeModule(id, currentCoins);
          if (success) showToast("モジュールをアップグレードしました！", 2);
          return success;
        }}
        onResonate={async (id) => {
          const childName = await resonateModule(id);
          if (childName) {
            showToast(`共鳴成功！新たなモジュール「${childName}」が誕生しました！`, 5);
          }
          return childName;
        }}
        onSell={async (id) => {
          const price = await sellModule(id);
          if (price !== false) {
            showToast(`不要なモジュールを ${price} 🪙 でスクラップ業者に売却しました。`, 2);
          }
          return price;
        }}
      />
    </div>
  );
}

export default App;