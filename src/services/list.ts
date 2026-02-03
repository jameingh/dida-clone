import { invoke } from '@tauri-apps/api/core';
import { List } from '../types';

export const listService = {
  async createList(list: List): Promise<List> {
    return await invoke('create_list', { list });
  },

  async getLists(): Promise<List[]> {
    return await invoke('get_lists');
  },

  async getList(listId: string): Promise<List> {
    return await invoke('get_list', { listId });
  },

  async updateList(list: List): Promise<List> {
    return await invoke('update_list', { list });
  },

  async deleteList(listId: string): Promise<void> {
    return await invoke('delete_list', { listId });
  },
};
