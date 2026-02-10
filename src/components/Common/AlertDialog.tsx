import { useEffect, useRef } from 'react';
import { useAlertStore } from '../../store/useAlertStore';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function AlertDialog() {
  const { 
    isOpen, 
    title, 
    message, 
    type, 
    confirmLabel, 
    cancelLabel, 
    onConfirm, 
    onCancel, 
    closeAlert 
  } = useAlertStore();

  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // 自动聚焦确认按钮，方便键盘操作
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);

      // ESC 关闭
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleCancel();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeAlert();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeAlert();
  };

  const getIcon = () => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-6 h-6 text-[var(--priority-medium)]" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-[var(--priority-high)]" />;
      case 'confirm': return <AlertCircle className="w-6 h-6 text-[var(--dida-primary)]" />; // Confirm usually implies a question
      case 'info': default: return <Info className="w-6 h-6 text-[var(--dida-primary)]" />;
    }
  };

  const isConfirmType = type === 'confirm' || type === 'warning' || type === 'error';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-lg shadow-xl w-[400px] max-w-[90vw] overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200 border border-[var(--dida-border-light)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        onClick={(e) => e.stopPropagation()} // Prevent closing if we add overlay click handler later
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 id="alert-title" className="text-lg font-medium text-[var(--dida-text-main)]">
                {title}
              </h3>
              <div className="mt-2 text-sm text-[var(--dida-text-secondary)]">
                {message}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-[var(--dida-bg-hover)] px-6 py-3 flex items-center justify-end gap-3 border-t border-[var(--dida-border-light)]">
          {isConfirmType && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-[var(--dida-text-main)] bg-white border border-[var(--dida-border-light)] rounded-md hover:bg-[var(--dida-bg-hover)] focus:outline-none transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none transition-colors ${
              type === 'error' 
                ? 'bg-[var(--priority-high)] hover:brightness-110' 
                : 'bg-[var(--dida-primary)] hover:brightness-110'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
