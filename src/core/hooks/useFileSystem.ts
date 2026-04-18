import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';

const DIR_HANDLE_KEY = 'todo-dir-handle';

export const useFileSystem = () => {
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restore = async () => {
      const handle = await get<FileSystemDirectoryHandle>(DIR_HANDLE_KEY);
      if (handle) setDirHandle(handle);
    };
    restore();
  }, []);

  const verifyPermission = async () => {
    if (!dirHandle) return false;
    // ユーザーのアクション（ボタンクリック）から呼ばれる必要がある
    const status = await dirHandle.requestPermission({ mode: 'readwrite' });
    if (status === 'granted') {
      setIsReady(true);
      return true;
    }
    return false;
  };

  const pickDirectory = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      await set(DIR_HANDLE_KEY, handle);
      setDirHandle(handle);
      setIsReady(true);
    } catch (err) { console.error(err); }
  };

  const readFile = useCallback(async (filename: string): Promise<string | null> => {
    if (!dirHandle || !isReady) return null; // 準備ができるまで読まない
    try {
      const fileHandle = await dirHandle.getFileHandle(filename);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (e) { return null; }
  }, [dirHandle, isReady]);

  const writeFile = useCallback(async (filename: string, content: string) => {
    if (!dirHandle || !isReady) return;
    const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }, [dirHandle, isReady]);

  return { dirHandle, isReady, pickDirectory, verifyPermission, readFile, writeFile };
};