import  { useEffect, useState } from 'react';
import { emit, listen } from '@tauri-apps/api/event';
import { useAppContext, AppContext } from '../../hooks/AppContext';
import { AppLayout } from './AppLayout';
import { TimerLayout } from './TimerLayout';

export const useDisplayMode = () => {
  const isTauriPip = window.location.hash === '#timer';
  const isBrowserPip = !!(window as any).documentPictureInPicture?.windowName; 
  return { isPiP: isTauriPip || isBrowserPip, isTauriPip, isBrowserPip };
};

export const ChoiceLayout = () => {
  const { isPiP, isTauriPip } = useDisplayMode();
  const mainContext = useAppContext(); 

  // ----------------------------------------------------
  // 📡 [メインウィンドウ側] の処理
  // ----------------------------------------------------
  
  // ① 状態が変わるたびに最新データをブロードキャスト
  useEffect(() => {
    if (isTauriPip) return;
    emit('sync-state', {
      pomodoro: mainContext.pomodoro,
      tasks: mainContext.tasks,
      routines: mainContext.routines,
      pomodoroQueue: mainContext.pomodoroQueue,
    });
  }, [mainContext.pomodoro, mainContext.tasks, mainContext.routines, mainContext.pomodoroQueue, isTauriPip]);

  // ② 小窓からの「命令」や「データ要求」を受信
  useEffect(() => {
    if (isTauriPip) return;

    console.log("🟢 [メイン窓] イベントの待機を開始しました");

    // 小窓が「開いたよ！今のデータちょうだい！」と言ってきたら即座に送る
    const unlistenRequest = listen('request-sync-state', () => {
      emit('sync-state', {
        pomodoro: mainContext.pomodoro,
        tasks: mainContext.tasks,
        routines: mainContext.routines,
        pomodoroQueue: mainContext.pomodoroQueue,
      });
    });

    // 小窓でボタンが押された時の処理
    const unlistenAction = listen('sync-action', (event: any) => {
        console.log("🟢 [メイン窓]情報送ったよ～");
      const { action, payload } = event.payload;
      const { pomodoro, controllerProps } = mainContext;

      switch (action) {
        case 'muteAlarm': pomodoro.muteAlarm(); break;
        case 'confirmComplete': pomodoro.confirmComplete(); break;
        case 'confirmExtend': pomodoro.confirmExtend(); break;
        case 'toggleFreeze': pomodoro.toggleFreeze(); break;
        case 'stopEarly': pomodoro.stopEarly(); break;
        case 'startNextInQueue': (controllerProps as any).startNextInQueue(); break;
        case 'onToggleTask': (controllerProps as any).onToggleTask(payload); break;
        case 'onRemoveFromQueue': (controllerProps as any).onRemoveFromQueue(payload); break;
      }
    });

    return () => { 
      unlistenRequest.then(f => f());
      unlistenAction.then(f => f()); 
    };
  }, [mainContext, isTauriPip]); // 最新の mainContext で処理を実行させる


  // ----------------------------------------------------
  // 🔀 表示の分岐
  // ----------------------------------------------------
  if (isTauriPip) {
    return <TauriSubWindowSyncWrapper />;
  }

  if (isPiP) {
    return <TimerLayout />;
  }

  return <AppLayout />;
};

// ====================================================
// 📡 [小窓ウィンドウ側] の処理
// ====================================================
const TauriSubWindowSyncWrapper = () => {
  const [syncedState, setSyncedState] = useState<any>(null);

  useEffect(() => {
    console.log("🟠 [小窓] 起動しました。メイン窓にデータを要求します。");
    // 1. メイン窓から送られてくるデータの受信口を開ける
    const unlisten = listen('sync-state', (event: any) => {
      console.log("🔥 メイン窓からデータ受信:", event.payload);
      setSyncedState(event.payload);
    });

    // 2. 受信口を開けたら、メイン窓に「データ送って！」と叫ぶ
    setTimeout(() => {
      console.log("🟠 [小窓] emit('request-sync-state') を実行！");
      emit('request-sync-state');
    }, 1000);

    return () => { unlisten.then(f => f()); };
  }, []);

  if (!syncedState) {
    return (
      <div className="h-screen w-screen bg-slate-900 text-white flex items-center justify-center font-bold">
        通信待機中...
      </div>
    );
  }

  // 小窓からメイン窓を遠隔操作するための「リモコン」
  const proxyContextValue = {
    ...syncedState,
    pomodoro: {
      ...syncedState.pomodoro,
      muteAlarm: () => emit('sync-action', { action: 'muteAlarm' }),
      confirmComplete: () => emit('sync-action', { action: 'confirmComplete' }),
      confirmExtend: () => emit('sync-action', { action: 'confirmExtend' }),
      toggleFreeze: () => emit('sync-action', { action: 'toggleFreeze' }),
      stopEarly: () => emit('sync-action', { action: 'stopEarly' }),
    },
    controllerProps: {
      startNextInQueue: () => emit('sync-action', { action: 'startNextInQueue' }),
      onToggleTask: (id: string) => emit('sync-action', { action: 'onToggleTask', payload: id }),
      onRemoveFromQueue: (id: string) => emit('sync-action', { action: 'onRemoveFromQueue', payload: id }),
    }
  };

  return (
    <AppContext.Provider value={proxyContextValue as any}>
      <TimerLayout />
    </AppContext.Provider>
  );
};