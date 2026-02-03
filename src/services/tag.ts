import { invoke } from '@tauri-apps/api/core';
import { Tag } from '../types';

export const tagService = {
  async createTag(tag: Tag): Promise<Tag> {
    return await invoke('create_tag', { tag });
  },

  async getTags(): Promise<Tag[]> {
    return await invoke('get_tags');
  },

  async deleteTag(tagId: string): Promise<void> {
    return await invoke('delete_tag', { tagId });
  },
};
