// src/stores/useTasks.ts
import { useState } from 'react';
import type { Task } from '../types';
import { taskRepository } from '../repositories/TauriTaskRepository';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);

  // 内部用のヘルパー関数：Stateを更新しつつ、リポジトリに保存を「予約」する
  const updateAndSave = (newTasks: Task[]) => {
    setTasks(newTasks);
    taskRepository.saveTasks(newTasks); // 2秒後にネイティブ保存される（Debounce）
  };

  const toggleTaskStatus = (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return { isCurrentlyTodo: false, toggledTasks: [] };

    const isCurrentlyTodo = targetTask.status === 'todo';
    const newStatus = isCurrentlyTodo ? 'done' : 'todo';
    
    const idsToToggle = new Set([taskId]);
    tasks.forEach(t => {
      if (t.parentId === taskId) idsToToggle.add(t.id);
    });

    const toggledTasks: Task[] = [];
    const newTasks = tasks.map(t => {
      if (idsToToggle.has(t.id)) {
        const updatedTask = { ...t, status: newStatus as 'todo' | 'done' };
        toggledTasks.push(updatedTask);
        return updatedTask;
      }
      return t;
    });

    updateAndSave(newTasks);
    return { isCurrentlyTodo, toggledTasks }; 
  };

  const addNewTask = (newTaskText: string) => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText,
      status: 'todo',
      parentId: null,
      order: tasks.length,
      difficulty: 2
    };
    updateAndSave([...tasks, newTask]);
  };

  

  return {
    tasks,
    setTasks, 
    toggleTaskStatus,
    addNewTask,
    
  };
};