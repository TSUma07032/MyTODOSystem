import React, { useState } from 'react';
import { type Task } from '../types';
import { CheckCircle2, Circle, CalendarClock, Calendar, CornerDownRight, Plus, Trash2, GripVertical, Repeat, Star } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  task: Task;
  isSyncing?: boolean;
  onUpdateDeadline?: (id: string, date: string) => void;
  onToggle?: (id: string) => void;
  isNightMode?: boolean;
  onAddSubTask?: (parentId: string, text: string) => void;
  onUpdateText?: (id: string, text: string) => void;
  onDeleteTask?: (id: string) => void;
  onMoveTask?: (dragId: string, dropId: string) => void;
  onPromoteToRoutine?: (text: string) => void;
  onChangeDifficulty?: (id: string, currentDiff: number) => void;
}

export const TaskRow: React.FC<Props> = ({ 
  task, isSyncing = false, onUpdateDeadline, onToggle, isNightMode = false, onAddSubTask, onUpdateText, onDeleteTask, onMoveTask, onPromoteToRoutine, onChangeDifficulty
}) => {
  const shouldVanish = isSyncing && task.status === 'done';
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [subText, setSubText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  const isRoutine = task.routineType !== undefined;

  const getDeadlineStatus = (dateStr?: string) => {
    if (!dateStr) return 'none';
    const now = new Date();
    const currentYear = now.getFullYear();
    const [month, day] = dateStr.split('/').map(Number);
    const targetDate = new Date(currentYear, month - 1, day, 23, 59, 59);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (targetDate < todayStart) return 'overdue';
    if (targetDate.getTime() === todayStart.getTime()) return 'today';
    return 'future';
  };

  const deadlineStatus = getDeadlineStatus(task.deadline);

  const handleSubSubmit = () => {
    if (onAddSubTask && subText) { onAddSubTask(task.id, subText); setSubText(""); setIsAddingSub(false); }
  };

  const handleEditSubmit = () => {
    if (onUpdateText && editText.trim() !== task.text && editText.trim() !== "") { onUpdateText(task.id, editText.trim()); } else { setEditText(task.text); }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col">
      <div 
        draggable={!isEditing}
        onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); e.dataTransfer.effectAllowed = 'move'; }}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={(e) => { e.preventDefault(); const dragId = e.dataTransfer.getData('taskId'); if (onMoveTask) onMoveTask(dragId, task.id); }}
        className={clsx(
          "relative flex items-start py-2.5 px-3 border-b transition-all duration-300 group overflow-visible",
          isRoutine && !isNightMode ? "bg-indigo-50/40 border-indigo-100/50" : (isNightMode ? "border-white/10 hover:bg-white/10" : "border-gray-100/50 hover:bg-white/60 hover:shadow-sm"),
          !shouldVanish && "rounded-xl",
          task.status === 'done' && !isSyncing && "opacity-50 grayscale",
          shouldVanish && "animate-vanish z-10"
        )}
        style={{ paddingLeft: `${task.indent * 1.5 + 0.2}rem` }}
      >
        {/* 左側：ドラッグハンドル */}
        <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-30 hover:!opacity-100 transition-opacity mr-1 mt-0.5">
          <GripVertical className="w-4 h-4" />
        </div>

        {/* 左側：チェックボックス */}
        <button onClick={() => onToggle && onToggle(task.id)} disabled={isSyncing} className="mr-3 mt-0.5 transition-colors group-hover:scale-110 active:scale-95 disabled:cursor-not-allowed shrink-0">
          {task.status === 'done' ? (
            <CheckCircle2 className={clsx("w-5 h-5", shouldVanish ? "text-yellow-500" : "text-green-500")} />
          ) : (
            <Circle className={clsx("w-5 h-5", isNightMode ? "text-white/30 hover:text-white" : "text-gray-300 hover:text-blue-500")} />
          )}
        </button>

        {/* 中央〜右側：コンテンツラッパー */}
        <div className="flex-1 flex flex-col sm:flex-row sm:justify-between items-start gap-3 min-w-0">
          
          {/* 中央：タスクテキスト */}
          <div className="flex-1 min-w-0 w-full mt-0.5">
            {isEditing ? (
              <input
                autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} onBlur={handleEditSubmit}
                onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') handleEditSubmit(); if (e.key === 'Escape') { setEditText(task.text); setIsEditing(false); } }}
                className="w-full bg-transparent border-b border-orange-400 outline-none text-sm text-gray-800"
              />
            ) : (
              <span 
                onClick={() => setIsEditing(true)}
                className={clsx(
                  "text-sm font-medium transition-all cursor-text hover:bg-orange-100/50 px-1 -ml-1 rounded block break-words leading-relaxed", 
                  isNightMode ? "text-white/90" : "text-gray-800", 
                  task.status === 'done' && !isSyncing && "line-through opacity-70", 
                  shouldVanish && "text-yellow-400 font-bold"
                )}
                title="Click to edit"
              >
                {task.text}
              </span>
            )}
          </div>

          {/* 右側：バッジ（メタデータ）とホバーアクション */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
            
            {/* メタデータバッジ群 */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end mt-0.5">
              {/* ルーチンバッジ */}
              {isRoutine && (
                <span className="flex items-center text-[10px] font-bold text-indigo-500 bg-indigo-100/70 px-1.5 py-0.5 rounded-md shadow-sm border border-indigo-200" title="Routine Task">
                  <Repeat className="w-3 h-3 mr-1" />
                  {task.routineType === 'weekly' ? 'W' : 'D'}
                </span>
              )}

              {/* 見積もりバッジ */}
              {task.estimate && (
                <span className={clsx("px-1.5 py-0.5 text-[10px] font-bold rounded-md border", isNightMode ? "bg-blue-900/30 text-blue-300 border-blue-500/30" : "bg-slate-50 text-slate-500 border-slate-200")}>
                  {task.estimate}
                </span>
              )}

              {/* 期限バッジ */}
              {task.deadline && (
                <span className={clsx("flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md border shadow-sm", deadlineStatus === 'overdue' && "bg-red-100 text-red-600 border-red-200 animate-pulse", deadlineStatus === 'today' && "bg-orange-100 text-orange-600 border-orange-200", deadlineStatus === 'future' && (isNightMode ? "bg-white/10 text-gray-300 border-white/20" : "bg-slate-100 text-slate-500 border-slate-200 font-normal"))}>
                  <CalendarClock className="w-3 h-3" />
                  {task.deadline}
                </span>
              )}

              {/* 難易度（星）バッジ */}
              <button 
                type="button" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  if (onChangeDifficulty) onChangeDifficulty(task.id, task.difficulty); 
                }}
                className={clsx(
                  "flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black rounded-md border transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 z-10",
                  task.difficulty >= 5 ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-200" :
                  task.difficulty >= 3 ? "bg-amber-100 text-amber-600 border-amber-200 hover:bg-amber-200" :
                  "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                )}
                title="Click to change difficulty"
              >
                <Star className={clsx("w-3 h-3", task.difficulty >= 5 ? "fill-red-500" : task.difficulty >= 3 ? "fill-amber-500" : "fill-slate-400")} />
                {task.difficulty}
              </button>
            </div>

            {/* ホバーアクション群 */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/50 backdrop-blur-sm rounded-lg px-1">
              {onPromoteToRoutine && !isRoutine && task.status !== 'done' && (
                <button onClick={() => onPromoteToRoutine(task.text)} className="p-1.5 rounded-md hover:bg-indigo-100 text-gray-400 hover:text-indigo-500 transition-colors" title="Make it Daily Routine">
                  <Repeat className="w-4 h-4" />
                </button>
              )}
              {onAddSubTask && !isAddingSub && task.status !== 'done' && (
                <button onClick={() => setIsAddingSub(true)} className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-orange-500 transition-colors" title="Add sub-task">
                  <CornerDownRight className="w-4 h-4" />
                </button>
              )}
              {onUpdateDeadline && task.status !== 'done' && (
                <div className="relative p-1.5 hover:bg-gray-200 rounded-md text-gray-400 hover:text-purple-600 cursor-pointer" title="Set Deadline">
                  <Calendar className="w-4 h-4" />
                  <input type="date" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => e.target.value && onUpdateDeadline(task.id, e.target.value)} />
                </div>
              )}
              {onDeleteTask && (
                <button onClick={() => onDeleteTask(task.id)} className="p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors" title="Delete task">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>

        {isAddingSub && (
          <div className="flex items-center gap-2 py-2 pr-4 animate-fadeIn mt-2 w-full" style={{ paddingLeft: `${(task.indent + 1) * 1.5 + 1.5}rem` }}>
            <CornerDownRight className="w-4 h-4 text-gray-300" />
            <input autoFocus type="text" value={subText} onChange={(e) => setSubText(e.target.value)} onKeyDown={(e) => { if (e.nativeEvent.isComposing) return; if (e.key === 'Enter') handleSubSubmit(); if (e.key === 'Escape') setIsAddingSub(false); }} placeholder="What needs to be done?" className="flex-1 bg-transparent border-b border-gray-300 focus:border-orange-400 outline-none text-sm py-1" />
            <button onClick={handleSubSubmit} className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600"><Plus className="w-4 h-4" /></button>
            <button onClick={() => setIsAddingSub(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};