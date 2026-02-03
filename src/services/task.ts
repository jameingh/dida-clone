import { invoke } from '@tauri-apps/api/core';
import { Task } from '../types';

export const taskService = {
  async createTask(task: Task): Promise<Task> {
    return await invoke('create_task', { task });
  },

  async createTaskSimple(title: string, listId: string): Promise<Task> {
    return await invoke('create_task_simple', { title, listId });
  },

  async getSubtasks(parentId: string): Promise<Task[]> {
    return await invoke('get_subtasks', { parentId });
  },

  async createSubtaskSimple(title: string, parentId: string, listId: string): Promise<Task> {
    return await invoke('create_subtask_simple', { title, parentId, listId });
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
