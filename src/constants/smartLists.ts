import { Inbox, Calendar, CalendarDays, ClipboardList, CheckCircle2, Trash2 } from 'lucide-react';

export const SMART_LIST_IDS = {
  INBOX: 'smart_inbox',
  ALL: 'smart_all',
  TODAY: 'smart_today',
  WEEK: 'smart_week',
  COMPLETED: 'smart_completed',
  TRASH: 'smart_trash',
} as const;

export const SMART_LIST_CONFIG = {
  [SMART_LIST_IDS.INBOX]: {
    icon: Inbox,
    label: '收集箱',
  },
  [SMART_LIST_IDS.ALL]: {
    icon: ClipboardList,
    label: '所有任务',
  },
  [SMART_LIST_IDS.TODAY]: {
    icon: Calendar,
    label: '今天',
  },
  [SMART_LIST_IDS.WEEK]: {
    icon: CalendarDays,
    label: '最近 7 天',
  },
  [SMART_LIST_IDS.COMPLETED]: {
    icon: CheckCircle2,
    label: '已完成',
  },
  [SMART_LIST_IDS.TRASH]: {
    icon: Trash2,
    label: '垃圾桶',
  },
};
