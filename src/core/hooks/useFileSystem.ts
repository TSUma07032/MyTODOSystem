import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';

const DIR_HANDLE_KEY = 'todo-dir-handle';

export const useFileSystem = () => {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isReady, setIsReady] = useState(false); // 読み書き準備OK？

  // 起動時にDBからハンドルを探す
  useEffect(() => {
    const restoreHandle = async () => {
      const handle = await get<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
      if (handle) {
        setDirHandle(handle);
        // 注意: ブラウザのセキュリティ上、ここで自動的に isReady=true にはできない
        // ユーザーのアクション（ボタンクリックなど）で権限再確認が必要
      }
    };
    restoreHandle();
  }, []);

  // フォルダを選択する（初回）
  const pickDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      await set(DIR_HANDLE_KEY, handle); // DBに保存
      setDirHandle(handle);
      setIsReady(true);
    } catch (err) {
      console.error('フォルダ選択キャンセル:', err);
    }
  };

  // 権限があるか確認し、なければリクエストする（2回目以降）
  const verifyPermission = async () => {
    if (!dirHandle) return false;
    
    // 既に許可されてる？
    if ((await dirHandle.queryPermission({ mode: 'readwrite' })) === 'granted') {
      setIsReady(true);
      return true;
    }

    // 許可を求めるポップアップを出す
    if ((await dirHandle.requestPermission({ mode: 'readwrite' })) === 'granted') {
      setIsReady(true);
      return true;
    }

    return false;
  };

  // ファイルを保存する関数
  const writeFile = async (filename: string, content: string) => {
    if (!dirHandle) return;
    
    // 権限チェック
    if (!isReady) {
      const granted = await verifyPermission();
      if (!granted) throw new Error("Permission denied");
    }

    try {
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      console.log(`Saved: ${filename}`);
    } catch (err) {
      console.error('保存エラー:', err);
      alert('保存に失敗しました。権限を確認してください。');
    }
  };

  // ファイルを読み込む関数 (追加！)
  const readFile = async (filename: string): Promise<string | null> => {
    if (!dirHandle) return null;
    
    // 権限チェック
    if (!isReady) {
      const granted = await verifyPermission();
      if (!granted) return null;
    }

    try {
      // ファイルを探す
      const fileHandle = await dirHandle.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (err) {
      console.log(`ファイルが見つかりません: ${filename} (初回なら正常だよ)`);
      return null; // ファイルがない場合はnullを返す優しさ
    }
  };

  const saveDeepFile = async (dirPath: string[], filename: string, content: string) => {
    if (!dirHandle) return;
    // 権限チェック
    if (!isReady) {
      const granted = await verifyPermission();
      if (!granted) return;
    }

    try {
      let currentHandle = dirHandle;

      // 指定されたフォルダ階層を順番に開く（なければ作る！）
      for (const folderName of dirPath) {
        currentHandle = await currentHandle.getDirectoryHandle(folderName, { create: true });
      }

      // 最終的なフォルダの中にファイルを作成
      const fileHandle = await currentHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      console.log(`Saved to ${dirPath.join('/')}/${filename}`);
    } catch (err) {
      console.error('Deep save error:', err);
      alert('保存に失敗しました。権限などを確認してください。');
    }
  };

  const appendToJsonArray = async <T>(filename: string, newItems: T[]) => {
    if (!newItems.length) return;
    
    let currentData: T[] = [];
    try {
      const content = await readFile(filename);
      if (content) currentData = JSON.parse(content);
    } catch (e) {
      console.log(`新規作成: ${filename}`);
    }

    // 古いデータの上に新しいデータを追加 (先頭に追加)
    const mergedData = [...newItems, ...currentData]; 

    await writeFile(filename, JSON.stringify(mergedData, null, 2));
  };

  const readDeepFile = async (dirPath: string[], filename: string): Promise<string | null> => {
    if (!dirHandle) return null;
    if (!isReady) {
      const granted = await verifyPermission();
      if (!granted) return null;
    }

    try {
      let currentHandle = dirHandle;
      // フォルダを掘り進む
      for (const folderName of dirPath) {
        currentHandle = await currentHandle.getDirectoryHandle(folderName);
      }
      // ファイルを開く
      const fileHandle = await currentHandle.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (err) {
      console.error('読み込みエラー:', err);
      return null;
    }
  };

  return { 
    dirHandle, 
    isReady, 
    pickDirectory, 
    verifyPermission, 
    writeFile, 
    readFile,
    saveDeepFile,
    appendToJsonArray,
    readDeepFile,
  };
};