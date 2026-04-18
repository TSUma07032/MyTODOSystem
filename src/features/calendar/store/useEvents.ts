import { useState, useCallback } from 'react';
import type { Event } from '../types';
import { useFileSystem } from '@/core/hooks/useFileSystem';

let globalEvents: Event[] = [];

export const useEvents = () => {
  const [events, setEventsState] = useState<Event[]>(globalEvents);
  const { writeFile } = useFileSystem();

  const syncAndSave = useCallback(async (newEvents: Event[]) => {
    globalEvents = newEvents;
    setEventsState(newEvents);
    await writeFile('current_active_events.json', JSON.stringify(newEvents, null, 2));
  }, [writeFile]);

  const initEvents = useCallback((loaded: Event[]) => {
    globalEvents = loaded;
    setEventsState(loaded);
  }, []);

  const addEvent = async (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = { ...eventData, id: `event-${Date.now()}` };
    await syncAndSave([...globalEvents, newEvent]);
  };

  const updateEvent = async (id: string, updatedData: Partial<Event>) => {
    const newEvents = globalEvents.map(e => e.id === id ? { ...e, ...updatedData } : e);
    await syncAndSave(newEvents);
  };

  const deleteEvent = async (id: string) => {
    await syncAndSave(globalEvents.filter(e => e.id !== id));
  };

  return { events, initEvents, addEvent, updateEvent, deleteEvent };
};