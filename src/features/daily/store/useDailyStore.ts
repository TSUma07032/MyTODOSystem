import { useState, useCallback } from 'react';
import { useFileSystem } from '@/core/hooks/useFileSystem';
import { performNightSync } from '../logic/nightSync';
import { useTasks } from '@/features/tasks/store/useTasks';

export const useDailyStore = () => {
  const [completedDailyIds, setCompletedDailyIds] = useState<string[]>([]);
  const { writeFile, saveDeepFile, appendToJsonArray } = useFileSystem();
  const { tasks, initTasks } = useTasks();

  // 習慣のチェック切り替え
  const toggleDaily = useCallback((id: string) => {
    setCompletedDailyIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  // 🚀 ナイトシンク（1日の締め）の実行
  const finishDay = async () => {
    const { todoTasks, doneTasks, historyContent, fileName, datePath } = performNightSync(tasks);

    // 1. 完了タスクを深い階層のMDとして保存
    await saveDeepFile(datePath, fileName, historyContent);

    // 2. 検索用のインデックスJSONに追記
    await appendToJsonArray('history_index.json', doneTasks.map(t => ({
      id: t.id,
      text: t.text,
      completedAt: new Date().toISOString(),
      fileName,
      datePath
    })));

    // 3. アクティブなタスクを「未完了のみ」に更新
    initTasks(todoTasks);
    await writeFile('current_active_todo.json', JSON.stringify(todoTasks, null, 2));

    // 4. デイリーチェックをリセット
    setCompletedDailyIds([]);
    await writeFile('daily_progress.json', JSON.stringify({
      lastCheckDate: format(new Date(), 'yyyy-MM-dd'),
      completedDailyIds: []
    }));
  };

  return { completedDailyIds, toggleDaily, finishDay, setCompletedDailyIds };
};