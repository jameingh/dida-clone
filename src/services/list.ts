import { invoke } from '@tauri-apps/api/core';
import { List, SmartListType } from '../types';

// 复用与任务相同的环境判断逻辑
const isTauriEnv = () =>
  typeof window !== 'undefined' &&
  (('__TAURI__' in window) || ('__TAURI_CORE__' in window));

const BROWSER_LISTS_KEY = 'dida-lists';

function createSmartList(type: SmartListType, order: number): List {
  let name = '';
  let icon = '';

  switch (type) {
    case SmartListType.All:
      name = '所有任务';
      icon = '📋';
      break;
    case SmartListType.Today:
      name = '今天';
      icon = '📅';
      break;
    case SmartListType.Week:
      name = '最近7天';
      icon = '📆';
      break;
    case SmartListType.Inbox:
      name = '收集箱';
      icon = '📥';
      break;
    case SmartListType.Completed:
      name = '已完成';
      icon = '✅';
      break;
    case SmartListType.Trash:
      name = '垃圾桶';
      icon = '🗑️';
      break;
  }

  const now = Math.floor(Date.now() / 1000);

  return {
    id: type, // 与后端格式保持一致：smart_inbox / smart_today / ...
    name,
    icon,
    color: '#3B82F6',
    is_smart: true,
    order,
    created_at: now,
  };
}

function loadBrowserLists(): List[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BROWSER_LISTS_KEY);
    if (!raw) {
      // 首次初始化：创建与后端一致的智能清单
      const initial: List[] = [
        createSmartList(SmartListType.All, 0),
        createSmartList(SmartListType.Today, 1),
        createSmartList(SmartListType.Week, 2),
        createSmartList(SmartListType.Inbox, 3),
        createSmartList(SmartListType.Completed, 4),
        createSmartList(SmartListType.Trash, 5),
      ];
      localStorage.setItem(BROWSER_LISTS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as List[];
    if (!Array.isArray(parsed)) return [];
    
    // 确保智能清单完整（例如：升级后新增了垃圾桶）
    const smartTypes = [
      SmartListType.All,
      SmartListType.Today,
      SmartListType.Week,
      SmartListType.Inbox,
      SmartListType.Completed,
      SmartListType.Trash,
    ];
    
    // 确保顺序正确（根据 smartTypes 的顺序更新 order）
    let updated = false;
    smartTypes.forEach((type, index) => {
      const existing = parsed.find(l => l.id === type);
      if (!existing) {
        parsed.push(createSmartList(type, index));
        updated = true;
      } else if (existing.order !== index) {
        existing.order = index;
        updated = true;
      }
    });
    
    if (updated) {
      saveBrowserLists(parsed);
    }
    
    return parsed;
  } catch {
    return [];
  }
}

function saveBrowserLists(lists: List[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BROWSER_LISTS_KEY, JSON.stringify(lists));
}

const browserListStore = {
  async getLists(): Promise<List[]> {
    const lists = loadBrowserLists();
    // 智能清单放前面，顺序与后端一致
    return [...lists].sort((a, b) => a.order - b.order || a.created_at - b.created_at);
  },

  async getList(listId: string): Promise<List> {
    const lists = loadBrowserLists();
    const found = lists.find(l => l.id === listId);
    if (!found) throw new Error(`List ${listId} not found in browser store`);
    return found;
  },

  async createList(list: List): Promise<List> {
    const lists = loadBrowserLists();
    const now = Math.floor(Date.now() / 1000);
    const final: List = {
      ...list,
      created_at: list.created_at ?? now,
      is_smart: false, // 浏览器端新建的默认为自定义清单
    };
    lists.push(final);
    saveBrowserLists(lists);
    return final;
  },

  async updateList(list: List): Promise<List> {
    const lists = loadBrowserLists();
    const idx = lists.findIndex(l => l.id === list.id);
    if (idx === -1) {
      lists.push(list);
    } else {
      // 不允许在浏览器端修改 is_smart，以免破坏智能清单标记
      const existing = lists[idx];
      lists[idx] = {
        ...existing,
        ...list,
        is_smart: existing.is_smart,
      };
    }
    saveBrowserLists(lists);
    return list;
  },

  async deleteList(listId: string): Promise<void> {
    const lists = loadBrowserLists();
    const target = lists.find(l => l.id === listId);
    if (target?.is_smart) {
      // 浏览器端不允许删除系统内置的智能清单
      return;
    }
    const next = lists.filter(l => l.id !== listId);
    saveBrowserLists(next);
  },
};

export const listService = {
  async createList(list: List): Promise<List> {
    if (!isTauriEnv()) return browserListStore.createList(list);
    return await invoke('create_list', { list });
  },

  async getLists(): Promise<List[]> {
    if (!isTauriEnv()) return browserListStore.getLists();
    return await invoke('get_lists');
  },

  async getList(listId: string): Promise<List> {
    if (!isTauriEnv()) return browserListStore.getList(listId);
    return await invoke('get_list', { listId });
  },

  async updateList(list: List): Promise<List> {
    if (!isTauriEnv()) return browserListStore.updateList(list);
    return await invoke('update_list', { list });
  },

  async deleteList(listId: string): Promise<void> {
    if (!isTauriEnv()) return browserListStore.deleteList(listId);
    return await invoke('delete_list', { listId });
  },
};
