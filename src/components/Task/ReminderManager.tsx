import { useEffect, useRef, useState } from 'react';
import { useTasks, useUpdateTask } from '../../hooks/useTasks';
import { useAppStore } from '../../store/useAppStore';
import ReminderModal from './ReminderModal';

const REMINDER_OFFSETS: Record<string, number> = {
  'on_time': 0,
  '5m_before': 5 * 60,
  '30m_before': 30 * 60,
  '1h_before': 60 * 60,
  '1d_before': 24 * 60 * 60,
};

export default function ReminderManager() {
  const { data: tasks } = useTasks();
  const updateTask = useUpdateTask();
  const { activeReminderTask, setActiveReminderTask, setSelectedTaskId } = useAppStore();
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());
  const checkIntervalRef = useRef<number | null>(null);

  const checkReminders = () => {
    if (!tasks) return;

    const now = Math.floor(Date.now() / 1000);

    const taskToNotify = tasks.find(task => {
      if (task.completed || task.is_deleted || !task.due_date || !task.reminder || task.reminder === 'none') {
        return false;
      }

      if (notifiedTaskIds.has(task.id)) {
        return false;
      }

      const offset = REMINDER_OFFSETS[task.reminder] || 0;
      const reminderTime = task.due_date - offset;

      // 只有在当前时间之后且在 1 分钟内的提醒才触发，避免触发太久以前的提醒
      return now >= reminderTime && now < reminderTime + 60;
    });

    if (taskToNotify) {
      setActiveReminderTask(taskToNotify);
      setNotifiedTaskIds(prev => new Set(prev).add(taskToNotify.id));
    }
  };

  useEffect(() => {
    // 每 30 秒检查一次
    checkIntervalRef.current = window.setInterval(checkReminders, 30000);
    
    // 初始检查
    checkReminders();

    return () => {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
      }
    };
  }, [tasks, notifiedTaskIds]);

  const handleClose = () => {
    setActiveReminderTask(null);
  };

  const handleSnooze = (minutes?: number) => {
    if (!activeReminderTask) return;
    
    const snoozedTaskId = activeReminderTask.id;
    const snoozeTime = (minutes || 5) * 60 * 1000;
    
    setActiveReminderTask(null);
    
    // 从已通知列表中移除，并在指定时间后再次允许触发提醒
    setTimeout(() => {
      setNotifiedTaskIds(prev => {
        const next = new Set(prev);
        next.delete(snoozedTaskId);
        return next;
      });
    }, snoozeTime);
  };

  const handleComplete = () => {
    if (!activeReminderTask) return;
    
    updateTask.mutate({
      ...activeReminderTask,
      completed: true,
      completed_at: Math.floor(Date.now() / 1000),
    });
    
    setActiveReminderTask(null);
  };

  const handleGoToTask = () => {
    if (!activeReminderTask) return;
    setSelectedTaskId(activeReminderTask.id);
    setActiveReminderTask(null);
  };

  if (!activeReminderTask) return null;

  return (
    <ReminderModal
      task={activeReminderTask}
      onClose={handleClose}
      onSnooze={handleSnooze}
      onComplete={handleComplete}
      onGoToTask={handleGoToTask}
    />
  );
}
