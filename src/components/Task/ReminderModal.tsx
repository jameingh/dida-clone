import { useState, useRef, useEffect } from 'react';
import { X, Target } from 'lucide-react';
import { Task } from '../../types';
import { format, isToday, isTomorrow, startOfTomorrow, setHours, setMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ReminderModalProps {
  task: Task;
  onClose: () => void;
  onSnooze: (minutes?: number) => void;
  onComplete: () => void;
  onGoToTask: () => void;
}

export default function ReminderModal({ task, onClose, onSnooze, onComplete, onGoToTask }: ReminderModalProps) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const snoozeButtonRef = useRef<HTMLButtonElement>(null);
  const snoozeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (snoozeMenuRef.current && !snoozeMenuRef.current.contains(event.target as Node) &&
          snoozeButtonRef.current && !snoozeButtonRef.current.contains(event.target as Node)) {
        setShowSnoozeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFormattedDate = () => {
    if (!task.due_date) return '';
    const date = new Date(task.due_date * 1000);
    const timeStr = format(date, 'HH:mm');
    
    if (isToday(date)) {
      return `今天, ${timeStr}`;
    } else if (isTomorrow(date)) {
      return `明天, ${timeStr}`;
    } else {
      return format(date, 'M月d日, HH:mm', { locale: zhCN });
    }
  };

  const formattedDate = getFormattedDate();

  const snoozeOptions = [
    { label: '15分钟', minutes: 15 },
    { label: '30分钟', minutes: 30 },
    { label: '1小时', minutes: 60 },
    { label: '3小时', minutes: 180 },
    { label: '今天傍晚', minutes: 'evening' },
    { label: '明天', minutes: 'tomorrow' },
  ];

  const handleSnoozeClick = (option: any) => {
    let minutes = 0;
    if (option.minutes === 'evening') {
      const now = new Date();
      const evening = setMinutes(setHours(now, 18), 0);
      minutes = Math.max(15, Math.floor((evening.getTime() - now.getTime()) / 60000));
    } else if (option.minutes === 'tomorrow') {
      const now = new Date();
      const tomorrow = setMinutes(setHours(startOfTomorrow(), 9), 0);
      minutes = Math.floor((tomorrow.getTime() - now.getTime()) / 60000);
    } else {
      minutes = option.minutes;
    }
    onSnooze(minutes);
    setShowSnoozeMenu(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 w-[420px] pointer-events-auto overflow-visible animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="text-[13px] font-medium text-blue-500">
            {formattedDate}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onGoToTask}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              title="跳转到任务"
            >
              <Target className="w-[18px] h-[18px]" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
              title="关闭"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <h3 className="text-[22px] font-semibold text-gray-900 leading-tight tracking-tight">
            {task.title}
          </h3>
          {task.description && (
            <p className="mt-3 text-[14px] text-gray-500 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex justify-end gap-3 relative">
          <div className="relative">
            <button
              ref={snoozeButtonRef}
              onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
              className="px-6 py-2.5 text-[14px] font-medium text-gray-600 hover:bg-gray-50 rounded-[12px] transition-colors border border-gray-200 min-w-[100px]"
            >
              稍后提醒
            </button>
            
            {showSnoozeMenu && (
              <div 
                ref={snoozeMenuRef}
                className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 py-1 z-[110] animate-in slide-in-from-bottom-2 fade-in duration-150"
              >
                {snoozeOptions.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleSnoozeClick(option)}
                    className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={onComplete}
            className="px-8 py-2.5 text-[14px] font-medium text-white bg-[#4477EE] hover:bg-[#3366DD] rounded-[12px] transition-colors shadow-sm min-w-[100px]"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
