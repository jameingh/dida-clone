import { Priority } from '../types';

export const PRIORITY_COLORS = {
  [Priority.High]: 'var(--priority-high)',
  [Priority.Medium]: 'var(--priority-medium)',
  [Priority.Low]: 'var(--priority-low)',
  [Priority.None]: 'var(--priority-none)',
};

export const PRIORITY_CLASSES = {
  [Priority.High]: 'priority-high',
  [Priority.Medium]: 'priority-medium',
  [Priority.Low]: 'priority-low',
  [Priority.None]: 'priority-none',
};

export const PRIORITY_LABELS = {
  [Priority.High]: '高',
  [Priority.Medium]: '中',
  [Priority.Low]: '低',
  [Priority.None]: '无',
};

export const PRIORITY_TEXT_CLASSES = {
  [Priority.High]: 'text-[var(--priority-high)]',
  [Priority.Medium]: 'text-[var(--priority-medium)]',
  [Priority.Low]: 'text-[var(--priority-low)]',
  [Priority.None]: 'text-[var(--priority-none)]',
};

export const getPriorityColor = (priority: Priority) => PRIORITY_COLORS[priority];
export const getPriorityClass = (priority: Priority) => PRIORITY_CLASSES[priority];
export const getPriorityLabel = (priority: Priority) => PRIORITY_LABELS[priority];
export const getPriorityTextClass = (priority: Priority) => PRIORITY_TEXT_CLASSES[priority];

/**
 * 为 Checkbox 提供背景色，通常是主色的极浅变体
 */
export const getPriorityBgColor = (priority: Priority, completed: boolean) => {
  if (completed) return undefined;
  return `color-mix(in srgb, ${PRIORITY_COLORS[priority]} 5%, transparent)`;
};
