// src/hooks/useAppViewData.ts
import { useMemo } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, format } from 'date-fns';
import { Sun, Moon, History as HistoryIcon, CalendarDays } from 'lucide-react';
import type { Task, Event } from '../types';

interface ViewDataSource {
  mode: 'dashboard' | 'daily' | 'sync' | 'history' | 'calendar' | 'pomodoro';
  historyItems: any[];
  searchQuery: string;
  currentDate: Date;
  tasks: Task[];
  events: Event[];
}

export const useAppViewData = ({
  mode,
  historyItems,
  searchQuery,
  currentDate,
  tasks,
  events
}: ViewDataSource) => {
  
  // 1. 履歴データのグループ化と検索フィルタリング
  const groupedHistory = useMemo(() => { 
    const groups: Record<string, any[]> = {}; 
    historyItems.forEach(item => { 
      if (searchQuery && !item.text.toLowerCase().includes(searchQuery.toLowerCase())) return; 
      if (!groups[item.text]) groups[item.text] = []; 
      groups[item.text].push(item); 
    }); 
    return groups; 
  }, [historyItems, searchQuery]);

  // 2. カレンダーグリッド用データの生成
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const days = eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(endOfMonth(monthStart)) });
    
    return days.map(day => {
        // --- タスクの処理 ---
        const dateStr = `${day.getMonth() + 1}/${day.getDate()}`;
        const rootTasks = tasks.filter(t => t.deadline === dateStr && t.status !== 'done');
        
        // ★修正: parentId を使って再帰的に子孫タスクを取得する関数
        const getDescendants = (parentId: string): Task[] => {
          const children = tasks.filter(t => t.parentId === parentId);
          let descendants: Task[] = [];
          for (const child of children) {
            if (child.status !== 'done') {
              descendants.push(child);
              descendants = descendants.concat(getDescendants(child.id));
            }
          }
          return descendants;
        };

        let displayTasks: Task[] = [];
        rootTasks.forEach(root => {
            displayTasks.push(root);
            displayTasks = displayTasks.concat(getDescendants(root.id));
        });

        // --- 予定の処理 ---
        const dayFormatted = format(day, 'yyyy-MM-dd');
        const dayEvents = events.filter(e => e.date === dayFormatted);

        return { 
          date: day, 
          // Set等を使って重複を排除（同じタスクが複数回入るのを防ぐ）
          tasks: Array.from(new Map(displayTasks.map(t => [t.id, t])).values()), 
          events: dayEvents, 
          isCurrentMonth: day.getMonth() === currentDate.getMonth() 
        };
    });
  }, [currentDate, tasks, events]);

  // 3. モードごとのテーマ設定（色・アイコン）
  const themeConfig = useMemo(() => {
    switch(mode) {
      case 'dashboard': return { bg: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50", accent: "orange", icon: Sun };
      case 'sync': return { bg: "bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950 text-white", accent: "purple", icon: Moon };
      case 'history': return { bg: "bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50", accent: "blue", icon: HistoryIcon };
      case 'calendar': return { bg: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50", accent: "emerald", icon: CalendarDays };
      case 'daily': return { bg: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50", accent: "orange", icon: Sun };
      default: return { bg: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50", accent: "orange", icon: Sun };
    }
  }, [mode]);

  return {
    groupedHistory,
    calendarDays,
    themeConfig
  };
};