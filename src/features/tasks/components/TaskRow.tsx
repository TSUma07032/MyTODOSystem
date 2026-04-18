import React, { useState } from 'react';
import { type Task } from '../types';
import { CheckCircle2, Circle, CornerDownRight, Trash2, GripVertical, ChevronRight, ChevronDown,  ListPlus } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  task: Task;
  indent: number;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggle: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onDeleteTask: (id: string) => void;
  onAddSubTask: (parentId: string, text: string) => void;
  onUpdateDeadline: (id: string, date: string) => void;
  onMoveTask: (dragId: string, dropId: string) => void;
  pomodoro?: any; // ポモドーロは pillar の1つなので残す
  onAddToQueue?: (id: string) => void;
}

export const TaskRow: React.FC<Props> = ({ 
  task, indent, hasChildren, isExpanded, onToggleExpand, onToggle, 
  onUpdateText, onDeleteTask, onAddSubTask,  onMoveTask, 
   onAddToQueue 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [subText, setSubText] = useState("");

  const handleEditSubmit = () => {
    if (editText.trim() && editText !== task.text) onUpdateText(task.id, editText);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col">
      <div 
        draggable 
        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
        onDrop={(e) => {
          e.preventDefault();
          const dragId = e.dataTransfer.getData('taskId');
          onMoveTask(dragId, task.id);
        }}
        onDragOver={(e) => e.preventDefault()}
        className={clsx(
          "group relative flex items-start py-2.5 px-3 border-b border-gray-100/50 hover:bg-white/60 transition-all rounded-xl",
          task.status === 'done' && "opacity-50 grayscale"
        )}
        style={{ paddingLeft: `${indent * 1.5 + 0.5}rem` }}
      >
        <GripVertical className="w-4 h-4 mt-1 mr-1 opacity-0 group-hover:opacity-30 cursor-grab" />
        
        <div className="w-5 mr-1 mt-0.5 shrink-0">
          {hasChildren && (
            <button onClick={onToggleExpand} className="p-0.5 hover:bg-gray-200 rounded">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>

        <button onClick={() => onToggle(task.id)} className="mr-3 mt-0.5">
          {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-gray-300" />}
        </button>

        <div className="flex-1">
          {isEditing ? (
            <input 
              autoFocus value={editText} 
              onChange={e => setEditText(e.target.value)}
              onBlur={handleEditSubmit}
              onKeyDown={e => e.key === 'Enter' && handleEditSubmit()}
              className="w-full bg-transparent border-b border-orange-400 outline-none text-sm"
            />
          ) : (
            <span onClick={() => setIsEditing(true)} className={clsx("text-sm font-medium cursor-text", task.status === 'done' && "line-through")}>
              {task.text}
            </span>
          )}
        </div>

        {/* バッジ & アクション */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAddToQueue && task.status === 'todo' && (
            <button onClick={() => onAddToQueue(task.id)} className="p-1 hover:bg-blue-100 text-blue-400 rounded">
              <ListPlus className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setIsAddingSub(true)} className="p-1 hover:bg-gray-100 text-gray-400 rounded">
            <CornerDownRight className="w-4 h-4" />
          </button>
          <button onClick={() => onDeleteTask(task.id)} className="p-1 hover:bg-red-100 text-gray-400 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* サブタスク入力フォーム */}
      {isAddingSub && (
        <div className="flex items-center gap-2 py-2 ml-8 pr-4" style={{ paddingLeft: `${(indent + 1) * 1.5}rem` }}>
          <input 
            autoFocus value={subText} 
            onChange={e => setSubText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && subText) { onAddSubTask(task.id, subText); setSubText(""); setIsAddingSub(false); }
              if (e.key === 'Escape') setIsAddingSub(false);
            }}
            placeholder="Sub-mission..."
            className="flex-1 bg-transparent border-b text-sm outline-none"
          />
        </div>
      )}
    </div>
  );
};