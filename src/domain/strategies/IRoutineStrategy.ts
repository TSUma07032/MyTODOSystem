// src/domain/strategies/IRoutineStrategy.ts
import type { Routine, Task } from '../../types';

export interface IRoutineStrategy {
  /** このルーチンは指定された日に生成されるべきか？ */
  shouldGenerate(routine: Routine, today: Date): boolean;
  
  /** ルーチンから新しいタスクを生成する */
  generateTask(routine: Routine, today: Date): Task;
}