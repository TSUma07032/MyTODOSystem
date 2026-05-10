import React, { createContext, useContext, type ReactNode } from 'react';
import { useAppController } from './useAppController';

/**
 * useAppController が返す型の定義
 * (実際の型は useAppController の実装に合わせて調整してください)
 */
type AppContextType = ReturnType<typeof useAppController>;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const controller = useAppController();
  return (
    <AppContext.Provider value={controller}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};