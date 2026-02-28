// src/logic/infrastructureGenerator.ts

import type { InfrastructureModule } from '../types';

// ハクスラ風・命名辞書
const PREFIXES = [
  { text: "古びた", weight: 50 }, { text: "量産型", weight: 40 },
  { text: "高冷却", weight: 20 }, { text: "深淵の", weight: 10 },
  { text: "神殺しの", weight: 2 }, { text: "量子", weight: 5 }
];

const CORES = [
  "CPU", "演算ユニット", "冷却ファン", "マザーボード", "ニューラルコア", "魔導バッテリー"
];

const SUFFIXES = [
  { text: " Mk-II", weight: 30 }, { text: " (ジャンク品)", weight: 40 },
  { text: " - Overclocked", weight: 20 }, { text: " [PROTYPE]", weight: 10 }
];

// 重み付き抽選関数
const getRandomWeighted = <T extends { text: string; weight: number }>(items: T[]): string => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    if (random < item.weight) return item.text;
    random -= item.weight;
  }
  return items[0].text;
};

// ランダムジェネレーター本体
export const generateRandomModule = (): InfrastructureModule => {
  // 1. レアリティの抽選 (確率: Common 60%, Rare 25%, Epic 10%, Legendary 5%)
  const r = Math.random();
  let rarity: InfrastructureModule['rarity'] = 'Common';
  let color = 'text-slate-400';
  let powerMultiplier = 1.0;

  if (r > 0.95) { rarity = 'Legendary'; color = 'text-yellow-500'; powerMultiplier = 3.0; }
  else if (r > 0.85) { rarity = 'Epic'; color = 'text-purple-500'; powerMultiplier = 2.0; }
  else if (r > 0.60) { rarity = 'Rare'; color = 'text-blue-500'; powerMultiplier = 1.4; }

  // 2. 名前の生成
  const prefix = getRandomWeighted(PREFIXES);
  const core = CORES[Math.floor(Math.random() * CORES.length)];
  const hasSuffix = Math.random() > 0.5; // 50%の確率で接尾辞が付く
  const suffix = hasSuffix ? getRandomWeighted(SUFFIXES) : "";
  
  const name = `${prefix}${core}${suffix}`;

  // 3. ステータスの生成（基礎値にゆらぎを持たせる）
  // 基礎所得: 10〜30 * レアリティ倍率
  const baseIncome = Math.floor((10 + Math.random() * 20) * powerMultiplier);
  
  // 倍率: 0.01〜0.05 * レアリティ倍率 (小数点3桁まで)
  const baseMultiplier = Number(((0.01 + Math.random() * 0.04) * powerMultiplier).toFixed(3));
  
  // 維持費: 所得の 30% 〜 80% (高性能なほど維持費のブレが恐ろしいことに)
  const maintenanceRatio = 0.3 + Math.random() * 0.5;
  const baseMaintenance = 5 + Math.max(5, Math.floor(baseIncome * maintenanceRatio));

  return {
    id: `mod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    level: 1,
    rank: 0,
    status: 'off', // 買った時は安全のためOFFにしておく
    baseIncome,
    baseMultiplier,
    baseMaintenance,
    rarity,
    color,
    currentIncomeMultiplier: 1.0,
    currentMaintenanceMultiplier: 1.0
  };
};