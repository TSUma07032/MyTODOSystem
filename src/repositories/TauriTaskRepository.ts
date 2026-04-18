// src/repositories/TauriTaskRepository.ts
import type { Task } from '../types';
import { FileRepository } from './fileRepository';

export class TauriTaskRepository {
  private fileName = 'current_active_todo.json';
  private saveTimeout: number | null = null;
  private readonly DEBOUNCE_MS = 2000; // 何ミリ秒待ってから保存するか（2秒）

  /**
   * アプリ起動時の読み込み（これは即座に実行する）
   */
  async loadTasks(): Promise<Task[]> {
    const data = await FileRepository.readFile(this.fileName);
    return data ? JSON.parse(data) : [];
  }

  /**
   * UI側から呼ばれる保存処理（すぐにはファイルに書かない！）
   */
  saveTasks(tasks: Task[]): void {
    // もしすでに「2秒後に保存する」という予約があれば、それをキャンセル
    if (this.saveTimeout !== null) {
      window.clearTimeout(this.saveTimeout);
    }

    // 新たに「2秒後に保存する」という予約を入れる
    this.saveTimeout = window.setTimeout(async () => {
      try {
        await FileRepository.writeFile(this.fileName, JSON.stringify(tasks, null, 2));
        console.log(`[Tauri] 💾 ${this.fileName} にネイティブ保存しました！`);
      } catch (error) {
        console.error('保存エラー:', error);
      }
    }, this.DEBOUNCE_MS);
  }
}

// どこからでも同じインスタンスを使えるようにエクスポート
export const taskRepository = new TauriTaskRepository();