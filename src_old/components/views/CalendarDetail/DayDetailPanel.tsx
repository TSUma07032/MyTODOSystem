// src/components/views/CalendarDetail/DayDetailPanel.tsx
import React from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { IconButton } from '../../ui/IconButton';
import { TaskSection } from './TaskSection';
import { EventSection } from './EventSection';
import type { Task, Event } from '../../../types';

interface DayDetailPanelProps {
  selectedDay: Date;
  tasks: Task[];
  events: Event[];
  onClose: () => void;
  onToggleTask: (id: string) => void;
  onAddEvent: (eventData: Omit<Event, 'id'>) => Promise<void>;
  onUpdateEvent: (id: string, updatedData: Partial<Event>) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
}

export const DayDetailPanel: React.FC<DayDetailPanelProps> = ({
  selectedDay, tasks, events, onClose, onToggleTask, onAddEvent, onUpdateEvent, onDeleteEvent
}) => {
  const selectedDateStr = format(selectedDay, 'yyyy-MM-dd');

  return (
    <div className="w-1/3 h-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100 flex flex-col overflow-hidden animate-slideInRight">
      {/* ヘッダー */}
      <div className="px-5 py-4 border-b border-emerald-100/50 flex justify-between items-center bg-gradient-to-br from-emerald-50 to-white">
        <div>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
            {format(selectedDay, 'yyyy MMMM')}
          </p>
          <h3 className="text-xl font-black text-slate-800 flex items-baseline gap-1">
            {format(selectedDay, 'd')}
            <span className="text-sm font-bold text-slate-400">({format(selectedDay, 'EEE')})</span>
          </h3>
        </div>
        <IconButton onClick={onClose}>
          <X className="w-5 h-5 text-slate-400" />
        </IconButton>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-emerald-100">
        <EventSection events={events} selectedDateStr={selectedDateStr} onAddEvent={onAddEvent} onUpdateEvent={onUpdateEvent} onDeleteEvent={onDeleteEvent}/>
        <div className="h-px bg-slate-100 w-full mb-4" /> {/* 区切り線 */}
        <TaskSection tasks={tasks} selectedDay={selectedDay} onToggleTask={onToggleTask} />
      </div>
    </div>
  );
};