import React from 'react';
import { usePomodoro } from '../../features/pomodoro/hooks/usePomodoro';
import { usePomodoroQueue } from '../../features/pomodoro/hooks/usePomodoroQueue';
import { useTasks } from '../../features/tasks/hooks/useTasks';

interface PomodoroViewProps {
    readFile: (filename: string) => Promise<string | null>;
    writeFile: (filename: string, content: string) => Promise<void>;
    isReady: boolean; 
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({ readFile, writeFile, isReady }) => {
  const { tasks, updateTasksAndSave } = useTasks(readFile, writeFile, isReady);

  // 作業時間の保存ロジック（Task Featureのデータを更新）
  const handleAddWorkTime = async (taskId: string, minutes: number) => {
    const newTasks = tasks.map(t => 
      t.id === taskId ? { ...t, totalWorkTime: (t.totalWorkTime || 0) + minutes } : t
    );
    await updateTasksAndSave(newTasks);
  };

  const pomodoro = usePomodoro(handleAddWorkTime, (msg) => {
    // トースト通知を表示（本来はGlobalなToastHookを呼ぶ）
    console.log(msg);
  });

  const { queue, removeFromQueue } = usePomodoroQueue(pomodoro.taskId);

  return (
    <div className="h-full flex flex-col lg:flex-row p-6 gap-6">
      {/* 左：タイマーエリア（メイン） */}
      <div className="flex-1 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-sm flex flex-col items-center justify-center p-10">
        {/* TimerDisplayなどのコンポーネントをここに配置 */}
        <h2 className="text-slate-400 font-black uppercase tracking-widest text-sm mb-4">Focus Mode</h2>
        <div className="text-8xl font-mono font-black text-orange-500 tracking-tighter">
          {/* 残り時間の表示ロジック */}
          25:00
        </div>
      </div>

      {/* 右：キューエリア */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="flex-1 bg-slate-900/5 rounded-[2.5rem] border border-slate-200/50 flex flex-col p-6">
          <h3 className="font-bold text-slate-500 mb-4 px-2">Focus Queue</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {queue.map(id => {
              const task = tasks.find(t => t.id === id);
              return task ? (
                <div key={id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-700 flex justify-between">
                  {task.text}
                  <button onClick={() => removeFromQueue(id)} className="text-slate-300 hover:text-red-500">×</button>
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};