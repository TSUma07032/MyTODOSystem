import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// --- Core UI & Initialization ---
import { Header } from '@/core/components/Header';
import { Toast } from '@/core/components/Toast';
import { useAppInitialization } from '@/core/hooks/useAppInitialization';
import { useFileSystem } from '@/core/hooks/useFileSystem';

// --- Feature Overlays (Drawers) ---
import { RoutineDrawer } from '@/features/routines/components/RoutineDrawer';
import { useRoutines } from '@/features/routines/store/useRoutines';

// --- Views (Pages) ---
import { DashboardView } from '@/views/dashboard/DashboardView';
import { DailyView } from '@/views/daily/DailyView';
import { CalendarView } from '@/views/calendar/CalendarView';
import { PomodoroView } from '@/views/pomodoro/PomodoroView';
import { Sun } from 'lucide-react';
// import { HistoryView } from '@/views/history/HistoryView'; // 追加する場合

/**
 * Headerに現在のパスを「mode」として伝えるためのブリッジコンポーネント
 */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { isReady, pickDirectory } = useFileSystem();
  const { setIsOpen } = useRoutines();

  // 現在のパスをmode名に変換 (例: "/calendar" -> "calendar")
  const currentMode = (location.pathname.split('/')[1] || 'dashboard') as any;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* 1. Headerはサイドバー(w-20)なので、flex-rowで横並びにするのが正解 
         propsはStoreから取得する形にリファクタリング済みならさらに減らせます
      */}
      <Header 
        mode={currentMode}
        setMode={() => {}} // Router経由なので、実際はLinkタグかNavigateで遷移
        themeIcon={Sun}    // modeに応じたアイコンをHeader内で判定しても良い
        themeAccent="orange"
        isReady={isReady}
        onOpenRoutines={() => setIsOpen(true)}
        onConnectFolder={pickDirectory}
      />

      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  // アプリ全体の初期化（データロード等）
  const { isInitialized } = useAppInitialization();

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-400">Initializing System...</p>
      </div>
    );
  }

  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/daily" element={<DailyView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/pomodoro" element={<PomodoroView />} />
          {/* <Route path="/history" element={<HistoryView />} /> */}
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AppLayout>

      {/* グローバル・オーバーレイ */}
      <RoutineDrawer />
      <Toast /> 
    </Router>
  );
};

export default App;