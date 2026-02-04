import { create } from 'zustand';

interface AppState {
  selectedListId: string | null;
  selectedTagId: string | null;
  selectedTaskId: string | null;
  viewMode: 'tasks' | 'calendar' | 'search';
  toast: {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    visible: boolean;
  };
  setSelectedListId: (id: string | null) => void;
  setSelectedTagId: (id: string | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  setViewMode: (mode: 'tasks' | 'calendar' | 'search') => void;
  showToast: (message: string, actionLabel?: string, onAction?: () => void) => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedListId: 'smart_inbox',
  selectedTagId: null,
  selectedTaskId: null,
  viewMode: 'tasks',
  toast: {
    message: '',
    visible: false,
  },
  setSelectedListId: (id) => set({ 
    selectedListId: id, 
    selectedTagId: null,
    selectedTaskId: null // 切换清单时清空选中的任务
  }),
  setSelectedTagId: (id) => set({ 
    selectedTagId: id, 
    selectedListId: null,
    selectedTaskId: null // 切换标签时清空选中的任务
  }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  showToast: (message, actionLabel, onAction) => set({
    toast: { message, actionLabel, onAction, visible: true }
  }),
  hideToast: () => set((state) => ({
    toast: { ...state.toast, visible: false }
  })),
}));
