import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Undo2 } from 'lucide-react';

export default function Toast() {
  const { toast, hideToast } = useAppStore();

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, hideToast]);

  if (!toast.visible) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-[#262626] text-white px-4 py-2.5 rounded shadow-2xl flex items-center gap-3 min-w-[160px] justify-between">
        <span className="text-sm font-medium">{toast.message}</span>
        {toast.onAction && (
          <button
            onClick={() => {
              toast.onAction?.();
              hideToast();
            }}
            className="flex items-center gap-1.5 text-[#FFA940] hover:text-[#FFC069] transition-colors text-sm font-bold"
          >
            {toast.actionLabel}
            <Undo2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
