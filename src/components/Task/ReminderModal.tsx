import { useState, useRef } from 'react';
import { X, Target } from 'lucide-react';
import { Task } from '../../types';
import { startOfTomorrow, setHours, setMinutes } from 'date-fns';
import { useClickOutside } from '../../hooks/useClickOutside';
import { formatTaskDateTime } from '../../utils/date';
import { getPriorityClass, getPriorityColor, getPriorityBgColor } from '../../utils/priority';
import { SNOOZE_OPTIONS } from '../../constants/reminders';

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

  useClickOutside([snoozeMenuRef, snoozeButtonRef], () => setShowSnoozeMenu(false), showSnoozeMenu);

  const formattedDate = task.due_date ? formatTaskDateTime(task.due_date) : '';

  const handleSnoozeClick = (option: typeof SNOOZE_OPTIONS[number]) => {
    let minutes = 0;
    const now = new Date();
    if (option.minutes === 'evening') {
      const evening = setMinutes(setHours(now, 18), 0);
      minutes = Math.max(15, Math.floor((evening.getTime() - now.getTime()) / 60000));
    } else if (option.minutes === 'tomorrow') {
      const tomorrow = setMinutes(setHours(startOfTomorrow(), 9), 0);
      minutes = Math.floor((tomorrow.getTime() - now.getTime()) / 60000);
    } else {
      minutes = option.minutes as number;
    }
    onSnooze(minutes);
    setShowSnoozeMenu(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      <div className="bg-white rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[var(--dida-border-light)] w-[420px] pointer-events-auto overflow-visible animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="text-[13px] font-medium text-[var(--dida-primary)]">
            {formattedDate}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onGoToTask}
              className="p-1.5 hover:bg-[var(--dida-bg-hover)] rounded-full text-[var(--dida-text-tertiary)] transition-colors"
              title="跳转到任务"
            >
              <Target className="w-[18px] h-[18px]" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-[var(--dida-bg-hover)] rounded-full text-[var(--dida-text-tertiary)] transition-colors"
              title="关闭"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 flex gap-3">
          <div 
            className={`dida-checkbox mt-1.5 ${getPriorityClass(task.priority)}`}
            style={{ 
              borderColor: getPriorityColor(task.priority),
              backgroundColor: getPriorityBgColor(task.priority, false),
              width: '18px',
              height: '18px',
            }}
          />
          <div className="flex-1">
            <h3 className="text-[22px] font-semibold text-[var(--dida-text-main)] leading-tight tracking-tight">
              {task.title}
            </h3>
            {task.description && (
              <p className="mt-3 text-[14px] text-[var(--dida-text-secondary)] line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex justify-end gap-3 relative">
          <div className="relative">
            <button
              ref={snoozeButtonRef}
              onClick={() => setShowSnoozeMenu(!showSnoozeMenu)}
              className="px-6 py-2.5 text-[14px] font-medium text-[var(--dida-text-secondary)] hover:bg-[var(--dida-bg-hover)] rounded-[12px] transition-colors border border-[var(--dida-border-light)] min-w-[100px]"
            >
              稍后提醒
            </button>
            
            {showSnoozeMenu && (
              <div 
                ref={snoozeMenuRef}
                className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-[var(--dida-border-light)] py-1 z-[110] animate-in slide-in-from-bottom-2 fade-in duration-150"
              >
                {SNOOZE_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    onClick={() => handleSnoozeClick(option)}
                    className="w-full text-left px-4 py-2.5 text-[14px] text-[var(--dida-text-main)] hover:bg-[var(--dida-bg-hover)] transition-colors first:rounded-t-xl last:rounded-b-xl"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={onComplete}
            className="px-8 py-2.5 text-[14px] font-medium text-white bg-[var(--dida-primary)] hover:bg-[var(--dida-primary-hover)] rounded-[12px] transition-colors shadow-sm min-w-[100px]"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
