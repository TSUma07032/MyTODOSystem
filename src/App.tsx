import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { parseMarkdown } from './utils/parser';
import { type Task } from './types';
import { TaskRow } from './components/TaskRow';
import { useFileSystem } from './hooks/useFileSystem';
import { FolderOpen, Sparkles, ArrowRight, Copy, Sun, Moon, CheckCircle, Search, History as HistoryIcon, Coffee, CalendarDays, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<'dashboard' | 'sync' | 'history' | 'calendar'>('dashboard');
  const [input, setInput] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [viewingLog, setViewingLog] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // カレンダー用State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [newTaskText, setNewTaskText] = useState(""); // 新規タスク入力用

  const { dirHandle, isReady, pickDirectory, verifyPermission, writeFile, readFile, saveDeepFile, readDeepFile, appendToHistoryIndex } = useFileSystem();

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    const result = parseMarkdown(input);
    setTasks(result.tasks);
  }, [input]);

  useEffect(() => {
    const loadActiveTodo = async () => {
      if ((mode === 'dashboard' || mode === 'calendar') && isReady) {
        const content = await readFile('current_active_todo.md');
        if (content) {
          setInput(content);
        } else {
          setInput("- [ ] まだタスクがないよ！\n- [ ] 夜モードで同期して生成しよう");
        }
      }
    };
    loadActiveTodo();
  }, [mode, isReady]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSyncAndSave = async () => {
    if (!dirHandle) { await pickDirectory(); return; }
    if (!isReady && !(await verifyPermission())) return;

    const now = new Date();
    const year = format(now, 'yyyy');
    const month = format(now, 'MM');
    const timestamp = format(now, 'yyyy-MM-dd_HH-mm-ss');
    const filename = `${timestamp}.md`;
    const doneTasks = tasks.filter(t => t.status === 'done');
    await appendToHistoryIndex(doneTasks, filename, [year, month]);

    await saveDeepFile([year, month], filename, input);

    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const nextInput = tasks
      .filter(t => t.status !== 'done')
      .map(t => t.originalRaw)
      .join('\n');
    
    setInput(nextInput);
    await writeFile(`current_active_todo.md`, nextInput);
    setIsSyncing(false);
  };

  useEffect(() => {
    const loadHistory = async () => {
      if (mode === 'history' && isReady) {
        const content = await readFile('history_index.json');
        if (content) {
          setHistoryItems(JSON.parse(content));
        }
      }
    };
    loadHistory();
  }, [mode, isReady]);

  const handleHistoryClick = async (item: any) => {
    const content = await readDeepFile(item.sourcePath, item.sourceFile);
    setViewingLog(content);
  };

  const groupedHistory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    historyItems.forEach(item => {
      if (searchQuery && !item.text.toLowerCase().includes(searchQuery.toLowerCase())) return;
      if (!groups[item.text]) groups[item.text] = [];
      groups[item.text].push(item);
    });
    return groups;
  }, [historyItems, searchQuery]);

  // ★機能追加：締め切り変更即保存
  const updateDeadline = async (taskId: string, newDate: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const [_, m, d] = newDate.split('-');
    const shortDate = `${Number(m)}/${Number(d)}`;
    const deadlineTag = `(@${shortDate})`;

    const lines = input.split('\n');
    const targetLineIndex = targetTask.lineNumber - 1;
    
    if (lines[targetLineIndex]) {
      let line = lines[targetLineIndex];
      if (line.match(/\(@\d{1,2}\/\d{1,2}\)/)) {
        line = line.replace(/\(@\d{1,2}\/\d{1,2}\)/, deadlineTag);
      } else {
        line = `${line.trimEnd()} ${deadlineTag}`;
      }
      lines[targetLineIndex] = line;
      
      const newContent = lines.join('\n');
      setInput(newContent);
      await writeFile('current_active_todo.md', newContent);
    }
  };

  // ★機能追加：タスクの完了/未完了を切り替える
  const toggleTaskStatus = async (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const lines = input.split('\n');
    const idx = targetTask.lineNumber - 1;
    if (lines[idx]) {
      // [ ] -> [x], [x] -> [ ] に置換
      if (targetTask.status === 'todo') {
        lines[idx] = lines[idx].replace('- [ ]', '- [x]').replace('- [ ]', '- [x]'); // 大文字小文字対策
      } else {
        lines[idx] = lines[idx].replace(/- \[[xX]\]/, '- [ ]');
      }
      
      const newContent = lines.join('\n');
      setInput(newContent);
      await writeFile('current_active_todo.md', newContent);
    }
  };

  const addSubTask = async (parentId: string, text: string) => {
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask || !text.trim()) return;

    const lines = input.split('\n');
    // 親タスクの行番号（0始まりに補正）
    const parentIndex = parentTask.lineNumber - 1;

    if (lines[parentIndex] !== undefined) {
      // 親のインデント + 1段階深いインデントを作る（スペース2個分）
      const childIndent = parentTask.indent + 1;
      const spaces = "  ".repeat(childIndent);
      const newLine = `${spaces}- [ ] ${text}`;

      // 配列の「親タスクのすぐ後ろ」に新しい行を挿入！
      // splice(挿入開始位置, 削除数, 追加する要素)
      lines.splice(parentIndex + 1, 0, newLine);

      const newContent = lines.join('\n');
      setInput(newContent);
      await writeFile('current_active_todo.md', newContent);
    }
  };

  // ★機能追加：新規タスク追加
  const addNewTask = async () => {
    if (!newTaskText.trim()) return;
    
    const newTaskLine = `- [ ] ${newTaskText}`;
    const newContent = input + (input.endsWith('\n') ? '' : '\n') + newTaskLine;
    
    setInput(newContent);
    setNewTaskText("");
    await writeFile('current_active_todo.md', newContent);
  };

  const moveTaskSection = async (taskId: string, targetSectionName: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const lines = input.split('\n');
    const taskIndex = targetTask.lineNumber - 1;

    // 1. 移動対象の範囲（自分＋子孫）を特定する
    let moveLines: string[] = [];
    let removeStartIndex = taskIndex;
    let removeCount = 1;

    // 自分自身の行を取得
    moveLines.push(lines[taskIndex]);

    // 子孫を探す（自分の次の行から、インデントが自分より深い間はずっと子孫）
    for (let i = taskIndex + 1; i < lines.length; i++) {
        // 次の行がタスクかどうかチェック（空行などは無視したいが、簡易的に行頭ハイフンで判定など）
        // ここではtypesのtasks配列を使って判定するのが確実だが、行番号ベースで簡易処理
        const line = lines[i];
        const taskMatch = line.match(/^(\s*)-\s\[/);
        
        if (taskMatch) {
            const indent = Math.floor(taskMatch[1].length / 2);
            if (indent > targetTask.indent) {
                moveLines.push(line);
                removeCount++;
            } else {
                break; // 子孫終了
            }
        } else {
            // タスクじゃない行（メモとか）も、インデントが深ければ連れて行く？
            // 複雑になるので今回は「タスク行が途切れたら終了」または「インデント判定」にする
            // 簡易的に「次のタスクが見つかるまで」は連れて行かない方が安全（見出しなどにぶつかるため）
            break;
        }
    }

    // 2. インデントの正規化（左寄せ）
    // 移動するタスクの中で一番浅いインデント（＝親のインデント）を0にする分だけ、全員のスペースを削る
    const baseIndentSpace = targetTask.indent * 2; // スペースの数
    const normalizedLines = moveLines.map(line => {
        // 先頭のスペースを baseIndentSpace 分だけ削除
        const regex = new RegExp(`^\\s{${baseIndentSpace}}`);
        return line.replace(regex, '');
    });


    // 3. 元の場所から削除
    lines.splice(removeStartIndex, removeCount);


    // 4. 新しい場所に挿入
    // targetSectionName（例: "Today"）の見出しを探す
    let targetHeaderIndex = lines.findIndex(line => line.trim() === `## ${targetSectionName}`);

    if (targetHeaderIndex === -1) {
        // 見出しがなければ末尾に作る
        lines.push(''); // 空行
        lines.push(`## ${targetSectionName}`);
        targetHeaderIndex = lines.length - 1;
    }

    // 挿入位置を探す（次の見出しの手前、または末尾）
    let insertIndex = lines.length;
    for (let i = targetHeaderIndex + 1; i < lines.length; i++) {
        if (lines[i].startsWith('#')) {
            insertIndex = i;
            break;
        }
    }
    
    // 挿入！（元の行が減った分インデックスがずれる可能性があるので注意だが、
    // 今回は削除してから挿入位置を探しているのでOKなはず... と思いきや
    // 削除位置が挿入位置より前か後かでズレる。
    // 安全のため「削除」→「再検索」の順序で行う（上のコード通り）
    
    // 見出しの直後ではなく、そのセクションの末尾に追加するスタイル
    // 直前が空行じゃなければ空行を入れる？などの整形はお好みで
    
    lines.splice(insertIndex, 0, ...normalizedLines);

    const newContent = lines.join('\n');
    setInput(newContent);
    await writeFile('current_active_todo.md', newContent);
  };

// --- カレンダー生成ロジックの強化版 ---
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map(day => {
        const dateStr = `${day.getMonth() + 1}/${day.getDate()}`;
        
        // 1. その日が締め切りの「親タスク」を探す
        const rootTasks = tasks.filter(t => t.deadline === dateStr && t.status !== 'done');
        
        // 2. 親タスクにぶら下がる「子孫タスク」も回収してリストにする
        let displayTasks: Task[] = [];
        
        rootTasks.forEach(root => {
            // まず親を追加
            displayTasks.push(root);
            
            // 親タスクの行番号（配列インデックス）を探す
            const rootIndex = tasks.findIndex(t => t.id === root.id);
            if (rootIndex === -1) return;

            // 親より下の行を走査
            for (let i = rootIndex + 1; i < tasks.length; i++) {
                const sub = tasks[i];
                // インデントが親以下になったら、もう子孫ではないので脱出
                if (sub.indent <= root.indent) break;
                
                // 未完了の子タスクなら表示リストに追加
                if (sub.status !== 'done') {
                    displayTasks.push(sub);
                }
            }
        });

        // 重複排除（親にも子にも同じ日付がついている場合などのため）
        // idをキーにしてユニークにする
        const uniqueTasks = Array.from(new Map(displayTasks.map(t => [t.id, t])).values());

        return { 
            date: day, 
            tasks: uniqueTasks, // 子孫を含んだタスクリスト
            isCurrentMonth: day.getMonth() === currentDate.getMonth() 
        };
    });
  }, [currentDate, tasks]);


  const themeConfig = useMemo(() => {
    switch(mode) {
      case 'dashboard': return {
        bg: "bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50",
        accent: "orange",
        icon: Sun
      };
      case 'sync': return {
        bg: "bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950 text-white",
        accent: "purple",
        icon: Moon
      };
      case 'history': return {
        bg: "bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50",
        accent: "blue",
        icon: HistoryIcon
      };
      case 'calendar': return {
        bg: "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50",
        accent: "emerald",
        icon: CalendarDays
      };
    }
  }, [mode]);

  const CurrentIcon = themeConfig.icon;

  return (
    <div className={`h-screen flex flex-col font-sans transition-all duration-700 animate-gradient-flow ${themeConfig.bg}`}>
      
      {/* Header */}
      <header className={`px-6 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-700 ${
        mode === 'sync' ? "bg-black/20 border-white/10" : "bg-white/60 border-white/40"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl shadow-sm transition-all duration-500 active:scale-90 ${
             mode === 'sync' ? 'bg-white/10 text-white' : `bg-${themeConfig.accent}-100 text-${themeConfig.accent}-500`
          }`}>
            <CurrentIcon className="w-6 h-6" />
          </div>
          <h1 className={`text-xl font-black tracking-tight transition-colors duration-700 ${
            mode === 'sync' ? "text-white" : "text-slate-800"
          }`}>
            My Ultimate TODO
          </h1>
        </div>
        
        <button 
          onClick={!dirHandle ? pickDirectory : verifyPermission}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all active:scale-95 ${
            isReady 
              ? "bg-green-500 text-white hover:bg-green-600 hover:shadow-md" 
              : "bg-white text-red-500 border-2 border-red-200 animate-pulse hover:bg-red-50"
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          {isReady ? "Local Linked" : "Connect Folder"}
        </button>
      </header>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden relative animate-fadeIn">

        {/* ------------- CALENDAR MODE ------------- */}

        {/* ------------- HISTORY MODE ------------- */}
        {mode === 'history' && (
          <div className="flex w-full h-full bg-white/40 backdrop-blur-xl animate-fadeIn">
             {/* ...History Modeの内容（変更なし、そのまま）... */}
             {/* 省略しますが、元のコードを維持してください！ */}
             <div className="w-1/3 border-r border-white/30 p-4 flex flex-col gap-4 bg-white/20">
               <div className="relative group z-10">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search memories..." 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/60 border-2 border-transparent focus:bg-white focus:border-blue-300 outline-none transition-all shadow-sm text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-purple-200">
                {Object.entries(groupedHistory).map(([taskText, logs]) => (
                  <div key={taskText} onClick={() => handleHistoryClick(logs[0])} className="group p-4 bg-white/60 hover:bg-white/90 rounded-xl shadow-sm border border-transparent hover:border-blue-200 cursor-pointer transition-all">
                    <h3 className="font-bold text-gray-700 group-hover:text-blue-700 text-sm line-clamp-2 leading-relaxed">{taskText}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">{logs[0].completedAt.split('T')[0]}</span>
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded-full">x{logs.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-2/3 p-8 overflow-y-auto bg-white/30 backdrop-blur-md">
              {viewingLog ? (
                <div className="prose prose-sm max-w-none text-gray-700 animate-fadeIn">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed bg-white/70 p-6 rounded-2xl shadow-sm border border-white/50">{viewingLog}</pre>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 animate-pulse">
                  <HistoryIcon className="w-16 h-16 mb-4 text-blue-200" />
                  <p className="text-lg font-bold">Select a history to recall</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------- DASHBOARD & SYNC MODE ------------- */}
        {(mode === 'dashboard' || mode === 'sync' || mode === 'calendar') && (
        <div className="flex w-full h-full animate-fadeIn">
          {/* 左カラム：テキストエディタ */}
          <div className={`w-1/2 flex flex-col border-r transition-all duration-500 ${
            mode === 'dashboard' ? 'hidden' : 'flex bg-white/80 backdrop-blur-xl border-white/20'
          }`}>
            <textarea
              className="flex-1 w-full p-8 resize-none font-mono text-sm outline-none bg-transparent text-slate-700 placeholder-slate-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="- [ ] Paste Notion tasks here..."
            />
          </div>

          {/* 右カラム：GUIタスクリスト */}
          <div className={`flex flex-col transition-all duration-700 ${
            mode === 'dashboard' ? 'w-full max-w-3xl mx-auto' : 'w-1/2 bg-black/10 backdrop-blur-lg'
          }`}>
          
          <div className={`p-4 flex justify-between items-center sticky top-0 z-10 backdrop-blur-xl border-b transition-colors duration-700 ${
             mode === 'sync' ? "bg-black/20 border-white/10 text-white" : "bg-white/60 border-white/40 text-slate-800"
          }`}>
             {/* ナビゲーションタブ */}
             <div className="flex bg-black/5 p-1 rounded-full backdrop-blur-sm relative shadow-inner">
                <button onClick={() => setMode('dashboard')} className={`relative z-10 px-4 py-2 text-xs font-bold rounded-full transition-colors ${mode === 'dashboard' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>Morning</button>
                <button onClick={() => setMode('calendar')} className={`relative z-10 px-4 py-2 text-xs font-bold rounded-full transition-colors ${mode === 'calendar' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>Calendar</button>
                <button onClick={() => setMode('sync')} className={`relative z-10 px-4 py-2 text-xs font-bold rounded-full transition-colors ${mode === 'sync' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>Night Sync</button>
             </div>
            
            {/* アクションボタン */}
            {mode === 'dashboard' ? (
              <button 
                onClick={handleCopy}
                className={`group flex items-center gap-2 px-6 py-3 rounded-full shadow-lg font-bold text-white transition-all duration-300 active:scale-90 hover:shadow-xl hover:-translate-y-1 ${copied ? "bg-green-500" : "bg-gradient-to-r from-orange-400 to-pink-500"}`}
              >
                {copied ? <CheckCircle className="w-5 h-5 scale-125 transition-transform" /> : <Copy className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                {copied ? "Copied!" : "Copy Mission"}
              </button>
            ) : (
              <button 
                onClick={handleSyncAndSave}
                disabled={isSyncing}
                className={`group relative overflow-hidden flex items-center gap-3 px-8 py-3 rounded-full shadow-lg font-bold text-white transition-all duration-300 active:scale-90 hover:shadow-xl ${isSyncing ? "bg-slate-700 cursor-wait" : "bg-gradient-to-r from-slate-800 to-purple-800 hover:-translate-y-1"}`}
              >
                <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12" />
                {isSyncing ? <Sparkles className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                {isSyncing ? "Syncing..." : "Finish Day"}
              </button>
            )}
          </div>

          <div className={`flex-1 overflow-y-auto p-6 space-y-2 ${mode === 'sync' && "text-white"}`}>
            
            {/* ★ここから分岐：カレンダーモードならカレンダーを表示 */}
            {mode === 'calendar' ? (
    <div className="flex flex-col h-full">
        {/* ▼▼▼ 修正箇所：カレンダーヘッダー（変更なし） ▼▼▼ */}
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-slate-700">{format(currentDate, 'yyyy MMMM')}</h2>
            <div className="flex gap-2">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-black/5 rounded-full"><ChevronLeft className="w-5 h-5 text-slate-600"/></button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200">Today</button>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-black/5 rounded-full"><ChevronRight className="w-5 h-5 text-slate-600"/></button>
            </div>
        </div>

        {/* ▼▼▼ 修正箇所：曜日ヘッダーを独立させる ▼▼▼ */}
        {/* ここを grid auto-rows-fr の外に出すのがポイント！ */}
        <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-bold text-slate-400 text-[10px] uppercase">
                    {day}
                </div>
            ))}
        </div>

        {/* ▼▼▼ 修正箇所：日付グリッド（ここは日付だけにする） ▼▼▼ */}
        {/* auto-rows-fr は日付同士の高さを揃えるために残す */}
        <div className="flex-1 grid grid-cols-7 gap-2 auto-rows-fr overflow-y-auto"> 
            {calendarDays.map((dayItem, idx) => (
                <div key={idx} onClick={() => setSelectedDay(dayItem.date)} className={`flex flex-col p-2 rounded-lg border transition-all ${
                    dayItem.isCurrentMonth ? 'bg-white/60 border-white/50' : 'bg-gray-50/30 border-transparent opacity-50'
                } ${isToday(dayItem.date) ? 'ring-2 ring-emerald-400' : ''} min-h-[100px]`}> 
                    <div className={`text-xs font-bold mb-1 ${isToday(dayItem.date) ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {dayItem.date.getDate()}
                    </div>
                    <div className="space-y-1 overflow-y-auto scrollbar-none flex-1">
                                {dayItem.tasks.map(task => (
                                    <div 
                                        key={task.id} 
                                        className={`text-[10px] px-1 rounded truncate font-medium shadow-sm transition-all hover:opacity-80 ${
                                            // 親タスク（日付指定あり）は目立つ色、子タスク（日付指定なし）は少し薄く
                                            task.deadline 
                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                                : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                                        }`}
                                        style={{ 
                                            // ★ここでインデントを表現！
                                            // カレンダーは狭いので、元のindentに小さな値を掛けて調整
                                            marginLeft: `${task.indent * 6}px`,
                                            // 子タスクには左に小さな線を表示してツリー感を出す
                                            borderLeftWidth: task.indent > 0 ? '2px' : '1px'
                                        }}
                                        title={task.text}
                                    >
                                        {/* 子タスクなら先頭に少し記号をつけても可愛いかも */}
                                        {task.indent > 0 && <span className="opacity-50 mr-1">└</span>}
                                        {task.text}
                                    </div>
                                ))}
                            </div>
                </div>
            ))}
        </div>

{selectedDay && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm animate-fadeIn p-4" onClick={() => setSelectedDay(null)}>
                    {/* カード本体 */}
                    <div 
                        className="bg-white w-full max-w-lg max-h-[80%] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()} // カード内のクリックで閉じないようにする
                    >
                        {/* ヘッダー */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-emerald-50/50">
                            <div>
                                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{format(selectedDay, 'yyyy MMMM')}</p>
                                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                    {format(selectedDay, 'd')}
                                    <span className="text-lg font-medium text-slate-400">({format(selectedDay, 'EEEE')})</span>
                                </h3>
                            </div>
                            <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        {/* タスクリスト（詳細ビュー） */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-white">
                             {/* その日のタスクを探し出す */}
                             {(() => {
                                // カレンダー生成ロジックと同じ方法でタスクを取得（再計算は軽量なのでここでOK）
                                const dayTasks = calendarDays.find(d => d.date.getTime() === selectedDay.getTime())?.tasks || [];

                                if (dayTasks.length === 0) {
                                    return (
                                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 opacity-60">
                                            <Coffee className="w-10 h-10 mb-2" />
                                            <p>No tasks planned for this day.</p>
                                        </div>
                                    );
                                }

                                return dayTasks.map(task => (
                                    <div 
                                        key={task.id} 
                                        className={`group relative p-3 rounded-xl border transition-all hover:shadow-sm ${
                                            task.deadline 
                                                ? "bg-emerald-50 border-emerald-100" // 親タスク
                                                : "bg-white border-gray-100"         // 子タスク
                                        }`}
                                        style={{ marginLeft: `${task.indent * 20}px` }} // インデントを大きく取って階層を明確に
                                    >
                                        {/* ツリーの線を描画 */}
                                        {task.indent > 0 && (
                                            <div className="absolute -left-3 top-0 bottom-0 border-l-2 border-gray-100 group-hover:border-emerald-200" />
                                        )}
                                        {task.indent > 0 && (
                                            <div className="absolute -left-3 top-1/2 w-2 border-t-2 border-gray-100 group-hover:border-emerald-200" />
                                        )}

                                        <div className="flex items-start gap-3">
                                            {/* チェックボックス（ここでも完了できるように！） */}
                                            <button 
                                                onClick={() => toggleTaskStatus(task.id)}
                                                className={`mt-1 flex-shrink-0 transition-colors ${
                                                    task.status === 'done' ? "text-emerald-500" : "text-slate-300 hover:text-emerald-400"
                                                }`}
                                            >
                                                {task.status === 'done' ? <CheckCircle className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current" />}
                                            </button>

                                            <div className="flex-1">
                                                <p className={`text-sm font-medium leading-relaxed ${
                                                    task.status === 'done' ? "line-through text-slate-400" : "text-slate-700"
                                                }`}>
                                                    {task.text}
                                                </p>
                                                
                                                {/* バッジ類 */}
                                                <div className="flex gap-2 mt-2">
                                                    {task.deadline && (
                                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                                            Due Today
                                                        </span>
                                                    )}
                                                    {task.estimate && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                                            {task.estimate}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ));
                             })()}
                        </div>
                        
                        {/* フッター */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-slate-400">
                            Press ESC or click outside to close
                        </div>
                    </div>
                </div>
             )}

    </div>
) : (
              // ★それ以外（Morning/Sync）ならいつものタスクリストを表示
              <>
                {tasks.map((task) => (
                  <TaskRow 
                    key={task.id} 
                    task={task} 
                    isSyncing={isSyncing} 
                    onUpdateDeadline={updateDeadline}
                    isNightMode={mode === 'sync'}
                    onToggle={toggleTaskStatus}
                    onAddSubTask={addSubTask}
                  />
                ))}
                
                {/* 新規追加エリア (Morningのみ) */}
                {mode === 'dashboard' && (
                  <div className="mt-6 flex items-center gap-3 p-3 bg-white/50 rounded-xl border border-dashed border-gray-300 hover:bg-white/80 transition-all group">
                    <Plus className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
                    <input 
                        type="text"
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addNewTask()}
                        placeholder="Add a new task..."
                        className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
                    />
                    <button onClick={addNewTask} className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-md hover:bg-orange-500 hover:text-white transition-colors">ADD</button>
                  </div>
                )}

                {tasks.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-50">
                    <Coffee className="w-12 h-12 mb-4" />
                    <p className="font-bold">All tasks completed!</p>
                  </div>
                )}
              </>
            )}
          </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

export default App;