import { create } from 'zustand';

interface AppState {
  selectedListId: string | null;
  selectedTaskId: string | null;
  setSelectedListId: (id: string | null) => void;
  setSelectedTaskId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedListId: 'smart_inbox',
  selectedTaskId: null,
  setSelectedListId: (id) => set({ selectedListId: id }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
}));
