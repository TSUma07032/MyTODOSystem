// src/components/views/PomodoroView.tsx
import React, { useState } from 'react';
import { Play, Square, Coffee, Snowflake, Plus, Trash2, Check } from 'lucide-react';
import type { Task } from '../../types';

interface PomodoroViewProps {
  pomodoro: any;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  queue: string[];
  onAddToQueue: (id: string) => void;
  onRemoveFromQueue: (id: string) => void;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({ pomodoro, tasks, onToggleTask, queue, onAddToQueue, onRemoveFromQueue }) => {
  
  // ダッシュボードから既存のタスクを検索して追加するためのステー
  const [searchQuery, setSearchQuery] = useState("");

  const formatTimeBig = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentTask = tasks.find(t => t.id === pomodoro.taskId);

  // キューの先頭のタスクでポモドーロを開始する
  const startNextInQueue = () => {
    if (queue.length > 0) {
      const nextId = queue[0];
      pomodoro.startWork(nextId);
      onRemoveFromQueue(nextId);
    }
  };

  const availableTasks = tasks.filter(t => 
    t.status !== 'done' && 
    t.routineType !== 'daily' && // デイリーを除外するかはお好みで
    !queue.includes(t.id) &&
    pomodoro.taskId !== t.id
  );

  // 検索結果（完了済みのものと、すでにキューにあるものは除く）
  const searchResults = searchQuery 
    ? availableTasks.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : availableTasks; // 検索文字がなければ全部出す！

  return (
    <div className="flex w-full h-full max-w-6xl mx-auto p-6 gap-6 animate-fadeIn">
      
      {/* 左側：Focus Queue（次にやるタスクリスト） */}
      <div className="w-1/3 flex flex-col bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/50 bg-white/50">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-500" />
            Focus Queue
          </h2>
        </div>
        
        {/* タスク検索＆追加エリア */}
        <div className="p-4 border-b border-white/50 flex flex-col h-1/2"> {/* 高さを半分ほど確保 */}
          <input
            type="text"
            placeholder="タスクを絞り込み..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // 🌟 変更: text-gray-800 を追加して文字色を黒く！ 🌟
            className="w-full px-3 py-2 rounded-lg bg-white/70 border-none outline-none focus:ring-2 focus:ring-orange-300 text-sm text-gray-800 font-medium placeholder-gray-400 mb-3"
          />
          
          {/* 🌟 変更: 常に一覧を表示（スクロール可能に） 🌟 */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {searchResults.map(t => (
              <button 
                key={t.id} onClick={() => onAddToQueue(t.id)}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-orange-100 text-gray-700 truncate border border-transparent hover:border-orange-200 transition-colors"
              >
                {t.text}
              </button>
            ))}
            {searchResults.length === 0 && (
              <p className="text-xs text-gray-400 text-center mt-4">追加できるタスクがありません</p>
            )}
          </div>
        </div>

        {/* キューのリスト */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-black/5">
          {queue.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-10">キューは空です</p>
          ) : (
            queue.map((id, index) => {
              const t = tasks.find(task => task.id === id);
              if (!t) return null;
              return (
                <div key={id} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white/50 shadow-sm group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-xs font-bold text-gray-400 w-4">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-700 truncate">{t.text}</span>
                  </div>
                  <button onClick={() => onRemoveFromQueue(id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 中央：Timer Panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white/30 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm p-10">
        
        {pomodoro.mode === 'idle' ? (
          <div className="text-center flex flex-col items-center">
            <Coffee className="w-20 h-20 text-gray-300 mb-6" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">準備完了</h2>
            <p className="text-gray-500 mb-8">キューからタスクを選んで集中を開始しましょう</p>
            <button 
              onClick={startNextInQueue}
              disabled={queue.length === 0}
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
              <Play className="w-6 h-6" />
              {queue.length > 0 ? "キューの先頭を開始" : "キューにタスクがありません"}
            </button>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center w-full max-w-md">
            {/* 現在のタスク名 */}
            <div className="mb-10 w-full p-6 bg-white/60 rounded-2xl shadow-sm border border-orange-100">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2 block">
                {pomodoro.mode === 'work' ? 'Now Focusing' : pomodoro.mode === 'break' ? 'Break Time' : 'Freezed'}
              </span>
              <h2 className="text-xl font-bold text-gray-800 break-words">
                {currentTask ? currentTask.text : "休憩中..."}
              </h2>
            </div>

            {/* 巨大タイマー */}
            <div className={`font-mono text-8xl font-black mb-12 tracking-tighter ${
              pomodoro.mode === 'work' ? 'text-orange-500 drop-shadow-md' :
              pomodoro.mode === 'break' ? 'text-green-500' : 'text-blue-500'
            }`}>
              {formatTimeBig(pomodoro.remainingTime)}
            </div>

            {/* コントロールボタン群 */}
            <div className="flex items-center gap-6">
              {pomodoro.mode === 'work' && currentTask && (
                <button 
                  onClick={() => {
                    onToggleTask(currentTask.id);
                    pomodoro.completeTaskEarly();
                  }}
                  className="flex flex-col items-center gap-2 text-gray-500 hover:text-green-600 transition-colors group"
                >
                  <div className="p-4 bg-white rounded-full shadow-sm group-hover:bg-green-50">
                    <Check className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold">完了</span>
                </button>
              )}

              {(pomodoro.mode === 'work' || pomodoro.mode === 'freeze') && (
                <button 
                  onClick={pomodoro.toggleFreeze}
                  className={`flex flex-col items-center gap-2 transition-colors group ${
                    pomodoro.mode === 'freeze' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
                  }`}
                >
                  <div className={`p-4 rounded-full shadow-sm ${pomodoro.mode === 'freeze' ? 'bg-blue-100' : 'bg-white group-hover:bg-blue-50'}`}>
                    {pomodoro.mode === 'freeze' ? <Play className="w-8 h-8" /> : <Snowflake className="w-8 h-8" />}
                  </div>
                  <span className="text-xs font-bold">凍結 ({pomodoro.maxFreeze - pomodoro.freezeCount}回)</span>
                </button>
              )}

              {(pomodoro.mode === 'work' || pomodoro.mode === 'freeze') && (
                <button 
                  onClick={() => {
                    if(window.confirm("🚨 本当に中断しますか？ 100🪙のペナルティが発生します！")) {
                      pomodoro.stopEarly();
                    }
                  }}
                  className="flex flex-col items-center gap-2 text-gray-500 hover:text-red-500 transition-colors group"
                >
                  <div className="p-4 bg-white rounded-full shadow-sm group-hover:bg-red-50">
                    <Square className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold">中断</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};