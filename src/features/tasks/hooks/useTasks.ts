import { useState, useEffect, useCallback } from 'react';
import { type Task } from '../types';

export const useTasks = (readFile: any, writeFile: any, isReady: boolean) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const updateTasksAndSave = useCallback(async (newTasks: Task[]) => {
    setTasks(newTasks);
    await writeFile('tasks.json', JSON.stringify(newTasks, null, 2));
  }, [writeFile]);

  // 初期ロード
  useEffect(() => {
    const load = async () => {
      if (isReady) {
        const content = await readFile('tasks.json');
        if (content) setTasks(JSON.parse(content));
      }
    };
    load();
  }, [isReady, readFile]);

  const addTask = (text: string, parentId: string | null = null) => {
    const newTask: Task = {
      id: `task-${Date.now()}`, text, status: 'todo', parentId,
      order: tasks.filter(t => t.parentId === parentId).length,
      difficulty: 2, createdAt: Date.now()
    };
    updateTasksAndSave([...tasks, newTask]);
  };

  const toggleTask = (id: string) => {
    updateTasksAndSave(tasks.map(t => t.id === id ? { ...t, status: t.status === 'todo' ? 'done' : 'todo' } : t));
  };

  const updateTaskText = (id: string, text: string) => {
    updateTasksAndSave(tasks.map(t => t.id === id ? { ...t, text } : t));
  };

  const deleteTask = (id: string) => {
    const idsToDelete = new Set([id]);
    const findChildren = (pid: string) => {
      tasks.forEach(t => { if (t.parentId === pid) { idsToDelete.add(t.id); findChildren(t.id); } });
    };
    findChildren(id);
    updateTasksAndSave(tasks.filter(t => !idsToDelete.has(t.id)));
  };

  const updateDeadline = (id: string, deadline: string) => {
    updateTasksAndSave(tasks.map(t => t.id === id ? { ...t, deadline } : t));
  };

  const moveTask = (dragId: string, dropId: string) => {
    if (dragId === dropId) return;
    const dragIndex = tasks.findIndex(t => t.id === dragId);
    const dropIndex = tasks.findIndex(t => t.id === dropId);
    const newTasks = [...tasks];
    const [removed] = newTasks.splice(dragIndex, 1);
    removed.parentId = tasks[dropIndex].parentId;
    newTasks.splice(dropIndex, 0, removed);
    updateTasksAndSave(newTasks.map((t, i) => ({ ...t, order: i })));
  };

  return { 
    tasks, 
    addTask, 
    toggleTask, 
    updateTaskText, 
    deleteTask, 
    updateDeadline, 
    moveTask,
    updateTasksAndSave 
  };
};