import React, { useState } from 'react';
import { type Task } from '../types';
import { CheckCircle2, Circle, CalendarClock, Calendar, CornerDownRight, Plus } from 'lucide-react'; // アイコン追加
import { clsx } from 'clsx';

interface Props {
  task: Task;
  isSyncing?: boolean;
  onUpdateDeadline?: (id: string, date: string) => void;
  onToggle?: (id: string) => void;
  isNightMode?: boolean;
  // ★追加：子タスク追加関数を受け取る
  onAddSubTask?: (parentId: string, text: string) => void;
}

export const TaskRow: React.FC<Props> = ({ task, isSyncing = false, onUpdateDeadline, onToggle, isNightMode = false, onAddSubTask }) => {
  const shouldVanish = isSyncing && task.status === 'done';
  
  // 入力モードかどうかのState
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [subText, setSubText] = useState("");

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
    if (onAddSubTask && subText) {
      onAddSubTask(task.id, subText);
      setSubText("");
      setIsAddingSub(false);
    }
  };

  return (
    // 全体を包むdiv（入力フォームを含めるためにflex-colにはしないが、構成を変える）
    <div className="flex flex-col">
      <div 
        className={clsx(
          "relative flex items-center py-2 px-3 border-b transition-all duration-300 group overflow-visible", // overflow-visibleに変更
          isNightMode ? "border-white/10 hover:bg-white/10" : "border-gray-100/50 hover:bg-white/60 hover:shadow-sm",
          !shouldVanish && "rounded-xl",
          task.status === 'done' && !isSyncing && "opacity-50 grayscale",
          shouldVanish && "animate-vanish z-10"
        )}
        style={{ paddingLeft: `${task.indent * 1.5 + 0.75}rem` }} // インデント調整
      >
        {/* チェックボックス */}
        <button 
          onClick={() => onToggle && onToggle(task.id)}
          disabled={isSyncing}
          className="mr-3 transition-colors group-hover:scale-110 active:scale-95 disabled:cursor-not-allowed"
        >
          {task.status === 'done' ? (
            <CheckCircle2 className={clsx("w-5 h-5", shouldVanish ? "text-yellow-500" : "text-green-500")} />
          ) : (
            <Circle className={clsx("w-5 h-5", isNightMode ? "text-white/30 hover:text-white" : "text-gray-300 hover:text-blue-500")} />
          )}
        </button>

        <div className="flex-1 flex flex-wrap items-center gap-2">
          <span className={clsx(
            "text-sm font-medium transition-all cursor-text",
            isNightMode ? "text-white/90" : "text-gray-800",
            task.status === 'done' && !isSyncing && "line-through opacity-70",
            shouldVanish && "text-yellow-400 font-bold"
          )}>
            {task.text}
          </span>

          {/* バッジ類（既存のまま） */}
          {task.estimate && (
            <span className={clsx(
              "px-2 py-0.5 text-xs rounded-md border",
              isNightMode ? "bg-blue-900/30 text-blue-300 border-blue-500/30" : "bg-blue-50 text-blue-600 border-blue-100/50"
            )}>
              {task.estimate}
            </span>
          )}

          {task.deadline && (
            <span className={clsx(
              "flex items-center gap-1 px-2 py-0.5 text-xs rounded-md border font-bold shadow-sm",
              deadlineStatus === 'overdue' && "bg-red-100 text-red-600 border-red-200 animate-pulse",
              deadlineStatus === 'today' && "bg-orange-100 text-orange-600 border-orange-200",
              deadlineStatus === 'future' && (isNightMode ? "bg-white/10 text-gray-300 border-white/20" : "bg-gray-100 text-gray-500 border-gray-200 font-normal")
            )}>
              <CalendarClock className="w-3 h-3" />
              {task.deadline}
            </span>
          )}

          {/* --- ここから右側の操作エリア --- */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
             {/* ★ 新機能：子タスク追加ボタン */}
             {onAddSubTask && !isAddingSub && task.status !== 'done' && (
              <button 
                onClick={() => setIsAddingSub(true)}
                className="p-1.5 rounded-md hover:bg-gray-200 text-gray-400 hover:text-orange-500 transition-colors"
                title="Add sub-task"
              >
                <CornerDownRight className="w-4 h-4" />
              </button>
            )}

            {/* 締め切り設定（既存） */}
            {onUpdateDeadline && task.status !== 'done' && (
              <div className="relative p-1.5 hover:bg-gray-200 rounded-md text-gray-400 hover:text-purple-600 cursor-pointer">
                <Calendar className="w-4 h-4" />
                <input 
                  type="date" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  onChange={(e) => e.target.value && onUpdateDeadline(task.id, e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ★ 子タスク入力フォーム（ボタンを押した時だけ出現） */}
        {isAddingSub && (
          <div 
            className="flex items-center gap-2 py-2 pr-4 animate-fadeIn"
            style={{ paddingLeft: `${(task.indent + 1) * 1.5 + 2.5}rem` }} // 親より深くインデント
          >
            <CornerDownRight className="w-4 h-4 text-gray-300" />
            <input
              autoFocus
              type="text"
              value={subText}
              onChange={(e) => setSubText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubSubmit();
                if (e.key === 'Escape') setIsAddingSub(false);
              }}
              placeholder="What needs to be done?"
              className="flex-1 bg-transparent border-b border-gray-300 focus:border-orange-400 outline-none text-sm py-1"
            />
            <button 
              onClick={handleSubSubmit}
              className="p-1 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsAddingSub(false)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

    </div>
  );
};