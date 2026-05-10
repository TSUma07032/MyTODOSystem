import { Header } from './Header';
import { ViewContainer } from './ViewContainer';
import { RoutineDrawer } from '../features/routines/RoutineDrawer';
import { Toast } from '../ui/Toast';
import { useAppContext } from '../../hooks/AppContext';

export const AppLayout = () => {
  const {
    mode, setMode, isSyncing, copied, toast, themeConfig, isReady, dirHandle,
    pomodoro, routines, isRoutineDrawerOpen,
    setIsRoutineDrawerOpen, handleSyncAndSave, handleCopy, pickDirectory, verifyPermission
  } = useAppContext();

  return (
    <div className={`h-screen flex font-sans transition-all duration-700 animate-gradient-flow ${themeConfig.bg}`}>
      {toast && <Toast message={toast.message} difficulty={toast.difficulty} />}

      <Header 
        mode={mode} setMode={setMode} 
        themeIcon={themeConfig.icon} themeAccent={themeConfig.accent} 
        isReady={isReady} isSyncing={isSyncing} copied={copied}
        onOpenRoutines={() => setIsRoutineDrawerOpen(true)} 
        onConnectFolder={!dirHandle ? pickDirectory : verifyPermission} 
        onCopy={handleCopy} onSync={handleSyncAndSave}
        pomodoro={pomodoro}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative animate-fadeIn">
        <ViewContainer />
      </div>

      <RoutineDrawer 
        isOpen={isRoutineDrawerOpen} 
        onClose={() => setIsRoutineDrawerOpen(false)} 
      />
    </div>
  );
};