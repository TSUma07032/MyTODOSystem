// src/components/views/PomodoroView.tsx
import React, { useState} from 'react';
import { createPortal } from 'react-dom'; // 🌟 追加：Reactの正式な別窓描画機能
import { Play, Square, Coffee, Snowflake, Plus, Trash2, Check, BellRing, RefreshCcw, CheckCircle, Zap, LibraryBig, ExternalLink, Minimize2, BellOff } from 'lucide-react'; 
import type { Task } from '../../types';

interface PomodoroViewProps {
  pomodoro: any;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  queue: string[];
  onAddToQueue: (id: string) => void;
  onRemoveFromQueue: (id: string) => void;
  onAddTemplate?: (templateName: string, subTasks: string[]) => void;
  onUpdateWorkTime?: (taskId: string, minutes: number) => void;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({ 
  pomodoro, tasks, onToggleTask, queue, onAddToQueue, onRemoveFromQueue, 
  onAddTemplate, onUpdateWorkTime 
}) => {
  
  const [searchQuery, setSearchQuery] = useState("");
  const [adhocText, setAdhocText] = useState('');
  const [adhocTasks, setAdhocTasks] = useState<Task[]>([]);

  // 🌟 変更：PiP（小窓）のWindowオブジェクトそのものをステートで管理する
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const formatTimeBig = (seconds: number) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    const sign = isNegative ? "+" : ""; // マイナス＝超過なので「+」表記にする
    return `${sign}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const allTasks = [...tasks, ...adhocTasks];
  const currentTask = allTasks.find(t => t.id === pomodoro.taskId);

  const startNextInQueue = () => {
    if (queue.length > 0) {
      const nextId = queue[0];
      pomodoro.startWork(nextId);
    }
  };

  const availableTasks = tasks.filter(t => 
    t.status !== 'done' && 
    t.routineType !== 'daily' && 
    !queue.includes(t.id) &&
    pomodoro.taskId !== t.id
  );

  const searchResults = searchQuery 
    ? availableTasks.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : availableTasks;

  const handleAddAdhoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adhocText.trim()) return;
    const newTask: Task = {
      id: `adhoc-${Date.now()}`, text: `⚡ ${adhocText}`, status: 'todo', 
      parentId: null, order: 0, difficulty: 1
    };
    // 🌟 これでキューの表示が壊れることなく即時反映されます
    setAdhocTasks(prev => [...prev, newTask]);
    onAddToQueue(newTask.id);
    setAdhocText('');
  };

  const templates = [
    { name: "🏋️ 筋トレセット", subTasks: ["腕立て伏せ 30回", "腹筋 30回", "スクワット 30回"] },
    { name: "📚 読書セット", subTasks: ["第1章を読む", "要約をメモする"] },
    { name: "🧹 掃除セット", subTasks: ["デスク周りの整理", "床の掃除機掛け", "ゴミ捨て"] }
  ];

  // 🌟 小窓（PiP）機能の刷新
  const togglePiP = async () => {
    if (!('documentPictureInPicture' in window)) {
      alert('お使いのブラウザは小窓化機能に対応していません。\nChrome または Edge の最新版をご利用ください。');
      return;
    }

    if (pipWindow) {
      pipWindow.close();
      return;
    }

    try {
      const win = await (window as any).documentPictureInPicture.requestWindow({
        width: 380,
        height: 480,
      });

      // 親画面のTailwind CSSを小窓に注入
      [...document.styleSheets].forEach((styleSheet) => {
        try {
          const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
          const style = document.createElement('style');
          style.textContent = cssRules;
          win.document.head.appendChild(style);
        } catch (e) {
          if (styleSheet.href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            win.document.head.appendChild(link);
          }
        }
      });

      // 小窓のボディスタイルを全画面コンテナとして設定
      win.document.body.className = "m-0 p-0 w-full h-[100vh] overflow-hidden bg-slate-50";

      // 閉じられたらステートをリセットして元に戻す
      win.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(win);
    } catch (error) {
      console.error('PiP Error:', error);
      alert('小窓の起動に失敗しました。');
    }
  };

  // 🌟 追加：タイマー部分を独立したコンポーネントとして定義し、小窓と本画面で使い回す
  const TimerPanel = ({ isPiP }: { isPiP: boolean }) => (
    <div className={`w-full flex flex-col items-center justify-center relative transition-all ${isPiP ? 'h-[100vh] p-4 bg-slate-50' : 'h-full p-10 bg-white/30 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm'}`}>
      
      {isPiP && (
        <button 
          onClick={() => pipWindow?.close()} 
          className="absolute top-4 right-4 p-2 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors shadow-sm z-50 group flex items-center gap-2"
        >
          <Minimize2 className="w-5 h-5 group-hover:scale-90 transition-transform" />
        </button>
      )}

      {/* 🌟 完了確認モーダル */}
      {pomodoro.isConfirming && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300 rounded-2xl">
          <div className={`bg-white rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full text-center animate-in zoom-in-95 duration-300 border-4 border-orange-400 ${isPiP ? 'p-6 m-4' : 'p-8'}`}>
            <div className="p-4 bg-orange-100 rounded-full mb-4 animate-bounce">
              <BellRing className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-2">TIME'S UP!</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">タスクは完了しましたか？</p>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => {
                  if (currentTask && !currentTask.id.startsWith('adhoc-')) {
                    onToggleTask(currentTask.id); 
                  }
                  if (currentTask) onRemoveFromQueue(currentTask.id); // 🌟 ここに追加！
                  pomodoro.confirmComplete();
                }}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-lg"
              >
                <CheckCircle className="w-5 h-5" />
                完全に完了！ (+50🪙)
              </button>
              <button 
                onClick={pomodoro.confirmExtend}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95"
              >
                <RefreshCcw className="w-5 h-5" />
                まだ（休憩へ）
              </button>
            </div>

            {/* 🌟 追加：アラームだけ止めるボタン */}
            <button 
              onClick={pomodoro.muteAlarm}
              className="mt-4 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <BellOff className="w-4 h-4" /> 音だけ止める
            </button>
          </div>
        </div>
      )}

      {/* 🌟 追加：休憩超過中のアラームミュートボタン */}
      {pomodoro.isBreakAlarming && (
        <button 
          onClick={pomodoro.muteAlarm} 
          className="absolute top-8 right-8 bg-white/80 p-3 rounded-full shadow-md hover:bg-red-50 text-red-500 z-40 transition-all hover:scale-110"
          title="アラームをミュート"
        >
          <BellOff className="w-6 h-6" />
        </button>
      )}

      {pomodoro.mode === 'idle' ? (
        // ... (idle画面の表示はそのまま維持) ...
        <div className="text-center flex flex-col items-center w-full">
          <Coffee className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-600 mb-2">準備完了</h2>
          <p className="text-sm text-gray-500 mb-6">キューからタスクを選んで集中を開始しましょう</p>
          
          {queue.length > 0 ? (
            <div className="flex flex-col items-center gap-4 w-full px-4">
              <div className="w-full truncate px-4 py-2 bg-orange-100 text-orange-800 rounded-xl text-sm font-bold border border-orange-200 shadow-inner">
                次: {allTasks.find(t => t.id === queue[0])?.text}
              </div>
              <button 
                onClick={startNextInQueue}
                className="w-full max-w-sm py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-black text-lg shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
              >
                <Play className="w-6 h-6 fill-white" />
                集中を開始！
              </button>
            </div>
          ) : (
            <button disabled className="px-6 py-3 bg-gray-200 text-gray-400 rounded-full font-bold text-sm flex items-center gap-2 cursor-not-allowed">
              キューにタスクがありません
            </button>
          )}
        </div>
      ) : (
        <div className="text-center flex flex-col items-center justify-center w-full flex-1">
          {/* 現在のタスク名（休憩超過時は赤く光る） */}
          <div className={`mb-6 w-full p-4 bg-white/60 rounded-2xl shadow-sm border transition-colors ${pomodoro.isBreakAlarming ? 'border-red-400 bg-red-50' : 'border-orange-100'}`}>
            <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${pomodoro.isBreakAlarming ? 'text-red-500' : 'text-orange-500'}`}>
              {pomodoro.mode === 'work' ? 'Now Focusing' : 
               pomodoro.mode === 'break' ? (pomodoro.remainingTime < 0 ? 'Break Time Over!' : 'Break Time') : 
               'Freezed'}
            </span>
            <h2 
              className="font-bold text-gray-800 break-words leading-tight"
              style={{ fontSize: isPiP ? 'clamp(1.2rem, 6vw, 2rem)' : '1.5rem' }}
            >
              {pomodoro.mode === 'work' && currentTask ? currentTask.text : 
               pomodoro.mode === 'break' && queue.length > 0 ? `Next: ${allTasks.find(t => t.id === queue[0])?.text}` :
               pomodoro.mode === 'freeze' ? "凍結中..." : "休憩中..."}
            </h2>
          </div>

