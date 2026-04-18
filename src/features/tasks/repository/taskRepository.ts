import { type Task } from '../types';

const TASKS_FILE = 'tasks.json';

export const taskRepository = {
  save: async (tasks: Task[], writeFile: (filename: string, content: string) => Promise<void>) => {
    await writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
  },
  
  load: async (readFile: (filename: string) => Promise<string | null>): Promise<Task[]> => {
    const content = await readFile(TASKS_FILE);
    return content ? JSON.parse(content) : [];
  }
};