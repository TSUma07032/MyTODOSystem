// src/components/views/CalendarDetail/EventSection.tsx
import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, X, Trash2, Edit2, Check } from 'lucide-react';
import type { Event } from '../../../types';

interface EventSectionProps {
  events: Event[];
  selectedDateStr: string;
  onAddEvent: (eventData: Omit<Event, 'id'>) => Promise<void>;
  onUpdateEvent: (id: string, updatedData: Partial<Event>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export const EventSection: React.FC<EventSectionProps> = ({ 
  events, selectedDateStr, onAddEvent, onUpdateEvent, onDeleteEvent 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  
  // 編集用のステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editStartTime, setEditStartTime] = useState('');

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    await onAddEvent({ title: newTitle, date: selectedDateStr, startTime: newStartTime || undefined });
    setNewTitle(''); setNewStartTime(''); setIsAdding(false);
  };

  const startEdit = (event: Event) => {
    setEditingId(event.id);
    setEditTitle(event.title);
    setEditStartTime(event.startTime || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    await onUpdateEvent(editingId, { title: editTitle, startTime: editStartTime || undefined });
    setEditingId(null);
  };

  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <CalendarIcon className="w-4 h-4" /> Events
        </h4>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 bg-blue-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1">
            <Plus className="w-3 h-3" /> 追加
          </button>
        )}
      </div>

      <div className="space-y-2">
        {events.map(event => (
          <div key={event.id} className="group p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-3 transition-all hover:bg-blue-50">
            {editingId === event.id ? (
              // 📝 編集モード
              <div className="flex-1 flex items-center gap-2 w-full animate-fadeIn">
                <input
                  type="time" value={editStartTime} onChange={e => setEditStartTime(e.target.value)}
                  className="text-xs font-medium text-slate-600 bg-white rounded-md border border-blue-200 focus:ring-1 focus:ring-blue-300 p-1 w-20 shrink-0"
                />
                <input
                  autoFocus type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                  className="text-sm font-bold bg-white border border-blue-200 rounded-md focus:ring-1 focus:ring-blue-300 p-1 flex-1 min-w-0 text-slate-700"
                />
                <button onClick={handleSaveEdit} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md hover:bg-emerald-200"><Check className="w-3.5 h-3.5" /></button>
                <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200"><X className="w-3.5 h-3.5" /></button>
              </div>
            ) : (
              // 👁️ 表示モード
              <>
                {event.startTime && <span className="text-xs font-black text-blue-500 w-10 shrink-0">{event.startTime}</span>}
                <p className="text-sm font-bold text-slate-700 flex-1 truncate">{event.title}</p>
                {/* ホバー時に現れるアクションボタン */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(event)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-white rounded-md transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onDeleteEvent(event.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* インライン追加フォーム (変更なし) */}
      {isAdding && (
        <div className="p-3 rounded-xl bg-white border border-blue-200 shadow-sm mt-2 animate-fadeIn">
          <input autoFocus type="text" placeholder="予定のタイトル..." value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} className="w-full text-sm font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-700 placeholder:text-slate-300 mb-2" />
          <div className="flex items-center gap-2">
            <input type="time" value={newStartTime} onChange={e => setNewStartTime(e.target.value)} className="text-xs font-medium text-slate-500 bg-slate-50 rounded-md border-none focus:ring-1 focus:ring-blue-300 p-1" />
            <div className="flex-1" />
            <button onClick={() => setIsAdding(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"><X className="w-4 h-4" /></button>
            <button onClick={handleAdd} className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-md transition-colors">保存</button>
          </div>
        </div>
      )}
    </div>
  );
};