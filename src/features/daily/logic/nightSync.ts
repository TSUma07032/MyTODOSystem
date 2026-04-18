import { format } from 'date-fns';
import { tasksToMarkdown } from '../utils/markdownUtils';
import type { Task } from '@/features/tasks/types';

/**
 * 1日の終わりにタスクを整理し、履歴を生成します。
 */
export const performNightSync = (allTasks: Task[]) => {
  const now = new Date();
  const datePath = [format(now, 'yyyy'), format(now, 'MM')];
  const fileName = `${format(now, 'yyyy-MM-dd_HH-mm')}.md`;

  const doneTasks = allTasks.filter(t => t.status === 'done');
  const todoTasks = allTasks.filter(t => t.status !== 'done');

  // 履歴用のマークダウンを生成
  const historyContent = `# Completed on ${format(now, 'yyyy-MM-dd HH:mm')}\n\n` + 
                        tasksToMarkdown(doneTasks);

  return {
    doneTasks,
    todoTasks,
    historyContent,
    fileName,
    datePath
  };
};