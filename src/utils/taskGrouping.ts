import { Task } from '../types';

export type GroupName = string;

export interface TaskGroup {
  name: GroupName;
  tasks: Task[];
}

/**
 * 判断任务所属的日期分组
 */
export const getTaskDateGroupName = (task: Task, strategy: 'all' | 'today' | 'week' = 'all'): string => {
  if (task.completed) return '已完成';
  if (!task.due_date) return '无日期';

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const taskDate = new Date(task.due_date * 1000);
  taskDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round((taskDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return '已过期';
  if (diffDays === 0) return '今天';

  if (strategy === 'today') {
    return '更远'; // 今天视图通常不显示更远的任务，但在某些逻辑下可能需要归类
  }

  if (strategy === 'all') {
    return '更远';
  }

  // Week strategy
  if (diffDays === 1) return '明天';
  
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][taskDate.getDay()];
  return `${taskDate.getMonth() + 1}月${taskDate.getDate()}日 ${weekday}`;
};

/**
 * 对任务进行分组
 */
export const groupTasks = (
  tasks: Task[], 
  strategy: 'all' | 'today' | 'week' | 'none' = 'all'
): Record<string, Task[]> => {
  if (strategy === 'none') {
    return { '任务': tasks };
  }

  const groups: Record<string, Task[]> = {};

  // 只对根任务进行分组，子任务通常在组件内部递归渲染
  const rootTasks = tasks.filter(t => !t.parent_id);

  rootTasks.forEach(task => {
    const groupName = getTaskDateGroupName(task, strategy);
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(task);
  });

  // 排序分组名称 (可选，根据策略)
  return groups;
};

/**
 * 获取排序后的分组名称
 */
export const getSortedGroupNames = (groups: Record<string, Task[]>): string[] => {
  const names = Object.keys(groups);
  
  const orderMap: Record<string, number> = {
    '已过期': 10,
    '今天': 20,
    '明天': 30,
    '更远': 100,
    '无日期': 110,
    '已完成': 200,
  };

  return names.sort((a, b) => {
    const orderA = orderMap[a] || 50; // 对于具体日期分组，默认值为 50
    const orderB = orderMap[b] || 50;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 如果都是具体日期分组，按日期排序
    const dateA = groups[a][0].due_date || 0;
    const dateB = groups[b][0].due_date || 0;
    return dateA - dateB;
  });
};
