import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { parseMarkdown } from '../utils/parser';
import { getNextDifficulty } from '../logic/taskLogic';

export const useTasks = (
  initialInput: string,
  writeFile: (filename: string, content: string) => Promise<void>
) => {
  const [input, setInput] = useState<string>(initialInput);
  const [tasks, setTasks] = useState<Task[]>([]);

  // 入力が変わるたびにパースを実行 (1機能: 同期処理)
  useEffect(() => {
    const result = parseMarkdown(input);
    setTasks(result.tasks);
  }, [input]);

  // ファイル保存を伴う入力更新
  const updateInputAndSave = async (newContent: string) => {
    setInput(newContent);
    await writeFile('current_active_todo.md', newContent);
  };

  // タスクのステータスをトグル (1機能: 状態反転ロジック)
  const toggleTask = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return null;

    const lines = input.split('\n');
    const idx = targetTask.lineNumber - 1;
    const isCurrentlyTodo = targetTask.status === 'todo';

    // 対象行と子タスク（インデント）のステータスを更新
    // ※ロジックの詳細はApp.tsxから移植
    lines[idx] = isCurrentlyTodo 
      ? lines[idx].replace(/- \[[ \] ]\]/g, '- [x]') 
      : lines[idx].replace(/- \[[xX]\]/g, '- [ ]');

    const newContent = lines.join('\n');
    await updateInputAndSave(newContent);
    
    return { targetTask, isChecking: isCurrentlyTodo };
  };

  // 難易度の変更 (1機能: 難易度更新ロジック)
  const changeTaskDifficulty = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const nextDiff = getNextDifficulty(targetTask.difficulty);
    const lines = input.split('\n');
    const idx = targetTask.lineNumber - 1;

    if (lines[idx] !== undefined) {
      let line = lines[idx].replace(/\(★\d+\)\s*/g, '').trimEnd();
      lines[idx] = `${line} (★${nextDiff})`;
      await updateInputAndSave(lines.join('\n'));
    }
  };

  // タスクの削除
  const deleteTask = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const lines = input.split('\n');
    lines.splice(targetTask.lineNumber - 1, 1); // 簡易実装版
    await updateInputAndSave(lines.join('\n'));
  };

  return {
    input,
    setInput,
    tasks,
    toggleTask,
    changeTaskDifficulty,
    deleteTask,
    updateInputAndSave
  };
};