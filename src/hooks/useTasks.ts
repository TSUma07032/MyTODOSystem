// src/hooks/useTasks.ts
import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { parseMarkdown } from '../utils/parser';

export const useTasks = (
  initialInput: string,
  writeFile: (filename: string, content: string) => Promise<void>
) => {
  const [input, setInput] = useState<string>(initialInput);
  const [tasks, setTasks] = useState<Task[]>([]);

  // 外部（ファイル読み込みなど）から initialInput が変更された場合に同期する
  useEffect(() => {
    setInput(initialInput);
  }, [initialInput]);

  // 入力が変わるたびにパースを実行
  useEffect(() => {
    const result = parseMarkdown(input);
    setTasks(result.tasks);
  }, [input]);

  const updateInputAndSave = async (newContent: string) => {
    setInput(newContent);
    await writeFile('current_active_todo.md', newContent);
  };

  // ✅ 1. タスクの完了状態トグル（子タスクも連動）
  // ※コイン計算は関心事が異なるため、呼び出し元（App.tsx側）で行う想定にして、トグルしたタスク群を返します。
  const toggleTaskStatus = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return null;

    const lines = input.split('\n');
    const idx = targetTask.lineNumber - 1;
    const targetIndent = targetTask.indent;
    const taskIndicesToToggle = [idx];

    for (let i = idx + 1; i < lines.length; i++) {
      const match = lines[i].match(/^(\s*)-\s\[/);
      if (match && Math.floor(match[1].length / 2) > targetIndent) taskIndicesToToggle.push(i);
      else if (!match) break;
      else break;
    }

    const isCurrentlyTodo = targetTask.status === 'todo';
    const toggledTasks: Task[] = [];

    taskIndicesToToggle.forEach(i => {
      const t = tasks.find(tsk => tsk.lineNumber === i + 1);
      if (t) toggledTasks.push(t);
      if (lines[i]) {
        lines[i] = isCurrentlyTodo ? lines[i].replace(/- \[[ \] ]\]/g, '- [x]') : lines[i].replace(/- \[[xX]\]/g, '- [ ]');
      }
    });

    await updateInputAndSave(lines.join('\n'));
    return { isCurrentlyTodo, toggledTasks }; // コイン計算用に返す
  };

  // ✅ 2. 難易度変更
  const changeDifficulty = async (taskId: string, currentDiff: number) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;
    const nextDiff = currentDiff >= 5 ? 1 : currentDiff + 1;
    const lines = input.split('\n');
    const idx = targetTask.lineNumber - 1;

    if (lines[idx] !== undefined) {
      let line = lines[idx].replace(/\(★\d+\)\s*/g, '').trimEnd();
      const routineMatch = line.match(/\((daily|weekly):[-\w]+\)/);
      if (routineMatch) {
          line = line.replace(routineMatch[0], '').trimEnd();
          line = `${line} (★${nextDiff}) ${routineMatch[0]}`;
      } else {
          line = `${line} (★${nextDiff})`;
      }
      lines[idx] = line;
      await updateInputAndSave(lines.join('\n'));
    }
  };

  // ✅ 3. 期限の更新
  const updateDeadline = async (taskId: string, newDate: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;
    const [_, m, d] = newDate.split('-');
    const deadlineTag = `(@${Number(m)}/${Number(d)})`;
    const lines = input.split('\n');
    const targetLineIndex = targetTask.lineNumber - 1;

    if (lines[targetLineIndex]) {
      let line = lines[targetLineIndex];
      line = line.match(/\(@\d{1,2}\/\d{1,2}\)/) ? line.replace(/\(@\d{1,2}\/\d{1,2}\)/, deadlineTag) : `${line.trimEnd()} ${deadlineTag}`;
      lines[targetLineIndex] = line;
      await updateInputAndSave(lines.join('\n'));
    }
  };

  // ✅ 4. テキストの更新
  const updateTaskText = async (taskId: string, newText: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;
    const lines = input.split('\n');
    const idx = targetTask.lineNumber - 1;
    if (lines[idx]) {
      lines[idx] = lines[idx].replace(targetTask.text, newText);
      await updateInputAndSave(lines.join('\n'));
    }
  };

  // ✅ 5. タスクの削除（子タスクも巻き込んで削除）
  const deleteTask = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;
    const lines = input.split('\n');
    let removeCount = 1;
    for (let i = targetTask.lineNumber; i < lines.length; i++) {
      const match = lines[i].match(/^(\s*)-\s\[/);
      if (match && Math.floor(match[1].length / 2) > targetTask.indent) removeCount++;
      else break;
    }
    lines.splice(targetTask.lineNumber - 1, removeCount);
    await updateInputAndSave(lines.join('\n'));
  };

  // ✅ 6. サブタスクの追加
  const addSubTask = async (parentId: string, text: string) => {
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask || !text.trim()) return;
    const lines = input.split('\n');
    const parentIndex = parentTask.lineNumber - 1;
    if (lines[parentIndex] !== undefined) {
      lines.splice(parentIndex + 1, 0, `${"  ".repeat(parentTask.indent + 1)}- [ ] ${text}`);
      await updateInputAndSave(lines.join('\n'));
    }
  };

  // ✅ 7. ドラッグ＆ドロップによる移動
  const moveTask = async (dragTaskId: string, dropTaskId: string) => {
    if (dragTaskId === dropTaskId) return;
    const dragTask = tasks.find(t => t.id === dragTaskId);
    const dropTask = tasks.find(t => t.id === dropTaskId);
    if (!dragTask || !dropTask) return;
    
    const lines = input.split('\n');
    const dragIdx = dragTask.lineNumber - 1;
    let moveLines = [lines[dragIdx]];
    let removeCount = 1;
    
    for (let i = dragIdx + 1; i < lines.length; i++) {
      const match = lines[i].match(/^(\s*)-\s\[/);
      if (match && Math.floor(match[1].length / 2) > dragTask.indent) {
        moveLines.push(lines[i]);
        removeCount++;
      } else break;
    }
    
    const dropIdxOrig = dropTask.lineNumber - 1;
    if (dropIdxOrig >= dragIdx && dropIdxOrig < dragIdx + removeCount) return;
    
    lines.splice(dragIdx, removeCount);
    let newDropIdx = dropIdxOrig;
    if (dragIdx < dropIdxOrig) newDropIdx -= removeCount;
    
    const baseIndentDiff = dropTask.indent - dragTask.indent;
    const adjustedLines = moveLines.map(line => {
      const match = line.match(/^(\s*)/);
      const newSpacesCount = Math.max(0, (match ? match[1].length : 0) + baseIndentDiff * 2);
      return " ".repeat(newSpacesCount) + line.trimStart();
    });
    
    lines.splice(newDropIdx, 0, ...adjustedLines);
    await updateInputAndSave(lines.join('\n'));
  };

  // ✅ 8. 新規タスク追加
  const addNewTask = async (newTaskText: string) => {
    if (!newTaskText.trim()) return;
    const newContent = input + (input.endsWith('\n') ? '' : '\n') + `- [ ] ${newTaskText}`;
    await updateInputAndSave(newContent);
  };

  return {
    input,
    setInput,
    tasks,
    toggleTaskStatus,
    changeDifficulty,
    updateDeadline,
    updateTaskText,
    deleteTask,
    addSubTask,
    moveTask,
    addNewTask,
    updateInputAndSave
  };
};