          {/* 巨大タイマー */}
          <div 
            className={`font-mono font-black mb-8 tracking-tighter ${
              pomodoro.mode === 'work' ? 'text-orange-500 drop-shadow-md' :
              pomodoro.mode === 'break' ? (pomodoro.isBreakAlarming ? 'text-red-500 animate-pulse' : 'text-green-500') : 
              'text-blue-500'
            }`}
            style={{ 
              fontSize: isPiP ? 'clamp(4rem, 25vw, 10rem)' : '6rem',
              lineHeight: 1
            }}
          >
            {formatTimeBig(pomodoro.remainingTime)}
          </div>

          {/* コントロールボタン群 */}
          <div className="flex items-center justify-center gap-4 w-full">
            
            {pomodoro.mode === 'work' && currentTask && (
              <button 
                onClick={() => {
                  if (!currentTask.id.startsWith('adhoc-')) onToggleTask(currentTask.id);
                  if (currentTask) onRemoveFromQueue(currentTask.id);
                  pomodoro.completeTaskEarly();
                }}
                className="flex flex-col items-center gap-1 text-gray-500 hover:text-green-600 transition-colors group"
              >
                <div className="p-3 bg-white rounded-full shadow-sm group-hover:bg-green-50">
                  <Check className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold">完了</span>
              </button>
            )}

