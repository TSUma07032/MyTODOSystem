import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFileSystem } from './core/hooks/useFileSystem';
import { MainLayout } from './core/components/Layout/MainLayout';
import { DashboardView } from './views/dashboard/DashboardView';
import { PomodoroView } from './views/pomodoro/PomodoroView';
import { CalendarView } from './views/calendar/CalendarView';

export const App = () => {
  const fs = useFileSystem();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout fs={fs} />}>
          <Route path="/dashboard" element={<DashboardView readFile={fs.readFile} writeFile={fs.writeFile} isReady={fs.isReady} />} />
          <Route path="/pomodoro" element={<PomodoroView readFile={fs.readFile}  writeFile={fs.writeFile} isReady={fs.isReady} />} />
          <Route path="/calendar" element={<CalendarView readFile={fs.readFile} writeFile={fs.writeFile} isReady={fs.isReady} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;