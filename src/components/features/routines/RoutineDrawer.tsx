// src/components/features/routines/RoutineDrawer.tsx
import React from 'react';
import { Repeat, Plus, Trash2, CheckCircle } from 'lucide-react';
import { Drawer } from '../../ui/Drawer';
import { IconButton } from '../../ui/IconButton';
import type { Routine, Task } from '../../../types';

interface RoutineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  routines: Routine[];
  tasks: Task[]; // ルーチンが今日完了しているか判定するために使用
  drawerRoutineType: 'daily' | 'weekly';
  setDrawerRoutineType: (val: 'daily' | 'weekly') => void;
  drawerRoutineText: string;
  setDrawerRoutineText: (val: string) => void;
  drawerGenerateOn: string;
  setDrawerGenerateOn: (val: string) => void;
  drawerDeadline: string;
  setDrawerDeadline: (val: string) => void;
  handleAddRoutineFromDrawer: () => void;
  deleteRoutineJSON: (id: string) => void;
}

export const RoutineDrawer: React.FC<RoutineDrawerProps> = ({
  isOpen, onClose, routines, tasks,
  drawerRoutineType, setDrawerRoutineType,
  drawerRoutineText, setDrawerRoutineText,
  drawerGenerateOn, setDrawerGenerateOn,
  drawerDeadline, setDrawerDeadline,
  handleAddRoutineFromDrawer, deleteRoutineJSON
}) => {
  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="JSON Routines" 
      icon={<Repeat className="w-5 h-5" />}
      headerColorClass="bg-indigo-50/50 border-indigo-50 text-indigo-700"
    >
      {/* 新規ルーチン追加フォーム */}
      <div className="mb-6 p-3 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm animate-fadeIn">
        <div className="flex gap-2 mb-2">
          {/* ルーチン種類の選択 */}
          <select 
            value={drawerRoutineType} 
            onChange={(e) => setDrawerRoutineType(e.target.value as 'daily' | 'weekly')} 
            className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-400 w-1/3"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          
          {/* ウィークリーの場合の発生曜日選択 */}
          {drawerRoutineType === 'weekly' && (
            <select 
              value={drawerGenerateOn} 
              onChange={(e) => setDrawerGenerateOn(e.target.value)} 
              className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-400 w-1/3"
            >
              <option value="Mon">On Mon</option>
              <option value="Tue">On Tue</option>
              <option value="Wed">On Wed</option>
              <option value="Thu">On Thu</option>
              <option value="Fri">On Fri</option>
              <option value="Sat">On Sat</option>
              <option value="Sun">On Sun</option>
            </select>
          )}

          {/* 期限ルールの選択 */}
          <select 
            value={drawerRoutineType === 'daily' ? 'none' : drawerDeadline} 
            onChange={(e) => setDrawerDeadline(e.target.value)} 
            disabled={drawerRoutineType === 'daily'}
            className="bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-lg px-2 py-1 outline-none focus:border-indigo-400 flex-1 disabled:opacity-50 disabled:bg-gray-100"
          >
            <option value="none">No Due</option>
            <option value="today">Due Today</option>
            <option value="Mon">by Mon</option>
            <option value="Fri">by Fri</option>
            <option value="Sun">by Sun</option>
          </select>
        </div>

        {/* テキスト入力と追加ボタン */}
        <div className="flex gap-2">
          <input 
            type="text" 
            value={drawerRoutineText} 
            onChange={(e) => setDrawerRoutineText(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAddRoutineFromDrawer()} 
            placeholder="Add JSON routine..." 
            className="flex-1 bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-400" 
          />
          <button 
            onClick={handleAddRoutineFromDrawer} 
            className="bg-indigo-500 text-white p-1.5 rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 登録済みルーチンのリスト表示 */}
      {['daily', 'weekly'].map(type => {
        const sectionRoutines = routines.filter(r => r.type === type);
        if (sectionRoutines.length === 0) return null;
        
        return (
          <div key={type} className="mb-6 animate-fadeIn">
            <h3 className="text-xs font-black text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              {type}
              <div className="flex-1 h-px bg-indigo-100"></div>
            </h3>
            
            <div className="space-y-1">
              {sectionRoutines.map(r => {
                const isCompletedToday = tasks.some(activeTask => activeTask.routineId === r.id && activeTask.status === 'done');
                
                return (
                  <div key={r.id} className={`group flex flex-col p-2 rounded-lg transition-colors border ${isCompletedToday ? "bg-green-50/50 border-green-100" : "bg-white border-transparent hover:bg-indigo-50/50 hover:border-indigo-100 shadow-sm"}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm truncate pr-2 flex items-center flex-1 ${isCompletedToday ? "text-slate-400 line-through" : "text-slate-700 font-medium"}`}>
                        {isCompletedToday && <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-500 flex-shrink-0" />}
                        <span className="truncate" title={r.text}>{r.text}</span>
                      </span>
                      {/* ここで共通のIconButtonを使用！ */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconButton variant="danger" onClick={() => deleteRoutineJSON(r.id)}>
                          <Trash2 className="w-4 h-4" />
                        </IconButton>
                      </div>
                    </div>
                    
                    {/* ウィークリー特有のバッジ表示 */}
                    {r.type === 'weekly' && (
                      <div className="text-[10px] font-bold mt-1 flex gap-2 ml-5">
                         <span className="bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded border border-indigo-100">Gen: {r.generateOn}</span>
                         {r.deadlineRule !== 'none' && (
                           <span className="bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded border border-orange-100">Due: {r.deadlineRule}</span>
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