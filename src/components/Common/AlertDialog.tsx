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
      case 'warning': return <AlertTriangle className="w-6 h-6 text-orange-500" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'confirm': return <AlertCircle className="w-6 h-6 text-blue-500" />; // Confirm usually implies a question
      case 'info': default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const isConfirmType = type === 'confirm' || type === 'warning' || type === 'error';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-[1px] animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[400px] max-w-[90vw] overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200"
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
              <h3 id="alert-title" className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {title}
              </h3>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {message}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
          {isConfirmType && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'error' 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
