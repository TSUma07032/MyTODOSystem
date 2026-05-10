// src/components/views/DashboardView.tsx
import React, {useState} from 'react';
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
  pomodoro: any;
  onAddToQueue: (id: string) => void;
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
  onChangeDifficulty,
  pomodoro,
  onAddToQueue
}) => {
  const isNightMode = mode === 'sync';

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 親タスクがすべて展開されているかチェックする関数
  const isTaskVisible = (task: Task) => {
    if (!task.parentId) return true; // ルート要素は常に表示
    
    let currentParentId: string | null = task.parentId;
    while (currentParentId) {
      if (!expandedIds.has(currentParentId)) return false; // 途中の親が閉じていれば非表示
      const parent = tasks.find(t => t.id === currentParentId);
      currentParentId = parent?.parentId || null;
    }
    return true;
  };

  return (
    <div className="animate-fadeIn space-y-2 pb-10">
      {/* タスクリストのレンダリング */}
      {tasks
        .filter(t => t.routineType !== 'daily' &&  isTaskVisible (t)) 
        .map((task) => {
          const hasChildren = tasks.some(child => child.parentId === task.id);
          
          return (
            <TaskRow 
              key={task.id} 
              task={task} 
              indent={getTaskIndent(task.id, tasks)}
              isSyncing={isSyncing} 
              isNightMode={isNightMode}
              hasChildren={hasChildren}
              isExpanded={expandedIds.has(task.id)}
              onToggleExpand={() => toggleExpand(task.id)}
              onToggle={onToggleTask} 
              onUpdateDeadline={onUpdateDeadline}
              onAddSubTask={onAddSubTask}
              onUpdateText={onUpdateText} 
              onDeleteTask={onDeleteTask} 
              onMoveTask={onMoveTask}
              onPromoteToRoutine={onPromoteToRoutine}
              onChangeDifficulty={onChangeDifficulty}

              pomodoro={pomodoro} 
              onAddToQueue={onAddToQueue}
            />
          );
        })}

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