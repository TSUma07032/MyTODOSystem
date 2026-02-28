// src/hooks/useInfrastructure.ts
import { useState } from 'react';
// date-fns をインポート追加
import { differenceInDays, format } from 'date-fns';
import type { InfrastructureModule } from '../types';
import { generateRandomModule } from '../logic/infrastructureGenerator';

export const useInfrastructure = (
  coins: number,
  addCoins: (amount: number) => Promise<void>,    // 👈 追加 (不労所得用)
  removeCoins: (amount: number) => Promise<void>,
  writeFile: (filename: string, content: string) => Promise<void>
) => {
  const [modules, setModules] = useState<InfrastructureModule[]>([]);
  const [debt, setDebt] = useState<number>(0);
  const [lastSettlementDate, setLastSettlementDate] = useState<string>(format(new Date(), 'yyyy-MM-dd')); // 👈 追加

  
  // 初期化
  const initInfrastructure = (savedModules: InfrastructureModule[], savedDebt: number, savedDate?: string) => {
    setModules(savedModules);
    setDebt(savedDebt);
    if (savedDate) setLastSettlementDate(savedDate);
  };

  const saveInfrastructure = async (newModules: InfrastructureModule[], newDebt: number, newDate: string) => {
    setModules(newModules);
    setDebt(newDebt);
    setLastSettlementDate(newDate);
    await writeFile('infrastructure.json', JSON.stringify({ modules: newModules, debt: newDebt, lastSettlementDate: newDate }, null, 2));
  };

  // 👇 修正：レベルアップコストの計算式（現在の基礎値 × 10倍）
  const calculateUpgradeCost = (mod: InfrastructureModule) => {
    return Math.floor((mod.baseIncome + mod.baseMaintenance) * mod.level * 10);
  };

  const upgradeModule = async (id: string, currentCoins: number) => {
    const targetModule = modules.find(m => m.id === id);
    if (!targetModule) return false;
    if (targetModule.level >= 10) return false;

    const cost = calculateUpgradeCost(targetModule); // 変更
    if (currentCoins < cost) return false;

    await removeCoins(cost);
    const newModules = modules.map(mod => 
      mod.id === id ? { ...mod, level: mod.level + 1 } as InfrastructureModule : mod
    );
    await saveInfrastructure(newModules, debt, lastSettlementDate);
    return true;
  };

  // 🌟 【転生】交配（Breeding / Resonance）システムの改修
  const resonateModule = async (id: string) => {
    const target = modules.find(m => m.id === id);
    if (!target || target.level < 10) return null;

    const partner = modules.find(m => m.id !== id && m.level >= 10);
    if (!partner) {
      alert("共鳴（配合）には、もう一つレベル10のモジュールが必要です！");
      return null;
    }

    // --- 1. 子供のステータス計算 ---
    // 💡 子供のランク：両親の平均値（切り上げ）＋ 1 （子供だけが強くなる！）
    const childRank = Math.ceil((target.rank + partner.rank) / 2) + 1;

    const baseChild = generateRandomModule(); 

    // レアリティと色は親からランダム遺伝
    const childRarity = Math.random() > 0.5 ? target.rarity : partner.rarity;
    const childColor = Math.random() > 0.5 ? target.color : partner.color;

    // 基礎値の遺伝（平均値 × 0.7〜1.3 の揺らぎ）
    const avgIncome = (target.baseIncome + partner.baseIncome) / 2;
    const avgMultiplier = (target.baseMultiplier + partner.baseMultiplier) / 2;
    const avgMaintenance = (target.baseMaintenance + partner.baseMaintenance) / 2;

    // 新たな世代の誕生
    const newChild: InfrastructureModule = {
      ...baseChild,
      name: `[Gen ${childRank}] ${baseChild.name}`, // 名前に世代（ランク）を刻む！
      level: 1,
      rank: childRank, // 👈 子供がランクを引き継ぐ
      rarity: childRarity,
      color: childColor,
      baseIncome: Math.floor(avgIncome * (0.7 + Math.random() * 0.6)),
      baseMultiplier: Number((avgMultiplier * (0.7 + Math.random() * 0.6)).toFixed(3)),
      baseMaintenance: Math.floor(avgMaintenance * (1.0 + Math.random() * 0.2)), // 維持費は悪化しやすい
      status: 'off' 
    };

    // --- 2. 親の処理 ---
    const newModules = modules.map(m => {
      if (m.id === target.id || m.id === partner.id) {
        return {
          ...m,
          level: 1 // 💡 レベルは1に戻るが、rank はそのまま（増加しない）！
        };
      }
      return m;
    });

    // 3. データを保存
    newModules.push(newChild);
    await saveInfrastructure(newModules, debt, lastSettlementDate);
    
    return newChild.name; 
  };

  
  // ⚖️ 【大清算ロジック】ログイン時に App.tsx から呼び出される
  const processSettlement = async (currentCoins: number) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (lastSettlementDate === todayStr || modules.length === 0) return null; // 今日すでに清算済み、またはモジュールなしなら無視

    const daysPassed = differenceInDays(new Date(todayStr), new Date(lastSettlementDate));
    if (daysPassed <= 0) return null;

    // 1日あたりの計算
    const dailyIncome = modules.filter(m => m.status === 'on').reduce((sum, m) => 
      sum + (m.baseIncome * m.level * (1 + m.rank * 0.2) * (m.currentIncomeMultiplier || 1.0)), 0
    );
    // 💡 維持費はランク1につき +25% (0.25) に悪化
    const dailyMaintenance = modules.reduce((sum, m) => 
      sum + (m.baseMaintenance * m.level * (m.status === 'on' ? 1.0 : 0.1)) * (1 + m.rank * 0.25) * (m.currentMaintenanceMultiplier || 1.0), 0
    );

    // 経過日数分を掛ける
    const totalIncome = dailyIncome * daysPassed;
    const totalMaintenance = dailyMaintenance * daysPassed;
    const netDifference = Math.floor(totalIncome - totalMaintenance);

    let newDebt = debt;
    let actualCoinChange = 0;

    if (netDifference > 0) {
      // 黒字の場合（借金があれば先に返済）
      if (newDebt > 0) {
        if (netDifference >= newDebt) {
          actualCoinChange = netDifference - newDebt;
          newDebt = 0;
        } else {
          newDebt -= netDifference;
          actualCoinChange = 0; // 全額返済に消えた
        }
      } else {
        actualCoinChange = netDifference;
      }
      if (actualCoinChange > 0) await addCoins(actualCoinChange);
    } 
    else if (netDifference < 0) {
      // 赤字の場合（維持費が払えないと借金になる）
      const deficit = Math.abs(netDifference);
      if (currentCoins >= deficit) {
        await removeCoins(deficit); // 払えるなら普通に払う
        actualCoinChange = netDifference;
      } else {
        // 払えない分は借金に！全財産没収！
        actualCoinChange = -currentCoins; 
        newDebt += (deficit - currentCoins);
        await removeCoins(currentCoins); 
      }
    }

    const updatedModules = modules.map(m => ({
      ...m,
      currentIncomeMultiplier: Number((1.0 + Math.random() * 1.0).toFixed(2)),    // 1.0 ~ 2.0
      currentMaintenanceMultiplier: Number((1.0 + Math.random() * 4.0).toFixed(2)) // 1.0 ~ 5.0
    }));

    // 保存して日付を更新
    await saveInfrastructure(updatedModules, newDebt, todayStr);

    return { daysPassed, totalIncome, totalMaintenance, netDifference, newDebt };
  };

  // 💰 モジュールの発掘（ガチャ）
  const mineModule = async () => {
    const cost = 500; // 発掘コスト
    if (coins < cost) {
      alert("コインが足りません！");
      return null;
    }

    await removeCoins(cost);
    const newModule = generateRandomModule();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    await saveInfrastructure([...modules, newModule], debt, todayStr);
    
    return newModule; // UI側でトーストや派手な演出を出すために返す
  };

  // 🔌 モジュールのON/OFF切り替え
  const toggleModuleStatus = async (id: string, currentCoins: number) => {
    const targetModule = modules.find(m => m.id === id);
    if (!targetModule) return false;

    if (targetModule.status === 'off') {
      // 💡 起動コスト（Activation Cost）: 維持費1日分を要求
      const activationCost = targetModule.baseMaintenance * targetModule.level;

      if (currentCoins < activationCost) {
        alert(`[SYSTEM ERROR] 起動電力が不足しています。(必要: ${activationCost} 🪙)`);
        return false; // コイン不足でONにできない
      }
      
      // コストを支払う
      await removeCoins(activationCost);
      alert(`起動電力 ${activationCost} 🪙 を消費し、システムをオンラインにしました。`); 
      // ※alertが鬱陶しい場合は消してもOKです
    }

    const newModules = modules.map(mod => 
      mod.id === id ? { ...mod, status: mod.status === 'on' ? 'off' : 'on' } as InfrastructureModule : mod
    );
    // lastSettlementDate を忘れずに渡す
    await saveInfrastructure(newModules, debt, lastSettlementDate);
    return true;
  };

  const sellModule = async (id: string) => {
    const target = modules.find(m => m.id === id);
    if (!target) return false;

    // 売却価格の計算：(基礎収入 × レベル × ランク補正 × 相場) × 3日分
    const sellPrice = Math.floor(
      target.baseIncome * target.level * (1 + target.rank * 0.2) * (target.currentIncomeMultiplier || 1.0)
    ) * 3;

    // コインを付与
    await addCoins(sellPrice);

    // モジュールを削除して保存
    const newModules = modules.filter(m => m.id !== id);
    await saveInfrastructure(newModules, debt, lastSettlementDate);
    
    return sellPrice; // トースト通知用に金額を返す
  };

  // 💸 追加：借金の直接返済（タスク完了時の天引き用）
  const repayDebt = async (amount: number) => {
    const newDebt = Math.max(0, debt - amount); // マイナスにならないように
    await saveInfrastructure(modules, newDebt, lastSettlementDate);
    return newDebt;
  };

  return {
    modules,
    debt,
    lastSettlementDate,    
    initInfrastructure,
    mineModule,
    toggleModuleStatus,
    processSettlement,
    upgradeModule, 
    resonateModule,
    sellModule,
    repayDebt
  };
};