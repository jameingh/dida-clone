import { invoke } from '@tauri-apps/api/core';
import { Task, Priority, RepeatRule } from '../types';

// 简单判断是否运行在 Tauri 环境
const isTauriEnv = () =>
  typeof window !== 'undefined' &&
  (('__TAURI__' in window) || ('__TAURI_CORE__' in window));

// 浏览器本地存储 key
const BROWSER_TASKS_KEY = 'dida-tasks';

function loadBrowserTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BROWSER_TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBrowserTasks(tasks: Task[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BROWSER_TASKS_KEY, JSON.stringify(tasks));
}

function createBrowserTaskBase(partial: Partial<Task> & Pick<Task, 'title' | 'list_id'>): Task {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: partial.id ?? (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    title: partial.title,
    description: partial.description ?? '',
    list_id: partial.list_id,
    completed: partial.completed ?? false,
    priority: partial.priority ?? Priority.None,
    due_date: partial.due_date ?? null,
    reminder: partial.reminder ?? null,
    repeat_rule: partial.repeat_rule ?? null,
    tags: partial.tags ?? [],
    parent_id: partial.parent_id ?? null,
    order: partial.order ?? 0,
    is_deleted: partial.is_deleted ?? false,
    created_at: partial.created_at ?? now,
    updated_at: partial.updated_at ?? now,
    completed_at: partial.completed_at ?? null,
  };
}

