import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { useFileSystem } from './useFileSystem';
import { useTasks } from './useTasks';
import { useRoutines } from './useRoutines';
import { useEvents } from './useEvents';
import { usePomodoro } from './usePomodoro';
import { useAppInitialization } from './useAppInitialization';
import { useAppViewData } from './useAppViewData';
import { tasksToMarkdown } from '../utils/markdownSync';
import { parseMarkdown } from '../utils/parser';
import { migrateMarkdownToJson } from '../utils/migrator';
import type { Task, Routine } from '../types';

export const useAppController = () => {
  // 1. 基本状態
  const [mode, setMode] = useState<'dashboard' | 'daily' | 'sync' | 'history' | 'calendar' | 'pomodoro'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{message: string, difficulty: number, id: number} | null>(null);

  // 2. 履歴・検索・カレンダー状態
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [viewingLog, setViewingLog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [rawMarkdown, setRawMarkdown] = useState("");

  // 3. ポモドーロキューの状態と永続化
  const [pomodoroQueue, setPomodoroQueue] = useState<string[]>(() => {
    const saved = localStorage.getItem('pomodoroQueue');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pomodoroQueue', JSON.stringify(pomodoroQueue));
  }, [pomodoroQueue]);

  // 4. トースト通知ユーティリティ
  const showToast = useCallback((message: string, difficulty: number) => {
    setToast({ message, difficulty, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 5. 各種ドメインフックの初期化
  const { 
    dirHandle, isReady, pickDirectory, verifyPermission, 
    writeFile, readFile, saveDeepFile, readDeepFile, appendToHistoryIndex 
  } = useFileSystem();

  const {
    tasks, setTasks, toggleTaskStatus, changeDifficulty,
    updateDeadline, updateTaskText, deleteTask, addSubTask, moveTask, addNewTask, updateTasksAndSave,
    addWorkTime, setWorkTime
  } = useTasks(writeFile);

  const {
    routines, initRoutines, completedDailyIds, initDailyProgress,
    isRoutineDrawerOpen, setIsRoutineDrawerOpen,
    drawerRoutineType, setDrawerRoutineType, drawerRoutineText, setDrawerRoutineText,
    drawerGenerateOn, setDrawerGenerateOn, drawerDeadline, setDrawerDeadline,
    saveRoutineJSON, deleteRoutineJSON, handleAddRoutineFromDrawer, toggleDailyProgress
  } = useRoutines(writeFile, async () => { /* 独立化のためTODOへの自動追加を廃止 */ });

  const { events, setEvents, addEvent, updateEvent, deleteEvent } = useEvents(writeFile);
  const pomodoro = usePomodoro(addWorkTime, showToast);

  // 6. イベントハンドラー
  const handleToggleTaskApp = async (taskId: string) => {
    const result = await toggleTaskStatus(taskId);
    if (result) {
      showToast(result.isCurrentlyTodo ? "タスク完了！" : "未完了に戻しました", 1);
    }
  };

  const handleSyncAndSave = async () => {
    if (!dirHandle) { await pickDirectory(); return; }
    if (!isReady && !(await verifyPermission())) return;
    
    setIsSyncing(true);
    const now = new Date();
    const year = format(now, 'yyyy');
    const month = format(now, 'MM');
    const filename = `${format(now, 'yyyy-MM-dd_HH-mm-ss')}.json`;
    
    const doneTasks = tasks.filter(t => t.status === 'done');
    if (doneTasks.length > 0) {
      await appendToHistoryIndex(doneTasks, filename, [year, month]);
      await saveDeepFile([year, month], filename, JSON.stringify(doneTasks, null, 2));
    }
    
    const newTasks = tasks.filter(t => t.status !== 'done' && t.routineType !== 'daily');
    await updateTasksAndSave(newTasks);
    setIsSyncing(false);
    showToast("同期が完了しました", 1);
  };

  const handleCopy = async () => { 
    const mdText = tasksToMarkdown(tasks);
    await navigator.clipboard.writeText(mdText); 
    setCopied(true); 
    setTimeout(() => setCopied(false), 2000); 
  };

  const handleAddToQueue = (taskId: string) => {
    if (!pomodoroQueue.includes(taskId) && pomodoro.taskId !== taskId) {
      setPomodoroQueue(prev => [...prev, taskId]);
      showToast("キューに追加しました", 1);
    }
  };

  const handleMarkdownApply = async () => {
    if (rawMarkdown === tasksToMarkdown(tasks)) return;
    try {
      const { tasks: parsed } = parseMarkdown(rawMarkdown);
      const newTasks = migrateMarkdownToJson(parsed as any);
      await updateTasksAndSave(newTasks); 
      showToast("Markdown同期完了", 2);
    } catch (e) {
      showToast("パース失敗", 5);
    }
  };

  // 7. 初期化とデータの導出
  useAppInitialization({
    mode, isReady, readFile, writeFile, initDailyProgress, initRoutines,
    setTasks, setEvents, setHistoryItems, routines, 
    onPenalty: (count) => showToast(`不履行: ${count}件の未達成`, 5)
  });

  const { groupedHistory, calendarDays, themeConfig } = useAppViewData({
    mode, historyItems, searchQuery, currentDate, tasks, events
  });

  useEffect(() => {
    setRawMarkdown(tasksToMarkdown(tasks));
  }, [tasks]);

  // 全てのViewへ渡す共通プロップス
  const controllerProps = {
    // Handlers
    onToggleTask: handleToggleTaskApp,
    onUpdateDeadline: updateDeadline,
    onAddSubTask: addSubTask,
    onUpdateText: updateTaskText,
    onDeleteTask: deleteTask,
    onMoveTask: moveTask,
    onChangeDifficulty: changeDifficulty,
    onAddToQueue: handleAddToQueue,
    onRemoveFromQueue: (id: string) => setPomodoroQueue(prev => prev.filter(v => v !== id)),
    onUpdateWorkTime: setWorkTime,
    onToggleDaily: async (id: string) => {
      const { isCompleted } = await toggleDailyProgress(id);
      showToast(isCompleted ? "習慣達成！" : "戻しました", 1);
    },
    onPromoteToRoutine: (text: string) => saveRoutineJSON({ text, type: 'daily', deadlineRule: 'none' }),
    onAddEvent: addEvent,
    onUpdateEvent: updateEvent,
    onDeleteEvent: deleteEvent,
    onHistoryClick: async (item: any) => {
      const content = await readDeepFile(item.sourcePath, item.sourceFile);
      setViewingLog(content);
    },
    onMarkdownApply: handleMarkdownApply,
    onAddNewTask: (text: string) => { addNewTask(text); setNewTaskText(''); },
    
    // States/Values for Views
    newTaskText, setNewTaskText,
    searchQuery, setSearchQuery,
    currentDate, setCurrentDate,
    selectedDay, setSelectedDay,
    groupedHistory, viewingLog, calendarDays,
    rawMarkdown, setRawMarkdown,
    completedDailyIds,
    
    // Routine Drawer specific
    drawerRoutineType, setDrawerRoutineType,
    drawerRoutineText, setDrawerRoutineText,
    drawerGenerateOn, setDrawerGenerateOn,
    drawerDeadline, setDrawerDeadline,
    handleAddRoutineFromDrawer,
    deleteRoutineJSON,
    updateTasksAndSave
  };

  return {
    mode, setMode,
    isSyncing,
    copied,
    toast,
    themeConfig,
    isReady,
    dirHandle,
    tasks,
    pomodoro,
    pomodoroQueue,
    routines,
    isRoutineDrawerOpen,
    setIsRoutineDrawerOpen,
    handleSyncAndSave,
    handleCopy,
    pickDirectory,
    verifyPermission,
    controllerProps
  };
};