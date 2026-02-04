import { create } from 'zustand';

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type: 'info' | 'warning' | 'error' | 'confirm';
  onConfirm?: () => void;
  onCancel?: () => void;
  
  showAlert: (options: {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'confirm';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => void;
  
  closeAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  isOpen: false,
  title: '',
  message: '',
  type: 'info',
  confirmLabel: '确定',
  cancelLabel: '取消',
  
  showAlert: (options) => set({
    isOpen: true,
    title: options.title,
    message: options.message,
    type: options.type || 'info',
    confirmLabel: options.confirmLabel || '确定',
    cancelLabel: options.cancelLabel || '取消',
    onConfirm: options.onConfirm,
    onCancel: options.onCancel,
  }),
  
  closeAlert: () => set({ isOpen: false, onConfirm: undefined, onCancel: undefined }),
}));
