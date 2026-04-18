import React, { useState } from 'react';
import { useTasks } from '../../features/tasks/hooks/useTasks';
import { TaskRow } from '../../features/tasks/components/TaskRow';
import { getSortedTasks, isTaskVisible, getTaskIndent } from '../../features/tasks/logic/taskLogic';
import { usePomodoroQueue } from '../../features/pomodoro/hooks/usePomodoroQueue';

export const DashboardView = ({ readFile, writeFile, isReady }: any) => {
  // 全ての操作関数を取得
  const { 
    tasks, 
    addTask, 
    toggleTask, 
    updateTaskText, 
    deleteTask, 
    updateDeadline, 
    moveTask 
  } = useTasks(readFile, writeFile, isReady);

  // ポモドーロキューへの追加機能（任意で追加）
  const { addToQueue } = usePomodoroQueue(null);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newTaskText, setNewTaskText] = useState("");

  const handleAddNewTask = () => {
    if (!newTaskText.trim()) return;
    addTask(newTaskText);
    setNewTaskText("");
  };

  return (
    <div className="max-w-4xl mx-auto p-8 overflow-y-auto h-full pb-32">
      <h1 className="text-3xl font-black mb-8 text-slate-800 tracking-tight">Missions</h1>
      
      <div className="space-y-1">
        {getSortedTasks(tasks)
          .filter(t => isTaskVisible(t, tasks, expandedIds))
          .map(task => (
            <TaskRow 
              key={task.id} 
              task={task} 
              indent={getTaskIndent(task.id, tasks)}
              hasChildren={tasks.some(c => c.parentId === task.id)}
              isExpanded={expandedIds.has(task.id)}
              onToggleExpand={() => setExpandedIds(prev => {
                const next = new Set(prev);
                next.has(task.id) ? next.delete(task.id) : next.add(task.id);
                return next;
              })}
              // ここですべての必須関数を渡す
              onToggle={toggleTask}
              onUpdateText={updateTaskText}
              onDeleteTask={deleteTask}
              onAddSubTask={addTask}
              onUpdateDeadline={updateDeadline}
              onMoveTask={moveTask}
              onAddToQueue={addToQueue} // Pomodoro連携
            />
          ))}
      </div>

      {/* フッター追加入力 */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-4">
        <div className="flex items-center gap-3 p-4 bg-white/80 backdrop-blur shadow-xl rounded-2xl border border-orange-100">
          <input 
            type="text" 
            value={newTaskText} 
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddNewTask()}
            placeholder="新しいタスク..." 
            className="flex-1 bg-transparent outline-none text-sm font-bold" 
          />
        </div>
      </div>
    </div>
  );
};