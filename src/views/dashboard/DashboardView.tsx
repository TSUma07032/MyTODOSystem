import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { TaskRow } from '@/features/tasks/components/TaskRow';
import { useTasks } from '@/features/tasks/store/useTasks';
import { getTaskIndent } from '@/features/tasks/logic/taskHierarchy';

export const DashboardView: React.FC = () => {
  // 🚀 Storeからタスクと追加関数を直接取得！
  const { tasks, addTask } = useTasks();
  
  const [newTaskText, setNewTaskText] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isTaskVisible = (task: any) => {
    if (!task.parentId) return true;
    let currentParentId: string | null = task.parentId;
    while (currentParentId) {
      if (!expandedIds.has(currentParentId)) return false;
      const parent = tasks.find(t => t.id === currentParentId);
      currentParentId = parent?.parentId || null;
    }
    return true;
  };

  const handleAddNewTask = () => {
    if (!newTaskText.trim()) return;
    addTask({
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      status: 'todo',
      parentId: null,
      order: Date.now(),
      difficulty: 2,
    });
    setNewTaskText("");
  };

  return (
    <div className="animate-fadeIn space-y-2 pb-10 max-w-4xl mx-auto mt-8 px-4">
      
      <div className="mb-6 flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-dashed border-gray-300 focus-within:bg-white focus-within:border-orange-300 focus-within:shadow-sm transition-all">
        <Plus className="w-5 h-5 text-gray-400" />
        <input 
          type="text" 
          value={newTaskText} 
          onChange={(e) => setNewTaskText(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleAddNewTask()} 
          placeholder="Add a new mission..." 
          className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400" 
        />
      </div>

      {tasks
        .filter(t => t.routineType !== 'daily' && isTaskVisible(t)) 
        .map((task) => {
          const hasChildren = tasks.some(child => child.parentId === task.id);
          return (
            <TaskRow 
              key={task.id} 
              task={task} 
              indent={getTaskIndent(task.id, tasks)}
              hasChildren={hasChildren}
              isExpanded={expandedIds.has(task.id)}
              onToggleExpand={() => toggleExpand(task.id)}
            />
          );
        })}
    </div>
  );
};