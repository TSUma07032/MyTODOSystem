// src/hooks/useGamification.ts
import { useState } from 'react';
import type { GamificationData, Task } from '../types';

const defaultGamification: GamificationData = {
  coins: 0,
  shopItems: [
    { id: 'item-1', name: 'ラムネ1個', cost: 50, icon: '🍬' },
    { id: 'item-2', name: 'ゲーム30分', cost: 300, icon: '🎮' },
    { id: 'item-3', name: '罪悪感のない昼寝', cost: 500, icon: '🛌' }
  ]
};

export const useGamification = (writeFile: (filename: string, content: string) => Promise<void>) => {
  const [gamification, setGamification] = useState<GamificationData>(defaultGamification);
  const [isShopDrawerOpen, setIsShopDrawerOpen] = useState(false);
  const [isShopEditMode, setIsShopEditMode] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  const [editItemData, setEditItemData] = useState({ name: '', cost: 100, icon: '🎁' });
  const [newItemData, setNewItemData] = useState({ name: '', cost: 100, icon: '🎁' });

  // ファイルからの初期データ読み込み用
  const initGamification = (data: GamificationData) => {
    setGamification(data);
  };

  const saveGamificationData = async (newData: GamificationData) => {
    setGamification(newData);
    await writeFile('gamification.json', JSON.stringify(newData, null, 2));
  };

  const handleAddShopItem = async () => {
    if (!newItemData.name.trim()) return;
    const newItem = {
      id: `item-${Date.now()}`,
      name: newItemData.name.trim(),
      cost: Math.max(1, newItemData.cost),
      icon: newItemData.icon || '🎁'
    };
    await saveGamificationData({ ...gamification, shopItems: [...gamification.shopItems, newItem] });
    setNewItemData({ name: '', cost: 100, icon: '🎁' });
  };

  const handleDeleteShopItem = async (id: string) => {
    if (!window.confirm("このアイテムを削除してもよろしいですか？")) return;
    await saveGamificationData({ ...gamification, shopItems: gamification.shopItems.filter(item => item.id !== id) });
  };

  const handleUpdateShopItem = async (id: string) => {
    if (!editItemData.name.trim()) return;
    await saveGamificationData({
      ...gamification,
      shopItems: gamification.shopItems.map(item => item.id === id ? { ...item, ...editItemData } : item)
    });
    setEditingItemId(null);
  };

  const startEditing = (item: any) => {
    setEditingItemId(item.id);
    setEditItemData({ name: item.name, cost: item.cost, icon: item.icon });
  };

  // タスク完了時のコイン計算ロジック（純粋関数的アプローチ）
  const calculateTaskCoins = (task: Task) => {
    let multiplier = 20;
    if (task.routineType === 'daily') multiplier = 5;
    if (task.routineType === 'weekly') multiplier = 10;
    return task.difficulty * multiplier;
  };

  // コインの増減アクション
  const addCoins = async (amount: number) => {
    await saveGamificationData({ ...gamification, coins: gamification.coins + amount });
  };

  const removeCoins = async (amount: number) => {
    await saveGamificationData({ ...gamification, coins: Math.max(0, gamification.coins - amount) });
  };

  return {
    gamification,
    initGamification,
    isShopDrawerOpen, setIsShopDrawerOpen,
    isShopEditMode, setIsShopEditMode,
    editingItemId, setEditingItemId,
    editItemData, setEditItemData,
    newItemData, setNewItemData,
    handleAddShopItem,
    handleDeleteShopItem,
    handleUpdateShopItem,
    startEditing,
    calculateTaskCoins,
    addCoins,
    removeCoins
  };
};