import { invoke } from '@tauri-apps/api/core';
import { Tag } from '../types';

// 与任务 / 清单保持一致的环境检测
const isTauriEnv = () =>
  typeof window !== 'undefined' &&
  (('__TAURI__' in window) || ('__TAURI_CORE__' in window));

const BROWSER_TAGS_KEY = 'dida-tags';

function loadBrowserTags(): Tag[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BROWSER_TAGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Tag[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBrowserTags(tags: Tag[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BROWSER_TAGS_KEY, JSON.stringify(tags));
}

const browserTagStore = {
  async getTags(): Promise<Tag[]> {
    const tags = loadBrowserTags();
    return [...tags].sort((a, b) => a.created_at - b.created_at);
  },

  async createTag(name: string, color: string): Promise<Tag> {
    const tags = loadBrowserTags();
    const now = Math.floor(Date.now() / 1000);
    const tag: Tag = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name,
      color,
      created_at: now,
    };
    tags.push(tag);
    saveBrowserTags(tags);
    return tag;
  },

  async updateTag(tag: Tag): Promise<Tag> {
    const tags = loadBrowserTags();
    const idx = tags.findIndex(t => t.id === tag.id);
    if (idx === -1) {
      tags.push(tag);
    } else {
      tags[idx] = { ...tags[idx], ...tag };
    }
    saveBrowserTags(tags);
    return tag;
  },

  async deleteTag(tagId: string): Promise<void> {
    const tags = loadBrowserTags();
    const next = tags.filter(t => t.id !== tagId);
    saveBrowserTags(next);
  },
};

export const tagService = {
  async createTag(name: string, color: string): Promise<Tag> {
    if (!isTauriEnv()) return browserTagStore.createTag(name, color);
    return await invoke('create_tag', { name, color });
  },

  async updateTag(tag: Tag): Promise<Tag> {
    if (!isTauriEnv()) return browserTagStore.updateTag(tag);
    return await invoke('update_tag', { tag });
  },

  async getTags(): Promise<Tag[]> {
    if (!isTauriEnv()) return browserTagStore.getTags();
    return await invoke('get_tags');
  },

  async deleteTag(tagId: string): Promise<void> {
    if (!isTauriEnv()) return browserTagStore.deleteTag(tagId);
    return await invoke('delete_tag', { tagId });
  },
};
