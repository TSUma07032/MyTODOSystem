import { format } from 'date-fns';
// ※実際の型インポートは、先ほど分割計画を立てた各featuresのtypesから行います
import type { Routine } from '@/features/routines/types';
import type { Task } from '@/features/tasks/types';
import { getNextDateOfDay, formatDate } from '@/core/utils/date';

interface GenerationResult {
  updatedTasks: Task[];
  isGenerated: boolean;
  todayStr: string;
}

/**
 * ルーチン一覧から「今日やるべきタスク」を算出し、既存のタスクリストに追加する純粋関数。
 * ※ localStorage や writeFile はここで行わず、結果を返すだけに専念します。
 */
export const generateRoutineTasks = (
  routines: Routine[],
  existingTasks: Task[],
  lastGeneratedDate: string | null
): GenerationResult => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const todayDowStr = format(today, 'E'); // 'Sun', 'Mon' など

  // 1. 今日すでに生成済み、またはルーチンが空なら何もしない
  if (lastGeneratedDate === todayStr || routines.length === 0) {
    return { updatedTasks: existingTasks, isGenerated: false, todayStr };
  }

  // 2. 今日生成すべきルーチンをフィルタリング
  const tasksToInject = routines.filter(
    (r) => r.type === 'daily' || (r.type === 'weekly' && r.generateOn === todayDowStr)
  );

  // 今日やるべきルーチンが無かった場合
  if (tasksToInject.length === 0) {
    return { updatedTasks: existingTasks, isGenerated: true, todayStr };
  }

  // 3. 新しいタスクの生成
  const newTasks: Task[] = [];
  let currentOrder = existingTasks.length; // 既存タスクの末尾に追加するため

  tasksToInject.forEach((r) => {
    let deadlineStr: string | undefined = undefined;

    // 期日の計算ロジック
    if (r.deadlineRule === 'today') {
      deadlineStr = formatDate.toMD(today);
    } else if (r.deadlineRule !== 'none') {
      const targetDate = getNextDateOfDay(r.deadlineRule, today);
      deadlineStr = formatDate.toMD(targetDate);
    }

    // Task型の要件を満たしたオブジェクトを生成
    newTasks.push({
      id: `routine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      text: r.text,
      status: 'todo',
      parentId: null,
      order: currentOrder++, // 並び順をインクリメント
      difficulty: 2, // ルーチンのデフォルト難易度
      routineType: r.type,
      routineId: r.id,
      deadline: deadlineStr,
    });
  });

  // 4. 既存タスクと新規タスクをマージして返す
  return {
    updatedTasks: [...existingTasks, ...newTasks],
    isGenerated: true, // 新規生成を行ったフラグ
    todayStr,
  };
};