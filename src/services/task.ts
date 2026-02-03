import { invoke } from '@tauri-apps/api/core';
import { Task } from '../types';

export const taskService = {
  async createTask(task: Task): Promise<Task> {
    return await invoke('create_task', { task });
  },

  async createTaskSimple(title: string, listId: string): Promise<Task> {
    return await invoke('create_task_simple', { title, listId });
  },

  async createTaskExtended(
    title: string,
    listId: string,
    dueDate?: number,
    priority?: number,
    tags?: string[],
    description?: string
  ): Promise<Task> {
    const params = {
      title,
      listId,  // 使用 camelCase，Tauri 2.0 会自动映射到 Rust 的 snake_case
      dueDate,
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
    return await invoke('get_subtasks', { parentId });
  },

  async createSubtaskSimple(title: string, parentId: string, listId: string): Promise<Task> {
    return await invoke('create_subtask_simple', { title, parentId, listId });
  },

  async updateTaskOrders(orders: [string, number][]): Promise<void> {
    return await invoke('update_task_orders', { orders });
  },

  async getTasksByTag(tagId: string): Promise<Task[]> {
    return await invoke('get_tasks_by_tag', { tagId });
  },

  async getTasks(listId?: string): Promise<Task[]> {
    return await invoke('get_tasks', { listId });
  },

  async getTask(taskId: string): Promise<Task> {
    return await invoke('get_task', { taskId });
  },

  async updateTask(task: Task): Promise<Task> {
    return await invoke('update_task', { task });
  },

  async deleteTask(taskId: string): Promise<void> {
    return await invoke('delete_task', { taskId });
  },

  async toggleTask(taskId: string): Promise<Task> {
    return await invoke('toggle_task', { taskId });
  },
};
