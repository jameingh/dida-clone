import { format, isToday, isTomorrow, isYesterday, isThisYear } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 格式化任务日期显示，类似于滴答清单
 */
export const formatTaskDate = (timestamp: number | null | undefined) => {
  if (!timestamp) return '';
  
  // 处理秒级和毫秒级时间戳
  const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
  
  if (isToday(date)) {
    return '今天';
  }
  
  if (isTomorrow(date)) {
    return '明天';
  }
  
  if (isYesterday(date)) {
    return '昨天';
  }
  
  if (isThisYear(date)) {
    return format(date, 'M月d日', { locale: zhCN });
  }
  
  return format(date, 'yyyy年M月d日', { locale: zhCN });
};

/**
 * 格式化任务截止日期和时间，包含今天/明天等逻辑
 */
export const formatTaskDateTime = (timestamp: number | null | undefined) => {
  if (!timestamp) return '';
  
  // 处理秒级和毫秒级时间戳
  const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
  const timeStr = format(date, 'HH:mm');
  
  if (isToday(date)) {
    return `今天, ${timeStr}`;
  }
  
  if (isTomorrow(date)) {
    return `明天, ${timeStr}`;
  }
  
  if (isThisYear(date)) {
    return format(date, 'M月d日, HH:mm', { locale: zhCN });
  }
  
  return format(date, 'yyyy年M月d日, HH:mm', { locale: zhCN });
};

/**
 * 格式化详细时间
 */
export const formatTaskTime = (timestamp: number | null | undefined) => {
  if (!timestamp) return '';
  // 处理秒级和毫秒级时间戳
  const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
  // 如果时间是 00:00，通常代表没设置具体时间
  if (date.getHours() === 0 && date.getMinutes() === 0) return '';
  return format(date, 'HH:mm');
};

/**
 * 判断日期是否已过期（早于今天）
 */
export const isOverdue = (timestamp: number | null | undefined) => {
  if (!timestamp) return false;
  
  // 处理秒级和毫秒级时间戳
  const date = new Date(timestamp > 10000000000 ? timestamp : timestamp * 1000);
  const now = new Date();
  
  // 仅比较日期部分
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  return date.getTime() < now.getTime();
};
