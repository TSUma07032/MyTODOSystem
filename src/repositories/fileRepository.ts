// src/repositories/fileRepository.ts
import { writeTextFile, readTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import { join } from '@tauri-apps/api/path';

// 選択されたルートフォルダのパスを保持する（メモリ上）
let currentDirectoryPath: string | null = null;

export const FileRepository = {
  /**
   * フォルダを選択する（ブラウザのFileSystem APIの代わり）
   * 一度選択すれば、アプリを閉じるまで権限ポップアップは出ません
   */
  async pickDirectory(): Promise<string | null> {
    const selectedPath = await open({
      directory: true,
      multiple: false,
      title: 'TODOデータを保存するフォルダを選択してください'
    });

    if (selectedPath && typeof selectedPath === 'string') {
      currentDirectoryPath = selectedPath;
      // 必要ならここでパスを localStorage に保存し、次回起動時に復元することも可能
      localStorage.setItem('todo_root_path', selectedPath);
      return selectedPath;
    }
    return null;
  },

  /**
   * 起動時に前回のパスを復元する
   */
  restoreDirectory(): string | null {
    const savedPath = localStorage.getItem('todo_root_path');
    if (savedPath) {
      currentDirectoryPath = savedPath;
    }
    return currentDirectoryPath;
  },

  /**
   * ファイルを読み込む（爆速）
   */
  async readFile(filename: string): Promise<string | null> {
    if (!currentDirectoryPath) return null;
    try {
      const filePath = await join(currentDirectoryPath, filename);
      const isExist = await exists(filePath);
      if (!isExist) return null;
      
      return await readTextFile(filePath);
    } catch (error) {
      console.error(`ファイルの読み込みに失敗しました: ${filename}`, error);
      return null;
    }
  },

  /**
   * ファイルを保存する（ブラウザのサンドボックスを回避して直接書き込み）
   */
  async writeFile(filename: string, content: string): Promise<void> {
    if (!currentDirectoryPath) throw new Error("保存先フォルダが選択されていません");
    try {
      const filePath = await join(currentDirectoryPath, filename);
      await writeTextFile(filePath, content);
      console.log(`Saved natively: ${filename}`);
    } catch (error) {
      console.error(`保存エラー: ${filename}`, error);
      throw error;
    }
  },

  /**
   * 深い階層のフォルダを作成して保存する（履歴用）
   */
  async saveDeepFile(dirPath: string[], filename: string, content: string): Promise<void> {
    if (!currentDirectoryPath) return;
    try {
      // フォルダパスの構築 (例: /root/2025/12)
      let targetPath = currentDirectoryPath;
      for (const folder of dirPath) {
        targetPath = await join(targetPath, folder);
        const dirExists = await exists(targetPath);
        if (!dirExists) {
          await createDir(targetPath, { recursive: true });
        }
      }
      
      const filePath = await join(targetPath, filename);
      await writeTextFile(filePath, content);
    } catch (error) {
      console.error('Deep save error:', error);
      throw error;
    }
  }
};

function createDir(targetPath: string, arg1: { recursive: boolean; }) {
  throw new Error('Function not implemented.');
}