            {/* 🌟 追加：休憩中専用の「次を開始」ボタン */}
            {pomodoro.mode === 'break' && (
              <div className="flex flex-col items-center gap-1 group relative">
                <button 
                  onClick={startNextInQueue}
                  disabled={queue.length === 0}
                  className={`p-3 rounded-full shadow-sm transition-all ${queue.length > 0 ? (pomodoro.isBreakAlarming ? 'bg-red-500 text-white animate-bounce shadow-red-500/50' : 'bg-white hover:bg-orange-50 text-orange-500') : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                >
                  <Play className="w-6 h-6" />
                </button>
                <span className={`text-[10px] font-bold ${pomodoro.isBreakAlarming ? 'text-red-500' : 'text-gray-500'}`}>次を開始</span>
                {queue.length === 0 && <span className="absolute -bottom-6 text-[10px] text-red-400 whitespace-nowrap">キューが空です</span>}
              </div>
            )}

            {/* 🌟 変更：休憩中も凍結ボタンを表示 */}
            {(pomodoro.mode === 'work' || pomodoro.mode === 'break' || pomodoro.mode === 'freeze') && (
              <button 
                onClick={pomodoro.toggleFreeze}
                className={`flex flex-col items-center gap-1 transition-colors group ${
                  pomodoro.mode === 'freeze' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500'
                }`}
              >
                <div className={`p-3 rounded-full shadow-sm ${pomodoro.mode === 'freeze' ? 'bg-blue-100' : 'bg-white group-hover:bg-blue-50'}`}>
                  {pomodoro.mode === 'freeze' ? <Play className="w-6 h-6" /> : <Snowflake className="w-6 h-6" />}
                </div>
                <span className="text-[10px] font-bold">凍結 ({pomodoro.maxFreeze - pomodoro.freezeCount})</span>
              </button>
            )}

            {(pomodoro.mode === 'work' || pomodoro.mode === 'freeze') && (
              <button 
                onClick={() => {
                  if(window.confirm("🚨 本当に中断しますか？ 100🪙のペナルティが発生します！")) {
                    pomodoro.stopEarly();
                  }
                }}
                className="flex flex-col items-center gap-1 text-gray-500 hover:text-red-500 transition-colors group"
              >
                <div className="p-3 bg-white rounded-full shadow-sm group-hover:bg-red-50">
                  <Square className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold">中断</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex w-full h-full max-w-6xl mx-auto p-6 gap-6 animate-fadeIn relative">
      
      {/* --- 左側：Focus Queue --- */}
      <div className="w-1/3 flex flex-col bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-white/50 bg-white/50 flex justify-between items-center">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Plus className="w-5 h-5 text-orange-500" />
            Focus Queue
          </h2>
          {/* 小窓化ボタン */}
          {!pipWindow && pomodoro.mode !== 'idle' && (
            <button 
              onClick={togglePiP}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-bold rounded-lg transition-colors shadow-sm"
              title="常に最前面で表示"
            >
              <ExternalLink className="w-4 h-4" />
              小窓化
            </button>
          )}
        </div>
        
        <div className="p-4 border-b border-white/50 flex flex-col h-[40%]">
          {/* 即席タスク入力フォーム */}
          <form onSubmit={handleAddAdhoc} className="mb-2 flex gap-2">
            <input 
              type="text" placeholder="＋ 即席タスク（保存不要）..." 
              value={adhocText} onChange={e => setAdhocText(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/70 border-none outline-none focus:ring-2 focus:ring-blue-300 text-sm text-gray-800 placeholder-gray-400"
            />
            <button type="submit" className="bg-blue-500 text-white px-3 rounded-lg text-sm font-bold hover:bg-blue-600 shadow-sm"><Zap className="w-4 h-4" /></button>
          </form>

          <input
            type="text"
            placeholder="既存タスクを検索して追加..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/70 border-none outline-none focus:ring-2 focus:ring-orange-300 text-sm text-gray-800 font-medium placeholder-gray-400 mb-3"
          />
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {searchResults.map(t => (
              <button 
                key={t.id} onClick={() => onAddToQueue(t.id)}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-orange-100 text-gray-700 truncate border border-transparent hover:border-orange-200 transition-colors"
              >
                {t.text}
              </button>
            ))}
          </div>
        </div>

        {/* キューのリスト */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-black/5">
          {queue.map((id, index) => {
            const t = allTasks.find(task => task.id === id); 
            if (!t) return null;
            return (
              <div key={id} className="flex items-center justify-between p-3 bg-white/60 rounded-xl border border-white/50 shadow-sm group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-xs font-bold text-gray-400 w-4">{index + 1}.</span>
                  <span className="text-sm font-medium text-gray-700 truncate">{t.text}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded cursor-pointer hover:bg-orange-50 hover:text-orange-600 transition-colors shadow-sm"
                    title="クリックで作業時間を直接編集"
                    onClick={() => {
                      if(t.id.startsWith('adhoc-')) return; 
                      const newTime = window.prompt("このタスクの総作業時間(分)を入力して上書きします", String(t.totalWorkTime || 0));
                      if (newTime !== null && !isNaN(Number(newTime)) && onUpdateWorkTime) {
                        onUpdateWorkTime(t.id, Number(newTime));
                      }
                    }}
                  >
                    ⏱️ {t.totalWorkTime || 0}m
                  </span>
                  <button onClick={() => onRemoveFromQueue(id)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* テンプレート呼び出しエリア */}
        <div className="p-4 border-t border-white/50 bg-white/60">
          <div className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
            <LibraryBig className="w-4 h-4" /> テンプレート（親+子タスク）
          </div>
          <div className="flex flex-wrap gap-2">
            {templates.map(tpl => (
              <button 
                key={tpl.name}
                onClick={() => onAddTemplate && onAddTemplate(tpl.name, tpl.subTasks)}
                className="text-xs px-2.5 py-1.5 bg-white hover:bg-orange-500 hover:text-white border border-gray-200 rounded-lg text-gray-600 transition-all shadow-sm font-medium"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- 中央：Timer Panel --- */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        {pipWindow ? (
          // 🌟 小窓起動中の「抜け殻」画面
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/30 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm border-dashed">
            <ExternalLink className="w-16 h-16 text-blue-300 mb-4 animate-pulse" />
            <h2 className="text-xl font-bold text-gray-500 mb-4">最前面の小窓で実行中...</h2>
            <button 
              onClick={() => pipWindow.close()} 
              className="px-6 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full font-bold transition-colors shadow-sm"
            >
              画面に戻す
            </button>
            
            {/* 🌟 これが魔法！Reactの仮想DOMをそのまま別ウィンドウに描画する */}
            {createPortal(<TimerPanel isPiP={true} />, pipWindow.document.body)}
          </div>
        ) : (
          // 通常の画面
          <TimerPanel isPiP={false} />
        )}
      </div>

    </div>
  );
};