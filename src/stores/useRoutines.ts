// src/stores/useRoutines.ts
import { useState } from 'react';
import type { Routine } from '../types';
import { FileRepository } from '../repositories/fileRepository';

export const useRoutines = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completedDailyIds, setCompletedDailyIds] = useState<string[]>([]);

  const saveRoutines = (newRoutines: Routine[]) => {
    setRoutines(newRoutines);
    FileRepository.writeFile('routines.json', JSON.stringify(newRoutines, null, 2));
  };

  return { routines, setRoutines, completedDailyIds, setCompletedDailyIds, saveRoutines };
};