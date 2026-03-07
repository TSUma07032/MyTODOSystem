// src/components/views/DashboardView.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { TaskRow } from '../TaskRow';
import type { Task } from '../../types';
import { getTaskIndent } from '../../logic/taskLogic';

interface DashboardViewProps {
  tasks: Task[];
  mode: 'dashboard' | 'sync'; // DashboardとNight Syncで使い回せるようにする
  isSyncing: boolean;
  newTaskText: string;
  setNewTaskText: (val: string) => void;
  onAddNewTask: () => void;
  
  // タスク操作系のハンドラ群
  onToggleTask: (id: string) => void;
  onUpdateDeadline: (id: string, date: string) => void;
  onAddSubTask: (parentId: string, text: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (dragId: string, dropId: string) => void;
  onPromoteToRoutine: (text: string) => void;
  onChangeDifficulty: (id: string, currentDiff: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  mode,
  isSyncing,
  newTaskText,
  setNewTaskText,
  onAddNewTask,
  onToggleTask,
  onUpdateDeadline,
  onAddSubTask,
  onUpdateText,
  onDeleteTask,
  onMoveTask,
  onPromoteToRoutine,
  onChangeDifficulty
}) => {
  const isNightMode = mode === 'sync';

  return (
    <div className="animate-fadeIn space-y-2 pb-10">
      {/* タスクリストのレンダリング */}
      {tasks
        .filter(t => t.routineType !== 'daily') // デイリーは専用画面があるため除外
        .map((task) => (
          <TaskRow 
            key={task.id} 
            task={task} 
            indent = {getTaskIndent(task.id, tasks)}
            isSyncing={isSyncing} 
            isNightMode={isNightMode}
            onToggle={onToggleTask} 
            onUpdateDeadline={onUpdateDeadline}
            onAddSubTask={onAddSubTask}
            onUpdateText={onUpdateText} 
            onDeleteTask={onDeleteTask} 
            onMoveTask={onMoveTask}
            onPromoteToRoutine={onPromoteToRoutine}
            onChangeDifficulty={onChangeDifficulty} 
          />
        ))}

      {/* 新規ミッション追加フィールド (Dashboardモード時のみ表示) */}
      {mode === 'dashboard' && (
        <div className="mt-6 flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-dashed border-gray-300 focus-within:bg-white focus-within:border-orange-300 focus-within:shadow-sm transition-all">
          <Plus className="w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            value={newTaskText} 
            onChange={(e) => setNewTaskText(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && onAddNewTask()} 
            placeholder="Add a new mission..." 
            className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400" 
          />
        </div>
      )}
    </div>
  );
};