// src/features/calendar/hooks/useEvents.ts
import { useState, useCallback } from 'react';
import type { Event } from '../types';

const EVENTS_FILE = 'events.json';

export const useEvents = (
  writeFile: (filename: string, content: string) => Promise<void>
) => {
  const [events, setEvents] = useState<Event[]>([]);

  const saveEvents = useCallback(async (newEvents: Event[]) => {
    setEvents(newEvents);
    await writeFile(EVENTS_FILE, JSON.stringify(newEvents, null, 2));
  }, [writeFile]);

  const addEvent = useCallback(async (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = { ...eventData, id: `event-${Date.now()}` };
    await saveEvents([...events, newEvent]);
  }, [events, saveEvents]);

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    const newEvents = events.map(e => e.id === id ? { ...e, ...updates } : e);
    await saveEvents(newEvents);
  }, [events, saveEvents]);

  const deleteEvent = useCallback(async (id: string) => {
    await saveEvents(events.filter(e => e.id !== id));
  }, [events, saveEvents]);

  return { events, setEvents, addEvent, updateEvent, deleteEvent };
};