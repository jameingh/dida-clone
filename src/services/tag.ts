import { invoke } from '@tauri-apps/api/core';
import { Tag } from '../types';

export const tagService = {
  async createTag(name: string, color: string): Promise<Tag> {
    return await invoke('create_tag', { name, color });
  },

  async updateTag(tag: Tag): Promise<Tag> {
    return await invoke('update_tag', { tag });
  },

  async getTags(): Promise<Tag[]> {
    return await invoke('get_tags');
  },

  async deleteTag(tagId: string): Promise<void> {
    return await invoke('delete_tag', { tagId });
  },
};
