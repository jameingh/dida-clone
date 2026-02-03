import { create } from 'zustand';

interface AppState {
  selectedListId: string | null;
  selectedTagId: string | null;
  selectedTaskId: string | null;
  viewMode: 'tasks' | 'calendar' | 'search';
  setSelectedListId: (id: string | null) => void;
  setSelectedTagId: (id: string | null) => void;
  setSelectedTaskId: (id: string | null) => void;
  setViewMode: (mode: 'tasks' | 'calendar' | 'search') => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedListId: 'smart_inbox',
  selectedTagId: null,
  selectedTaskId: null,
  viewMode: 'tasks',
  setSelectedListId: (id) => set({ selectedListId: id, selectedTagId: null }),
  setSelectedTagId: (id) => set({ selectedTagId: id, selectedListId: null }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
