// src/core/utils/idGenerator.ts

/**
 * 衝突しにくいランダムな一意のIDを生成します。
 * @param prefix 任意のプレフィックス (例: 'task', 'routine')
 */
export const generateId = (prefix: string = 'id'): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`;
};