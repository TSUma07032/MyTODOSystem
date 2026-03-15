// src/hooks/useEvents.ts
import { useState } from 'react';
import type { Event } from '../types';

export const useEvents = (
  writeFile: (filename: string, content: string) => Promise<void>
) => {
  const [events, setEvents] = useState<Event[]>([]);

  // 共通の保存関数：Event配列を更新し、JSONとして保存する
  const updateEventsAndSave = async (newEvents: Event[]) => {
    setEvents(newEvents);
    // タスクとは別のファイルに保存して、データを分離します
    await writeFile('current_active_events.json', JSON.stringify(newEvents, null, 2));
  };

  // ✅ 1. 予定の追加
  const addEvent = async (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}` // 一意のIDを生成
    };
    const newEvents = [...events, newEvent];
    await updateEventsAndSave(newEvents);
  };

  // ✅ 2. 予定の更新
  const updateEvent = async (id: string, updatedData: Partial<Event>) => {
    const newEvents = events.map(e => 
      e.id === id ? { ...e, ...updatedData } : e
    );
    await updateEventsAndSave(newEvents);
  };

  // ✅ 3. 予定の削除
  const deleteEvent = async (id: string) => {
    const newEvents = events.filter(e => e.id !== id);
    await updateEventsAndSave(newEvents);
  };

  return {
    events,
    setEvents, // 初期化時に使用
    addEvent,
    updateEvent,
    deleteEvent
  };
};