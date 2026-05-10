// src/components/features/shop/ShopDrawer.tsx
import React from 'react';
import { ShoppingCart, Coins, Settings2, Plus, Edit2, Trash2, Save } from 'lucide-react';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import type { GamificationData } from '../../../types';

interface ShopDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gamification: GamificationData;
  isShopEditMode: boolean;
  setIsShopEditMode: (val: boolean) => void;
  editingItemId: string | null;
  setEditingItemId: (val: string | null) => void;
  editItemData: { name: string; cost: number; icon: string };
  setEditItemData: (val: any) => void;
  newItemData: { name: string; cost: number; icon: string };
  setNewItemData: (val: any) => void;
  handleAddShopItem: () => void;
  handleDeleteShopItem: (id: string) => void;
  handleUpdateShopItem: (id: string) => void;
  startEditing: (item: any) => void;
  removeCoins: (amount: number) => void;
}

export const ShopDrawer: React.FC<ShopDrawerProps> = ({
  isOpen, onClose, gamification, isShopEditMode, setIsShopEditMode,
  editingItemId, setEditingItemId, editItemData, setEditItemData,
  newItemData, setNewItemData, handleAddShopItem, handleDeleteShopItem,
  handleUpdateShopItem, startEditing, removeCoins
}) => {
  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Reward Shop" 
      icon={<ShoppingCart className="w-5 h-5" />}
      headerColorClass="bg-yellow-50 text-yellow-700 border-yellow-100"
    >
      {/* 編集モード切り替えボタン（ヘッダーの横に配置したいので、暫定的にここに配置） */}
      <div className="absolute top-3 right-14">
        <button 
          onClick={() => { setIsShopEditMode(!isShopEditMode); setEditingItemId(null); }} 
          className={`p-2 rounded-full transition-colors ${isShopEditMode ? 'bg-yellow-200 text-yellow-800' : 'hover:bg-yellow-100 text-yellow-600'}`}
          title="Edit Shop Items"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* 現在のコイン残高 */}
      <div className="mb-4 p-6 text-center rounded-xl border border-gray-100 bg-white shadow-sm">
        <p className="text-xs text-gray-500 font-bold mb-1">YOUR COINS</p>
        <div className="text-4xl font-black text-yellow-500 flex items-center justify-center gap-2">
          <Coins className="w-8 h-8 fill-yellow-400" />
          {gamification.coins.toLocaleString()}
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {/* 新規追加フォーム（編集モード時のみ） */}
        {isShopEditMode && (
          <div className="p-3 bg-white rounded-xl border-2 border-dashed border-yellow-300 shadow-sm flex flex-col gap-2 mb-4 animate-fadeIn">
            <p className="text-xs font-bold text-yellow-600 uppercase">Add New Reward</p>
            <div className="flex gap-2">
              <input type="text" placeholder="Icon (e.g. 🍺)" value={newItemData.icon} onChange={e => setNewItemData({...newItemData, icon: e.target.value})} className="w-12 text-center bg-gray-50 border border-gray-200 rounded-lg text-lg focus:border-yellow-400 outline-none" />
              <input type="text" placeholder="Reward Name" value={newItemData.name} onChange={e => setNewItemData({...newItemData, name: e.target.value})} className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-yellow-400 outline-none" />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs font-bold text-gray-400">Cost:</span>
              <input type="number" min="1" value={newItemData.cost} onChange={e => setNewItemData({...newItemData, cost: Number(e.target.value)})} className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-yellow-400 outline-none" />
              <span className="text-xs text-yellow-600 font-bold">🪙</span>
              <div className="flex-1" />
              <Button size="sm" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500" onClick={handleAddShopItem} icon={<Plus className="w-4 h-4" />}>
                Add
              </Button>
            </div>
          </div>
        )}

        {/* アイテムリスト */}
        {gamification.shopItems.map(item => (
          <div key={item.id} className="flex flex-col p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-yellow-200 hover:shadow-md transition-all group">
            {editingItemId === item.id ? (
              // インライン編集モード
              <div className="flex flex-col gap-2 animate-fadeIn">
                <div className="flex gap-2">
                  <input type="text" value={editItemData.icon} onChange={e => setEditItemData({...editItemData, icon: e.target.value})} className="w-12 text-center bg-yellow-50 border border-yellow-200 rounded-lg text-lg outline-none" />
                  <input type="text" value={editItemData.name} onChange={e => setEditItemData({...editItemData, name: e.target.value})} className="flex-1 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-sm font-bold outline-none" autoFocus />
                </div>
                <div className="flex gap-2 items-center justify-end">
                  <input type="number" min="1" value={editItemData.cost} onChange={e => setEditItemData({...editItemData, cost: Number(e.target.value)})} className="w-20 px-2 py-1 bg-yellow-50 border border-yellow-200 rounded-lg text-sm outline-none" />
                  <span className="text-xs text-yellow-600 font-bold mr-2">🪙</span>
                  <button onClick={() => setEditingItemId(null)} className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <Button size="sm" variant="primary" className="bg-green-500 hover:bg-green-600" onClick={() => handleUpdateShopItem(item.id)} icon={<Save className="w-4 h-4"/>}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              // 通常表示
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-bold text-sm text-gray-700">{item.name}</span>
                </div>
                
                {isShopEditMode ? (
                  // 編集モードのアクション
                  <div className="flex gap-1">
                    <IconButton variant="ghost" className="text-blue-400 hover:bg-blue-50" onClick={() => startEditing(item)}><Edit2 className="w-4 h-4" /></IconButton>
                    <IconButton variant="danger" onClick={() => handleDeleteShopItem(item.id)}><Trash2 className="w-4 h-4" /></IconButton>
                  </div>
                ) : (
                  // 購入ボタン
                  <Button 
                    size="sm"
                    className={gamification.coins >= item.cost ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500' : 'bg-gray-100 text-gray-400'}
                    disabled={gamification.coins < item.cost}
                    onClick={() => {
                      if (gamification.coins >= item.cost) {
                        removeCoins(item.cost);
                        alert(`🎉 「${item.name}」を購入しました！自分へのご褒美を楽しんで！`);
                      }
                    }}
                  >
                    {item.cost} 🪙
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Drawer>
  );
};