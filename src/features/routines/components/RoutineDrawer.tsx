import React, { useState } from 'react';
import { Repeat, Plus, Trash2, CheckCircle } from 'lucide-react';
import { Drawer } from '@/core/components/Drawer';
import { IconButton } from '@/core/components/IconButton';
import { Badge } from '@/core/components/Badge'; // 先ほど作ったBadgeを再利用！
import { useRoutines } from '../store/useRoutines'; // 同じFeature内のStoreを直接呼ぶ
// import { useTasks } from '@/features/tasks/store/useTasks'; // タスクの完了状態を見るため

interface RoutineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoutineDrawer: React.FC<RoutineDrawerProps> = ({ isOpen, onClose }) => {
  // 🚀 改善ポイント1: フォームの状態は、このファイルの中に閉じ込める！
  const [type, setType] = useState<'daily' | 'weekly'>('daily');
  const [text, setText] = useState('');
  const [generateOn, setGenerateOn] = useState('Mon');
  const [deadlineRule, setDeadlineRule] = useState('none');

  // 🚀 改善ポイント2: グローバルStoreから直接データを取得（Propsで受け取らない）
  const { routines, addRoutine, deleteRoutine } = useRoutines();
  // const { tasks } = useTasks(); // ※タスクのStoreができたら有効化

  const handleAdd = () => {
    if (!text.trim()) return;
    
    addRoutine({
      id: `r-${Date.now()}`,
      text: text.trim(),
      type,
      generateOn: type === 'weekly' ? generateOn as any : undefined,
      deadlineRule: type === 'daily' ? 'none' : deadlineRule as any,
    });
    
    setText(''); // 入力後リセット
  };

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Routines" 
      icon={<Repeat className="w-5 h-5" />}
      headerColorClass="bg-indigo-50/50 border-indigo-50 text-indigo-700"
    >
      {/* 新規ルーチン追加フォーム */}
      <div className="mb-6 p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm animate-fadeIn">
        <div className="flex gap-2 mb-2">
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as 'daily' | 'weekly')} 
            className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-400 w-1/3"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          
          {type === 'weekly' && (
            <select 
              value={generateOn} 
              onChange={(e) => setGenerateOn(e.target.value)} 
              className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-400 w-1/3"
            >
              <option value="Mon">On Mon</option>
              <option value="Tue">On Tue</option>
              {/* 他の曜日... */}
            </select>
          )}

          <select 
            value={type === 'daily' ? 'none' : deadlineRule} 
            onChange={(e) => setDeadlineRule(e.target.value)} 
            disabled={type === 'daily'}
            className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-400 flex-1 disabled:opacity-50 disabled:bg-gray-100"
          >
            <option value="none">No Due</option>
            <option value="today">Due Today</option>
            <option value="Mon">by Mon</option>
            {/* 他の曜日... */}
          </select>
        </div>

        <div className="flex gap-2">
          <input 
            type="text" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()} 
            placeholder="Add routine..." 
            className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400" 
          />
          <button 
            onClick={handleAdd} 
            className="bg-indigo-500 text-white p-1.5 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 登録済みルーチンのリスト表示 */}
      {['daily', 'weekly'].map(rType => {
        const sectionRoutines = routines.filter(r => r.type === rType);
        if (sectionRoutines.length === 0) return null;
        
        return (
          <div key={rType} className="mb-6 animate-fadeIn">
            <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              {rType}
              <div className="flex-1 h-px bg-indigo-100"></div>
            </h3>
            
            <div className="space-y-1">
              {sectionRoutines.map(r => {
                // 仮のモック判定。実際は useTasks から取得した activeTask と照合します。
                const isCompletedToday = false; 
                
                return (
                  <div key={r.id} className={`group flex flex-col p-2 rounded-lg transition-colors border ${isCompletedToday ? "bg-green-50/50 border-green-100" : "bg-white border-transparent hover:bg-indigo-50/50 hover:border-indigo-100 shadow-sm"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate pr-2 flex items-center flex-1 ${isCompletedToday ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>
                        {isCompletedToday && <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-500 flex-shrink-0" />}
                        <span className="truncate" title={r.text}>{r.text}</span>
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconButton variant="danger" onClick={() => deleteRoutine(r.id)}>
                          <Trash2 className="w-4 h-4" />
                        </IconButton>
                      </div>
                    </div>
                    
                    {/* 🚀 改善ポイント3: coreで作ったBadgeコンポーネントでスッキリ表現！ */}
                    {r.type === 'weekly' && (
                      <div className="mt-1 flex gap-2 ml-5">
                         <Badge variant="info">Gen: {r.generateOn}</Badge>
                         {r.deadlineRule !== 'none' && (
                           <Badge variant="warning">Due: {r.deadlineRule}</Badge>
                         )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </Drawer>
  );
};