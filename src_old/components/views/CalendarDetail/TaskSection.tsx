// src/components/views/CalendarDetail/TaskSection.tsx
import React, { useState } from 'react';
import { Coffee, CheckCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { isBefore, startOfDay } from 'date-fns';
import type { Task } from '../../../types';

interface TaskSectionProps {
  tasks: Task[];
  selectedDay: Date;
  onToggleTask: (id: string) => void;
}

export const TaskSection: React.FC<TaskSectionProps> = ({ tasks, selectedDay, onToggleTask }) => {
  const today = startOfDay(new Date());

  // 📂 閉じている親タスクのIDを記録するステート
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // 開閉を切り替える関数
  const toggleCollapse = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 親要素へのクリックイベント伝播を防ぐ
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // 🔍 判定ロジック群
  const hasChildren = (taskId: string) => tasks.some(t => t.parentId === taskId);

  const isVisible = (task: Task) => {
    let currentParentId = task.parentId;
    // 親を辿っていき、どこかの親が「閉じられている(collapsedIdsに含まれる)」なら非表示
    while (currentParentId) {
      if (collapsedIds.has(currentParentId)) return false;
      const parent = tasks.find(t => t.id === currentParentId);
      currentParentId = parent ? parent.parentId : null;
    }
    return true;
  };

  const getIndent = (task: Task): number => {
    let indent = 0;
    let currentParentId = task.parentId;
    // 親の数を数えてインデントの深さを決める
    while (currentParentId) {
      indent++;
      const parent = tasks.find(t => t.id === currentParentId);
      currentParentId = parent ? parent.parentId : null;
    }
    return indent;
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-400 opacity-60">
        <Coffee className="w-10 h-10 mb-3 text-emerald-200" />
        <p className="font-bold text-sm">No tasks planned.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pb-6">
      <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-2">
        <CheckCircle className="w-4 h-4" /> Tasks
      </h4>
      <div className="space-y-1.5">
        {tasks.filter(isVisible).map(task => {
          const isDone = task.status === 'done';
          const isOverdue = !isDone && isBefore(selectedDay, today);
          const indent = getIndent(task);
          const hasChild = hasChildren(task.id);
          const isCollapsed = collapsedIds.has(task.id);

          return (
            <div 
              key={task.id} 
              className={`group relative p-2.5 rounded-xl border transition-all hover:shadow-sm ${
                isDone ? "bg-slate-50 border-transparent opacity-70" : "bg-white border-emerald-50 shadow-sm"
              }`} 
              style={{ marginLeft: `${indent * 20}px` }} // 階層に応じた字下げ
            >
              <div className="flex items-start gap-1.5">
                
                {/* 🔽 開閉トグルアイコン（子タスクがある場合のみ表示） */}
                <div className="w-5 flex justify-center mt-0.5 shrink-0">
                  {hasChild && (
                    <button 
                      onClick={(e) => toggleCollapse(task.id, e)} 
                      className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded p-0.5 transition-colors"
                    >
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* ✅ 完了チェックボタン */}
                <button 
                  onClick={() => onToggleTask(task.id)} 
                  className={`mt-0.5 flex-shrink-0 transition-transform hover:scale-110 active:scale-95 ${
                    isDone ? "text-emerald-500" : isOverdue ? "text-red-400" : "text-slate-300 hover:text-emerald-400"
                  }`}
                >
                  {isDone ? <CheckCircle className="w-5 h-5" /> : isOverdue ? <AlertCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                </button>
                
                {/* 📝 タスクテキスト */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-sm font-bold leading-snug break-words ${isDone ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {task.text}
                  </p>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};