const browserTaskStore = {
  async getTasks(listId?: string): Promise<Task[]> {
    const tasks = loadBrowserTasks();
    
    if (listId === 'smart_trash') {
      return tasks.filter(t => t.is_deleted).sort((a, b) => b.updated_at - a.updated_at);
    }
    
    if (listId === 'smart_completed') {
      return tasks.filter(t => !t.is_deleted && t.completed).sort((a, b) => (b.completed_at || 0) - (a.completed_at || 0));
    }

    if (listId === 'smart_today') {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      
      const startTs = Math.floor(todayStart.getTime() / 1000);
      const endTs = Math.floor(todayEnd.getTime() / 1000);
      
      return tasks.filter(t => 
        !t.is_deleted && (
          (!t.completed && t.due_date !== null && t.due_date <= endTs) ||
          (t.completed && t.completed_at !== null && t.completed_at >= startTs && t.completed_at <= endTs)
        )
      ).sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.due_date || 0) - (b.due_date || 0);
      });
    }

    if (listId === 'smart_week') {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);
      
      const startTs = Math.floor(todayStart.getTime() / 1000);
      const endTs = Math.floor(weekEnd.getTime() / 1000);
      
      return tasks.filter(t => 
        !t.is_deleted && (
          (!t.completed && t.due_date !== null && t.due_date <= endTs) ||
          (t.completed && t.completed_at !== null && t.completed_at >= startTs && t.completed_at <= endTs)
        )
      ).sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.due_date || 0) - (b.due_date || 0);
      });
    }

    if (listId === 'smart_all') {
      return tasks.filter(t => !t.is_deleted).sort((a, b) => a.order - b.order);
    }

    const filtered = tasks.filter(t => !t.is_deleted);
    if (!listId) return filtered;
    return filtered.filter(t => t.list_id === listId);
  },

  async getTasksByTag(tagId: string): Promise<Task[]> {
    const tasks = loadBrowserTasks();
    return tasks.filter(t => !t.is_deleted && t.tags.includes(tagId));
  },

  async getTask(taskId: string): Promise<Task> {
    const tasks = loadBrowserTasks();
    const found = tasks.find(t => t.id === taskId);
    if (!found) throw new Error(`Task ${taskId} not found in browser store`);
    return found;
  },

  async createTask(task: Task): Promise<Task> {
    const tasks = loadBrowserTasks();
    const now = Math.floor(Date.now() / 1000);
    const finalTask: Task = {
      ...createBrowserTaskBase({
        ...task,
        title: task.title,
        list_id: task.list_id,
      }),
      created_at: now,
      updated_at: now,
    };
    tasks.push(finalTask);
    saveBrowserTasks(tasks);
    return finalTask;
  },

  async createTaskSimple(title: string, listId: string): Promise<Task> {
    const tasks = loadBrowserTasks();
    const finalTask = createBrowserTaskBase({ title, list_id: listId });
    tasks.push(finalTask);
    saveBrowserTasks(tasks);
    return finalTask;
  },

  async createTaskExtended(
    title: string,
    listId: string,
    dueDate?: number,
    reminder?: string,
    repeat_rule?: RepeatRule,
    priority?: number,
    tags?: string[],
    description?: string
  ): Promise<Task> {
    const tasks = loadBrowserTasks();
    const finalTask = createBrowserTaskBase({
      title,
      list_id: listId,
      due_date: dueDate ?? null,
      reminder: reminder ?? null,
      repeat_rule: repeat_rule ?? null,
      priority: (priority ?? 0) as Priority,
      tags: tags ?? [],
      description: description ?? '',
    });
    tasks.push(finalTask);
    saveBrowserTasks(tasks);
    return finalTask;
  },

  async getSubtasks(parentId: string): Promise<Task[]> {
    const tasks = loadBrowserTasks();
    return tasks.filter(t => t.parent_id === parentId);
  },

  async createSubtaskSimple(title: string, parentId: string, listId: string): Promise<Task> {
    const tasks = loadBrowserTasks();
    const parentTask = tasks.find(t => t.id === parentId);
    const finalTask = createBrowserTaskBase({
      title,
      list_id: listId,
      parent_id: parentId,
      due_date: parentTask?.due_date ?? null,
    });
    tasks.push(finalTask);
    saveBrowserTasks(tasks);
    return finalTask;
  },

  async updateTask(task: Task): Promise<Task> {
    const tasks = loadBrowserTasks();
    const idx = tasks.findIndex(t => t.id === task.id);
    const now = Math.floor(Date.now() / 1000);
    if (idx === -1) {
      const finalTask = createBrowserTaskBase({ ...task, title: task.title, list_id: task.list_id, updated_at: now });
      tasks.push(finalTask);
      saveBrowserTasks(tasks);
      return finalTask;
    }
    const updated: Task = {
      ...tasks[idx],
      ...task,
      updated_at: now,
    };
    tasks[idx] = updated;
    saveBrowserTasks(tasks);
    return updated;
  },

  async deleteTask(taskId: string): Promise<void> {
    const tasks = loadBrowserTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      tasks[idx].is_deleted = true;
      tasks[idx].updated_at = Math.floor(Date.now() / 1000);
      saveBrowserTasks(tasks);
    }
  },

  async undoDeleteTask(taskId: string): Promise<void> {
    const tasks = loadBrowserTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      tasks[idx].is_deleted = false;
      tasks[idx].updated_at = Math.floor(Date.now() / 1000);
      saveBrowserTasks(tasks);
    }
  },

  async deleteTaskPermanently(taskId: string): Promise<void> {
    const tasks = loadBrowserTasks();
    const next = tasks.filter(t => t.id !== taskId);
    saveBrowserTasks(next);
  },

  async emptyTrash(): Promise<void> {
    const tasks = loadBrowserTasks();
    const next = tasks.filter(t => !t.is_deleted);
    saveBrowserTasks(next);
  },

  async toggleTask(taskId: string): Promise<Task> {
    const tasks = loadBrowserTasks();
    const idx = tasks.findIndex(t => t.id === taskId);
    if (idx === -1) throw new Error(`Task ${taskId} not found in browser store`);
    const now = Math.floor(Date.now() / 1000);
    const current = tasks[idx];
    const completed = !current.completed;
    const updated: Task = {
      ...current,
      completed,
      updated_at: now,
      completed_at: completed ? now : null,
    };
    tasks[idx] = updated;

    // 如果父任务被完成，则同步完成所有未完成的子任务
    if (completed) {
      tasks.forEach(t => {
        if (t.parent_id === taskId && !t.completed) {
          t.completed = true;
          t.completed_at = now;
          t.updated_at = now;
        }
      });
    }

    saveBrowserTasks(tasks);
    return updated;
  },

  async updateTaskOrders(orders: [string, number][]): Promise<void> {
    const tasks = loadBrowserTasks();
    const orderMap = new Map<string, number>(orders);
    const next = tasks.map(t => ({
      ...t,
      order: orderMap.get(t.id) ?? t.order,
    }));
    saveBrowserTasks(next);
  },
};

