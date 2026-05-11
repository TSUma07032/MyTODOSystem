// 小画面の内タイマーレイアウトのみ管理


import React from 'react';
import { useAppContext } from '../../hooks/AppContext';
import { PomodoroView } from '../views/PomodoroView';

export const TimerLayout: React.FC = () => {
  const {
    pomodoro,tasks,routines,pomodoroQueue, controllerProps
  } = useAppContext(); //routinは使わなくなった

  const {
    onAddToQueue,
    onRemoveFromQueue, onUpdateWorkTime, onToggleDaily,
    addCoins,
  } = controllerProps as any;


    return (
      <div data-tauri-drag-region className={`h-screen w-screen flex items-center justify-center font-sans transition-all duration-700 animate-gradient-flow bg-gray-900`}>
       
      <PomodoroView
        pomodoro={pomodoro}
        tasks={tasks}
        routines={routines}
        onToggleDaily={onToggleDaily}
        queue={pomodoroQueue}
        onAddToQueue={onAddToQueue}
        onRemoveFromQueue={onRemoveFromQueue}
        onUpdateWorkTime={onUpdateWorkTime}
        addCoins={addCoins}
        onAddTemplate={async (_templateName, _subTasks) => {
        }}
      />

      </div>
    );


};