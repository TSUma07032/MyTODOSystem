import React from 'react';
import { useAppContext } from '../../hooks/AppContext';
import { DashboardView } from '../views/DashboardView';
import { DailyView } from '../views/DailyView';
import { CalendarView } from '../views/CalendarView';
import { HistoryView } from '../views/HistoryView';
import { PomodoroView } from '../views/PomodoroView';
import type { Task } from '../../types';

export const ViewContainer: React.FC = () => {
  const {
    mode,
    tasks,
    pomodoro,
    pomodoroQueue,
    routines,
    isSyncing,
    controllerProps,
  } = useAppContext();

  const {
    onToggleTask, onUpdateDeadline, onAddSubTask, onUpdateText,
    onDeleteTask, onMoveTask, onChangeDifficulty, onAddToQueue,
    onRemoveFromQueue, onUpdateWorkTime, onToggleDaily, onPromoteToRoutine,
    onAddEvent, onUpdateEvent, onDeleteEvent, onHistoryClick,
    onMarkdownApply, onAddNewTask,
    newTaskText, setNewTaskText,
    searchQuery, setSearchQuery,
    currentDate, setCurrentDate,
    selectedDay, setSelectedDay,
    groupedHistory, viewingLog, calendarDays,
    rawMarkdown, setRawMarkdown,
    completedDailyIds,
    updateTasksAndSave,
  } = controllerProps;

  if (mode === 'pomodoro') {
    return (
      <PomodoroView
        pomodoro={pomodoro}
        tasks={tasks}
        onToggleTask={onToggleTask}
        queue={pomodoroQueue}
        onAddToQueue={onAddToQueue}
        onRemoveFromQueue={onRemoveFromQueue}
        onUpdateWorkTime={onUpdateWorkTime}
        onAddTemplate={async (templateName, subTasks) => {
          const parentId = `task-${Date.now()}`;
          const parentTask: Task = {
            id: parentId, text: templateName, status: 'todo',
            parentId: null, order: tasks.length, difficulty: 2
          };
          const newChildTasks: Task[] = subTasks.map((text, i) => ({
            id: `task-${Date.now() + i + 1}`, text, status: 'todo',
            parentId: parentId, order: i, difficulty: 1
          }));
          await updateTasksAndSave([...tasks, parentTask, ...newChildTasks]);
          onAddToQueue(parentId);
        }}
      />
    );
  }

  if (mode === 'history') {
    return (
      <HistoryView
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        groupedHistory={groupedHistory}
        viewingLog={viewingLog}
        onHistoryClick={onHistoryClick}
      />
    );
  }

  return (
    <div className="flex w-full h-full animate-fadeIn">
      {/* 左側：Syncモード時のみ表示されるMarkdownエディタ */}
      <div className={`w-1/2 flex flex-col border-r transition-all duration-500 ${mode === 'sync' ? 'flex bg-white/80 backdrop-blur-xl border-white/20' : 'hidden'}`}>
        <textarea
          className="flex-1 w-full p-8 resize-none font-mono text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"
          value={rawMarkdown}
          onChange={(e) => setRawMarkdown(e.target.value)}
          onBlur={onMarkdownApply}
          placeholder="- [ ] Notionからペースト..."
        />
      </div>

      {/* 右側：メインコンテンツエリア */}
      <div className={`flex flex-col transition-all duration-700 ${
        mode === 'sync' ? 'w-1/2 bg-black/10 backdrop-blur-lg' :
        mode === 'calendar' ? 'w-full max-w-[1400px] mx-auto px-4' :
        'w-full max-w-5xl mx-auto px-4'
      }`}>
        <div className={`flex-1 overflow-y-auto p-6 space-y-2 ${mode === 'sync' && "text-white"}`}>
          {mode === 'calendar' && (
            <CalendarView
              currentDate={currentDate} setCurrentDate={setCurrentDate}
              calendarDays={calendarDays} selectedDay={selectedDay}
              setSelectedDay={setSelectedDay} onToggleTask={onToggleTask}
              onAddEvent={onAddEvent} onUpdateEvent={onUpdateEvent} onDeleteEvent={onDeleteEvent}
            />
          )}
          {mode === 'daily' && (
            <DailyView routines={routines} completedDailyIds={completedDailyIds} onToggleDaily={onToggleDaily} />
          )}
          {(mode === 'dashboard' || mode === 'sync') && (
            <DashboardView
              tasks={tasks} pomodoro={pomodoro} mode={mode} isSyncing={isSyncing}
              newTaskText={newTaskText} setNewTaskText={setNewTaskText}
              onAddNewTask={() => onAddNewTask(newTaskText)} onToggleTask={onToggleTask}
              onUpdateDeadline={onUpdateDeadline} onAddSubTask={onAddSubTask}
              onUpdateText={onUpdateText} onDeleteTask={onDeleteTask}
              onMoveTask={onMoveTask} onPromoteToRoutine={onPromoteToRoutine}
              onChangeDifficulty={onChangeDifficulty} onAddToQueue={onAddToQueue}
            />
          )}
        </div>
      </div>
    </div>
  );
};