export const taskService = {
  async createTask(task: Task): Promise<Task> {
    if (!isTauriEnv()) return browserTaskStore.createTask(task);
    return await invoke('create_task', { task });
  },

  async createTaskSimple(title: string, listId: string): Promise<Task> {
    if (!isTauriEnv()) return browserTaskStore.createTaskSimple(title, listId);
    return await invoke('create_task_simple', { title, listId });
  },

  async createTaskExtended(
    title: string,
    listId: string,
    dueDate?: number,
    reminder?: string,
    repeat_rule?: RepeatRule,
    priority?: number,
    tags?: string[],
    description?: string
  ): Promise<Task> {
    if (!isTauriEnv()) {
      return browserTaskStore.createTaskExtended(title, listId, dueDate, reminder, repeat_rule, priority, tags, description);
    }

    const params = {
      title,
      listId,  // 使用 camelCase，Tauri 2.0 会自动映射到 Rust 的 snake_case
      dueDate,
      reminder,
      repeat_rule,
      priority,
      tags: tags || [],
      description
    };
    console.log('createTaskExtended params:', params);
    try {
      const result = await invoke<Task>('create_task_extended', params);
      console.log('createTaskExtended result:', result);
      return result;
    } catch (error) {
      console.error('createTaskExtended error:', error);
      throw error;
    }
  },

  async getSubtasks(parentId: string): Promise<Task[]> {
    if (!isTauriEnv()) return browserTaskStore.getSubtasks(parentId);
    return await invoke('get_subtasks', { parentId });
  },

  async createSubtaskSimple(title: string, parentId: string, listId: string): Promise<Task> {
    if (!isTauriEnv()) return browserTaskStore.createSubtaskSimple(title, parentId, listId);
    return await invoke('create_subtask_simple', { title, parentId, listId });
  },

  async updateTaskOrders(orders: [string, number][]): Promise<void> {
    if (!isTauriEnv()) return browserTaskStore.updateTaskOrders(orders);
    return await invoke('update_task_orders', { orders });
  },

  async getTasksByTag(tagId: string): Promise<Task[]> {
    if (!isTauriEnv()) return browserTaskStore.getTasksByTag(tagId);
    return await invoke('get_tasks_by_tag', { tagId });
  },

  async getTasks(listId?: string): Promise<Task[]> {
    if (!isTauriEnv()) return browserTaskStore.getTasks(listId);
    return await invoke('get_tasks', { listId });
  },

  async getTask(taskId: string): Promise<Task> {
    if (!isTauriEnv()) return browserTaskStore.getTask(taskId);
    return await invoke('get_task', { taskId });
  },

  async updateTask(task: Task): Promise<Task> {
    if (!isTauriEnv()) return browserTaskStore.updateTask(task);
    return await invoke('update_task', { task });
  },

  async deleteTask(taskId: string): Promise<void> {
    if (!isTauriEnv()) return browserTaskStore.deleteTask(taskId);
    return await invoke('delete_task', { taskId });
  },

  async undoDeleteTask(taskId: string): Promise<void> {
    if (!isTauriEnv()) return browserTaskStore.undoDeleteTask(taskId);
    return await invoke('undo_delete_task', { taskId });
  },

  async deleteTaskPermanently(taskId: string): Promise<void> {
    if (!isTauriEnv()) return browserTaskStore.deleteTaskPermanently(taskId);
    return await invoke('delete_task_permanently', { taskId });
  },

  async emptyTrash(): Promise<void> {
    if (!isTauriEnv()) return browserTaskStore.emptyTrash();
    return await invoke('empty_trash');
  },

  async toggleTask(taskId: string): Promise<Task> {
    if (!isTauriEnv()) return browserTaskStore.toggleTask(taskId);
    return await invoke('toggle_task', { taskId });
  },
};
