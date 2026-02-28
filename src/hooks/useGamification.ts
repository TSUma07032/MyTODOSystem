import { useState } from 'react';
import type { Task, GamificationData } from '../types';
import { calculateEarnedCoins } from '../logic/taskLogic';

export const useGamification = (writeFile: (filename: string, content: string) => Promise<void>) => {
  const [gamification, setGamification] = useState<GamificationData>({
    coins: 0,
    shopItems: [
      { id: 'item-1', name: 'ラムネ1個', cost: 50, icon: '🍬' },
      { id: 'item-2', name: 'ゲーム30分', cost: 300, icon: '🎮' },
      { id: 'item-3', name: '罪悪感のない昼寝', cost: 500, icon: '🛌' }
    ]
  });
  const [toast, setToast] = useState<{ message: string; difficulty: number; id: number } | null>(null);
  const [isShopDrawerOpen, setIsShopDrawerOpen] = useState(false);

  // トースト表示ロジック (1機能：ユーザーフィードバック)
  const showToast = (message: string, difficulty: number) => {
    setToast({ message, difficulty, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  // データの永続化を含む更新 (1機能：データ同期)
  const saveGamificationData = async (newData: GamificationData) => {
    setGamification(newData);
    await writeFile('gamification.json', JSON.stringify(newData, null, 2));
  };

  // タスク完了時の報酬処理 (1機能：報酬計算の適用)
  const handleTaskReward = async (task: Task, isChecking: boolean) => {
    const earnedCoins = calculateEarnedCoins(task);
    const newCoins = isChecking 
      ? gamification.coins + earnedCoins 
      : Math.max(0, gamification.coins - earnedCoins);

    await saveGamificationData({ ...gamification, coins: newCoins });
    
    if (isChecking) {
      showToast(`+${earnedCoins} 🪙`, task.difficulty);
    } else {
      showToast(`-${earnedCoins} 🪙`, 1);
    }
  };

  // アイテム購入ロジック (1機能：購買処理)
  const purchaseItem = async (itemId: string) => {
    const item = gamification.shopItems.find(i => i.id === itemId);
    if (!item || gamification.coins < item.cost) return false;

    await saveGamificationData({ ...gamification, coins: gamification.coins - item.cost });
    return item.name;
  };

  return {
    gamification,
    setGamification,
    toast,
    isShopDrawerOpen,
    setIsShopDrawerOpen,
    handleTaskReward,
    purchaseItem
  };
};