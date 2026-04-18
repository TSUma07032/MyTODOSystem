import React, { useState } from 'react';
import { CheckCircle2, Circle, CalendarClock, CornerDownRight, Plus, Trash2, GripVertical, Repeat, Star, ChevronRight, ChevronDown, Check, ListPlus } from 'lucide-react';
import { clsx } from 'clsx';
import type { Task } from '../types';
import { useTasks } from '../store/useTasks'; // 🚀 Storeを直接呼ぶ！
import { Badge } from '@/core/components/Badge'; // 🚀 Core部品を使う
import { IconButton } from '@/core/components/IconButton';

// 🚀 クロスフィーチャー（他の機能）のStoreも直接呼ぶ（Propsで受け取らない）
// import { useRoutines } from '@/features/routines/store/useRoutines';
// import { usePomodoro } from '@/features/pomodoro/store/usePomodoro';

interface Props {
  task: Task;
  indent: number;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  // その他の 15個のProps はすべて消滅！！！🎉
}

export const TaskRow: React.FC<Props> = ({ 
  task, indent, hasChildren = false, isExpanded = false, onToggleExpand
}) => {
  // 🚀 Storeから必要なアクションを直接取得
  const { updateTask, deleteTask, addTask } = useTasks();
  
  // (※将来的に有効化)
  // const { addRoutine } = useRoutines();
  // const { mode: pomodoroMode, activeTaskId, completeTaskEarly, addToQueue } = usePomodoro();

  const [isAddingSub, setIsAddingSub] = useState(false);
  const [subText, setSubText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  const isRoutine = task.routineType !== undefined;

  const handleSubSubmit = () => {
    if (subText.trim()) {
      addTask({
        id: `task-${Date.now()}`,
        text: subText.trim(),
        status: 'todo',
        parentId: task.id, // このタスクを親に設定
        order: Date.now(),
        difficulty: 2,
      });
      setSubText(""); 
      setIsAddingSub(false);
    }
  };

  const handleEditSubmit = () => {
    if (editText.trim() !== task.text && editText.trim() !== "") { 
      updateTask(task.id, { text: editText.trim() }); 
    } else { 
      setEditText(task.text); 
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col">
      <div 
        draggable={!isEditing}
        className={clsx(
          "relative flex items-start py-2.5 px-3 border-b transition-all duration-300 group overflow-visible rounded-xl hover:bg-white/60 hover:shadow-sm border-gray-100/50",
          task.status === 'done' && "opacity-50 grayscale",
          isRoutine && "bg-indigo-50/40 border-indigo-100/50"
        )}
        style={{ paddingLeft: `${indent * 1.5 + 0.2}rem` }}
      >
        <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity mr-1 mt-0.5">
          <GripVertical className="w-4 h-4" />
        </div>

        <div className="flex items-center justify-center w-5 mr-1 mt-0.5 shrink-0">
          {hasChildren && (
            <button onClick={onToggleExpand} className="p-0.5 rounded-md hover:bg-gray-200 text-gray-500 transition-colors">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        <button 
          onClick={() => updateTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' })} 
          className="mr-3 mt-0.5 transition-colors group-hover:scale-110 active:scale-95 shrink-0"
        >
          {task.status === 'done' ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <Circle className="w-5 h-5 text-gray-300 hover:text-blue-500" />
          )}
        </button>

        <div className="flex-1 flex flex-col sm:flex-row sm:justify-between items-start gap-3 min-w-0">
          
          <div className="flex-1 min-w-0 w-full mt-0.5">
            {isEditing ? (
              <input
                autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={handleEditSubmit}
                onKeyDown={(e) => { if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') setIsEditing(false); }}
                className="w-full bg-transparent border-b border-orange-400 outline-none text-sm text-gray-800"
              />
            ) : (
              <span onClick={() => setIsEditing(true)} className={clsx("text-sm font-medium transition-all cursor-text hover:bg-orange-100/50 px-1 -ml-1 rounded block break-words", task.status === 'done' && "line-through opacity-70")}>
                {task.text}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
            <div className="flex items-center gap-1.5 flex-wrap justify-end mt-0.5">
              
              {/* 🚀 core/components/Badge を使ってスッキリ記述！ */}
              {task.totalWorkTime && task.totalWorkTime > 0 ? (
                <Badge variant="warning">⏱ {task.totalWorkTime}m</Badge>
              ) : null}

              {isRoutine && (
                <Badge variant="info"><Repeat className="w-3 h-3 mr-1" /> {task.routineType === 'weekly' ? 'W' : 'D'}</Badge>
              )}

              {task.deadline && (
                <Badge variant="neutral"><CalendarClock className="w-3 h-3" /> {task.deadline}</Badge>
              )}

              <button 
                onClick={(e) => { e.stopPropagation(); updateTask(task.id, { difficulty: task.difficulty >= 5 ? 1 : task.difficulty + 1 }); }}
                className="hover:scale-105 active:scale-95 z-10"
              >
                <Badge variant={task.difficulty >= 5 ? "danger" : task.difficulty >= 3 ? "warning" : "neutral"}>
                  <Star className={clsx("w-3 h-3", task.difficulty >= 5 ? "fill-red-500" : task.difficulty >= 3 ? "fill-amber-500" : "fill-slate-400")} />
                  {task.difficulty}
                </Badge>
              </button>
            </div>

            {/* ホバーアクション */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/50 backdrop-blur-sm rounded-lg px-1">
              {!isAddingSub && task.status !== 'done' && (
                <IconButton onClick={() => setIsAddingSub(true)} title="Add sub-task"><CornerDownRight className="w-4 h-4" /></IconButton>
              )}
              <IconButton variant="danger" onClick={() => deleteTask(task.id)} title="Delete task"><Trash2 className="w-4 h-4" /></IconButton>
            </div>

          </div>
        </div>
      </div>
      
      {/* サブタスク入力フォーム... (省略) */}
    </div>
  );
};