// src/domain/services/RoutineEngine.ts
import type { Routine, Task } from '../../types';
import type { IRoutineStrategy } from '../strategies/IRoutineStrategy';

export class RoutineEngine {
  private strategies: IRoutineStrategy[];

  constructor(strategies: IRoutineStrategy[]) {
    this.strategies = strategies;
  }

  /**
   * 登録されたルーチン一覧から、今日追加すべきタスクだけを抽出して生成する
   */
  public generateMissingTasks(routines: Routine[], targetDate: Date = new Date()): Task[] {
    const newTasks: Task[] = [];

    for (const routine of routines) {
      // 登録されている戦略（Daily, Weekly）を順番に試す
      for (const strategy of this.strategies) {
        if (strategy.shouldGenerate(routine, targetDate)) {
          newTasks.push(strategy.generateTask(routine, targetDate));
          break; // 生成されたら次のルーチンへ
        }
      }
    }

    return newTasks;
  }
}