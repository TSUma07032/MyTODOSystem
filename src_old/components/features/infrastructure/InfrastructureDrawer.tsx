// src/components/features/infrastructure/InfrastructureDrawer.tsx
import React from 'react';
import { Server,ArrowUpCircle ,Power, AlertTriangle, Cpu, TrendingUp, TrendingDown, Pickaxe, Sparkles, Trash2 } from 'lucide-react';
import { Drawer } from '../../ui/Drawer';
import { Button } from '../../ui/Button';
import type { InfrastructureModule } from '../../../types';

interface InfrastructureDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  modules: InfrastructureModule[];
  debt: number;
  coins: number;
  onMine: () => Promise<void>;
  onToggleStatus: (id: string, currentCoins: number) => Promise<boolean>;
  onUpgrade: (id: string, currentCoins: number) => Promise<boolean>;
  onResonate: (id: string) => Promise<string | null>;
  onSell: (id: string) => Promise<number | false>;
}

export const InfrastructureDrawer: React.FC<InfrastructureDrawerProps> = ({
  isOpen, onClose, modules, debt, coins, onMine, onToggleStatus, onUpgrade, onResonate, onSell
}) => {
    const lv10Count = modules.filter(m => m.level >= 10).length;
    const canResonateGlobal = lv10Count >= 2;

  // 現在の「稼働状況（Net Income）」を計算
  const totalIncome = modules
    .filter(m => m.status === 'on')
    .reduce((sum, m) => sum + (m.baseIncome * m.level * (1 + m.rank * 0.2) * (m.currentIncomeMultiplier || 1.0)), 0);
    
  const totalMaintenance = modules.reduce((sum, m) => {
    return sum + (m.baseMaintenance * m.level * (m.status === 'on' ? 1.0 : 0.1) * (1 + m.rank * 0.25) * (m.currentMaintenanceMultiplier || 1.0));
  }, 0);

  const netIncome = totalIncome - totalMaintenance;

  return (
    <Drawer 
      isOpen={isOpen} 
      onClose={onClose} 
      title="THE CORE - System Infrastructure" 
      icon={<Server className="w-5 h-5" />}
      headerColorClass="bg-slate-900 text-cyan-400 border-slate-800"
    >
      <div className="flex flex-col gap-4 h-full bg-slate-50">
        
        {/* サマリー（稼働状況・借金）ダッシュボード */}
        <div className="bg-slate-900 text-slate-300 p-4 rounded-xl shadow-inner relative overflow-hidden">
          {/* 背景の装飾 */}
          <Cpu className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-800 opacity-50" />
          
          <div className="relative z-10 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 tracking-widest uppercase">System Status</h3>
            
            {/* 借金アラート */}
            {debt > 0 && (
              <div className="flex items-center justify-between p-2 bg-red-950/50 border border-red-900/50 rounded-lg">
                <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" /> SYSTEM DEBT
                </div>
                <span className="text-red-400 font-mono font-bold">-{debt.toLocaleString()} 🪙</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold mb-1">Gross Income / Day</p>
                <p className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +{Math.floor(totalIncome)}
                </p>
              </div>
              <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold mb-1">Maintenance / Day</p>
                <p className="text-orange-400 font-mono font-bold flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> -{Math.floor(totalMaintenance)}
                </p>
              </div>
            </div>

            <div className={`p-2 rounded-lg border text-center font-bold text-lg font-mono flex items-center justify-center gap-2 ${netIncome >= 0 ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" : "bg-red-950/30 text-red-400 border-red-900/50"}`}>
              {netIncome >= 0 ? "+" : ""}{Math.floor(netIncome)} 🪙 / Day
            </div>
          </div>
        </div>

        {/* ガチャ（採掘）ボタン */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2 items-center text-center">
          <p className="text-xs font-bold text-slate-500">
            新たなインフラモジュールを発掘し、システムを拡張します。<br/>
            (Cost: 500 🪙)
          </p>
          <Button 
            onClick={onMine} 
            disabled={coins < 500}
            className={`w-full py-3 text-sm tracking-wider ${coins >= 500 ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/25" : "bg-slate-200 text-slate-400"}`}
            icon={<Pickaxe className="w-4 h-4" />}
          >
            MINE NEW MODULE
          </Button>
        </div>

        {/* モジュールリスト */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Installed Modules ({modules.length})</h3>
          
          {modules.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm font-bold">
              No modules installed.<br/> Start mining to upgrade your core.
            </div>
          ) : (
            modules.map(mod => {
            const isOn = mod.status === 'on';
            const isMaxLevel = mod.level >= 10;
                
            // 👇 コスト計算を新仕様に！
            const upgradeCost = Math.floor((mod.baseIncome + mod.baseMaintenance) * mod.level * 10); 
            const canAffordUpgrade = coins >= upgradeCost;

            // 💡 転生の旨味（ランク補正）の計算式
            const rankIncomeBonus = 1 + mod.rank * 0.2; // ランクごとに +20%
            const rankCostBonus = 1 + mod.rank * 0.25;   // ランクごとに +25%

            // map の中で、計算を変数にまとめておく（コードをスッキリさせる）
            const currentIncome = Math.floor(mod.baseIncome * mod.level * rankIncomeBonus * (mod.currentIncomeMultiplier || 1.0));
        
            // 💡 修正後：ONなら 1.0、OFFなら 0.1 を掛ける
            const currentCost = Math.floor(mod.baseMaintenance * mod.level * (isOn ? 1.0 : 0.1) * rankCostBonus * (mod.currentMaintenanceMultiplier || 1.0));
        
            const currentBoost = (mod.baseMultiplier * mod.level * rankIncomeBonus).toFixed(2);
              
              // レアリティに応じた枠線の色
              const borderColors = {
                Common: 'border-slate-200',
                Rare: 'border-blue-300',
                Epic: 'border-purple-400',
                Legendary: 'border-yellow-400'
              };

              return (
                <div key={mod.id} className={`flex flex-col p-3 bg-white rounded-xl border-2 transition-all ${isOn ? borderColors[mod.rarity] + ' shadow-md' : 'border-slate-100 opacity-60 grayscale-[50%]'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-sm ${mod.color} bg-slate-50 border border-current opacity-80 mb-1 inline-block`}>
                        {mod.rarity}
                      </span>
                      <h4 className={`font-black text-sm ${isOn ? 'text-slate-800' : 'text-slate-500'}`}>{mod.name}</h4>
                      <div className="text-[10px] font-bold text-slate-400 mt-0.5 flex gap-2">
                         <span>Lv.{mod.level}</span>
                         {mod.rank > 0 && <span className="text-yellow-500">★{mod.rank}</span>}
                      </div>
                    </div>

                    <button 
                    onClick={() => {
                      // 売却価格を計算して確認ダイアログを出す
                      const sellPrice = Math.floor(mod.baseIncome * mod.level * (1 + mod.rank * 0.2) * (mod.currentIncomeMultiplier || 1.0)) * 3;
                      if (window.confirm(`このモジュールを ${sellPrice} 🪙 で売却しますか？`)) {
                        onSell(mod.id);
                      }
                    }}
                    className="p-2 rounded-full bg-slate-100 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all"
                    title="売却"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                    
                    {/* 電源トグルボタン */}
                    <button 
                      // 🚨 ここを修正: 引数に coins を追加！
                      onClick={() => onToggleStatus(mod.id, coins)}
                      className={`p-2 rounded-full transition-all ${isOn ? "bg-cyan-100 text-cyan-600 hover:bg-cyan-200" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </div>

                  {/* ステータス詳細 */}
                    {/* 👇 ステータス詳細の表示修正（Boostにもレベルとランクを掛ける） */}
                  <div className="grid grid-cols-3 gap-1 mt-2 text-[10px] font-mono">
                    <div className="bg-slate-50 p-1.5 rounded text-center">
                      <span className="block text-slate-400 mb-0.5">INCOME</span>
                      <span className="text-emerald-600 font-bold">+{currentIncome}</span>
                      {/* 👇 追加：相場（変動値）を表示 */}
                      <span className="block text-[9px] text-emerald-400 font-bold mt-0.5">
                        ({(mod.currentIncomeMultiplier || 1.0).toFixed(2)}x)
                      </span>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded text-center">
                      <span className="block text-slate-400 mb-0.5">COST</span>
                      <span className="text-orange-500 font-bold">-{currentCost}</span>
                      {/* 👇 追加：相場（変動値）を表示。高いと赤くする */}
                      <span className={`block text-[9px] font-bold mt-0.5 ${(mod.currentMaintenanceMultiplier || 1.0) >= 3.0 ? "text-red-500 animate-pulse" : "text-orange-400"}`}>
                        ({(mod.currentMaintenanceMultiplier || 1.0).toFixed(2)}x)
                      </span>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded text-center">
                      <span className="block text-slate-400 mb-0.5">BOOST</span>
                      <span className="text-blue-600 font-bold">x{currentBoost}</span>
                    </div>
                  </div>
                  
            {/* 👇 アクションボタンエリアの修正 */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
              <div className="text-[10px] text-slate-400 font-bold">
                {isMaxLevel ? (
                  <span className="text-yellow-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> RESONANCE READY
                  </span>
                ) : (
                  <span>UPGRADE: <span className={canAffordUpgrade ? "text-slate-700" : "text-red-400"}>{upgradeCost.toLocaleString()} 🪙</span></span>
                )}
              </div>
              
              {isMaxLevel ? (
                // 🌟 Lv10の場合：共鳴（転生）ボタン
                <button
                  onClick={() => onResonate(mod.id)}
                  disabled={!canResonateGlobal}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    canResonateGlobal 
                      ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md hover:scale-105" 
                      : "bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {canResonateGlobal ? "RESONATE" : "NEED PARTNER"}
                </button>
              ) : (
                // 🔼 通常のレベルアップボタン
                <button
                  onClick={() => onUpgrade(mod.id, coins)}
                  disabled={!canAffordUpgrade}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    canAffordUpgrade 
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hover:scale-105 active:scale-95" 
                      : "bg-slate-100 text-slate-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" /> LEVEL UP
                </button>
              )}
            </div>
            
                </div>
              );
            })
          )}
        </div>

      </div>
    </Drawer>
  );
};