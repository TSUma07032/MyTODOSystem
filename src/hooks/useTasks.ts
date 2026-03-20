// src/hooks/useTasks.ts
import { useState } from 'react';
import type { Task } from '../types';

export const useTasks = (
  writeFile: (filename: string, content: string) => Promise<void>
) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  // ※文字列の `input` はもう不要なので消し去りました！

  // ✅ 共通の保存関数：Task配列を更新し、そのままJSONとして保存する
  const updateTasksAndSave = async (newTasks: Task[]) => {
    setTasks(newTasks);
    await writeFile('current_active_todo.json', JSON.stringify(newTasks, null, 2));
  };

  // ✅ 1. タスクの完了状態トグル
  const toggleTaskStatus = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return null;

    const isCurrentlyTodo = targetTask.status === 'todo';
    const newStatus = isCurrentlyTodo ? 'done' : 'todo';
    
    // 子タスクも巻き込んで反転させるためのIDリストを作成
    const idsToToggle = new Set([taskId]);
    // フラット配列なので、parentIdがこのIDを指しているものを探す
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

    await updateTasksAndSave(newTasks);
    return { isCurrentlyTodo, toggledTasks }; 
  };

  // ✅ 2. 難易度変更
  const changeDifficulty = async (taskId: string, currentDiff: number) => {
    const nextDiff = currentDiff >= 5 ? 1 : currentDiff + 1;
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, difficulty: nextDiff } : t);
    await updateTasksAndSave(newTasks);
  };

  // ✅ 3. 期限の更新
  const updateDeadline = async (taskId: string, newDate: string) => {
    const [_, m, d] = newDate.split('-');
    const newDeadline = `${Number(m)}/${Number(d)}`;
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, deadline: newDeadline } : t);
    await updateTasksAndSave(newTasks);
  };

  // ✅ 4. テキストの更新
  const updateTaskText = async (taskId: string, newText: string) => {
    const newTasks = tasks.map(t => t.id === taskId ? { ...t, text: newText } : t);
    await updateTasksAndSave(newTasks);
  };

  // ✅ 5. タスクの削除（子タスクも巻き込んで削除）
  const deleteTask = async (taskId: string) => {
    // 自分自身と、自分を親に持つタスクをフィルタリングして除外
    const newTasks = tasks.filter(t => t.id !== taskId && t.parentId !== taskId);
    await updateTasksAndSave(newTasks);
  };

  // ✅ 6. サブタスクの追加
  const addSubTask = async (parentId: string, text: string) => {
    if (!text.trim()) return;
    const parentIndex = tasks.findIndex(t => t.id === parentId);
    if (parentIndex === -1) return;

    const newTask: Task = {
      id: `task-${Date.now()}`, // 行番号ではなくタイムスタンプ等の一意なIDに！
      text: text,
      status: 'todo',
      parentId: parentId, // ここで親を指定するだけ！
      order: tasks.length,
      difficulty: 2
    };

    // 親のすぐ下に挿入する（配列の途中に差し込む）
    const newTasks = [...tasks];
    newTasks.splice(parentIndex + 1, 0, newTask);
    
    // orderを振り直す
    newTasks.forEach((t, i) => t.order = i);
    await updateTasksAndSave(newTasks);
  };

  // ✅ 7. ドラッグ＆ドロップによる移動 (※一旦シンプルに並び順だけ入れ替えるロジックに)
  // src/hooks/useTasks.ts 内の省略していた moveTask を上書き！

  const moveTask = async (dragTaskId: string, dropTaskId: string) => {
    if (dragTaskId === dropTaskId) return;

    // 1. ドラッグ対象と「そのすべての子孫タスク」のIDリストを取得
    const getDescendants = (parentId: string): string[] => {
      const children = tasks.filter(t => t.parentId === parentId).map(t => t.id);
      return [...children, ...children.flatMap(getDescendants)];
    };
    const dragTaskIds = [dragTaskId, ...getDescendants(dragTaskId)];

    // 2. 動かすタスク群と、残るタスク群に配列を分離する
    const movingTasks = tasks.filter(t => dragTaskIds.includes(t.id));
    const remainingTasks = tasks.filter(t => !dragTaskIds.includes(t.id));

    // 3. ドロップ先のインデックスを探す
    const dropIndex = remainingTasks.findIndex(t => t.id === dropTaskId);
    if (dropIndex === -1) return;

    // 4. 木構造の修復：ドロップ先と同じ階層（兄弟）になるように親IDを書き換える
    const dropTask = tasks.find(t => t.id === dropTaskId);
    const rootMovingTask = movingTasks.find(t => t.id === dragTaskId);
    if (rootMovingTask && dropTask) {
      rootMovingTask.parentId = dropTask.parentId;
    }

    // 5. 配列を再結合して、指定位置に割り込ませる！
    const newTasks = [
      ...remainingTasks.slice(0, dropIndex),
      ...movingTasks,
      ...remainingTasks.slice(dropIndex)
    ];

    // 6. 最後に order（表示順）を綺麗に振り直す
    newTasks.forEach((t, i) => t.order = i);

    await updateTasksAndSave(newTasks);
  };

  // ✅ 8. 新規タスク追加
  const addNewTask = async (newTaskText: string) => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText,
      status: 'todo',
      parentId: null, // ルートタスクなのでnull
      order: tasks.length,
      difficulty: 2
    };
    const newTasks = [...tasks, newTask];
    await updateTasksAndSave(newTasks);
  };

  // ✅ 9. 作業時間の追加
  const addWorkTime = async (taskId: string, minutes: number) => {
    const newTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, totalWorkTime: (t.totalWorkTime || 0) + minutes };
      }
      return t;
    });
    await updateTasksAndSave(newTasks);
  };

  // 10. 作業時間の直接上書き（手動編集用）
  const setWorkTime = async (taskId: string, minutes: number) => {
    const newTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, totalWorkTime: minutes };
      }
      return t;
    });
    await updateTasksAndSave(newTasks);
  };

  return {
    tasks,
    setTasks, 
    toggleTaskStatus,
    changeDifficulty,
    updateDeadline,
    updateTaskText,
    deleteTask,
    addSubTask,
    moveTask,
    addNewTask,
    updateTasksAndSave ,
    addWorkTime,
    setWorkTime
  };
};