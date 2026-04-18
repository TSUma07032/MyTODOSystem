export type PomodoroMode = 'idle' | 'work' | 'break' | 'freeze';

export interface PomodoroState {
  mode: PomodoroMode;
  taskId: string | null;
  remainingTime: number;
}