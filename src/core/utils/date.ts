// src/core/utils/date.ts
import { format, addDays, getDay } from 'date-fns';

// アプリ全体で使う曜日の厳密な型定義（ここで定義しておけば各Featureで使い回せます）
export type DayOfWeek = 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';

const DAYS_MAP: Record<DayOfWeek, number> = {
  'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
};

/**
 * 指定した日付が、ターゲットの曜日かどうかを判定します。
 */
export const isTargetDayOfWeek = (targetDay: DayOfWeek, date: Date = new Date()): boolean => {
  return getDay(date) === DAYS_MAP[targetDay];
};

/**
 * 基準日から「次の指定曜日」まで何日あるかを計算します（今日がその曜日なら0を返します）。
 */
export const getDaysUntilNext = (targetDay: DayOfWeek, fromDate: Date = new Date()): number => {
  let diff = DAYS_MAP[targetDay] - getDay(fromDate);
  if (diff < 0) diff += 7; // すでに過ぎていたら来週へ
  return diff;
};

/**
 * 基準日から「次の指定曜日」の Date オブジェクトを取得します。
 */
export const getNextDateOfDay = (targetDay: DayOfWeek, fromDate: Date = new Date()): Date => {
  const diff = getDaysUntilNext(targetDay, fromDate);
  return addDays(fromDate, diff);
};

/**
 * アプリ内で統一して使う日付フォーマット群
 * （フォーマットの揺れを防ぐためのラッパー）
 */
export const formatDate = {
  toYMD: (date: Date = new Date()) => format(date, 'yyyy-MM-dd'), // 例: "2026-04-18"
  toMD:  (date: Date = new Date()) => format(date, 'M/d'),        // 例: "4/18"
  toDow: (date: Date = new Date()) => format(date, 'E') as DayOfWeek, // 例: "Sat"
};