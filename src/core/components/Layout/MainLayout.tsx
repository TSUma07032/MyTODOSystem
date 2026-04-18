import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Timer, Calendar, FolderSync, FolderOpen } from 'lucide-react';

export const MainLayout = ({ fs }: any) => {
  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 z-50">
        <nav className="flex items-center gap-1">
          <NavLink to="/dashboard" className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${isActive ? 'bg-orange-50 text-orange-600' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-4 h-4" /> Missions
          </NavLink>
          <NavLink to="/pomodoro" className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${isActive ? 'bg-orange-50 text-orange-600' : 'text-slate-400'}`}>
            <Timer className="w-4 h-4" /> Focus
          </NavLink>
          <NavLink to="/calendar" className={({isActive}) => `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${isActive ? 'bg-orange-50 text-orange-600' : 'text-slate-400'}`}>
            <Calendar className="w-4 h-4" /> Schedule
          </NavLink>
        </nav>

        <button 
          onClick={!fs.dirHandle ? fs.pickDirectory : fs.verifyPermission}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${fs.isReady ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100 animate-pulse'}`}
        >
          {fs.isReady ? <FolderSync className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
          {fs.isReady ? "Connected" : "Connect Folder"}
        </button>
      </header>
      <main className="flex-1 overflow-hidden"><Outlet /></main>
    </div>
  );
};