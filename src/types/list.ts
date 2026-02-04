export interface List {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_smart: boolean;
  order: number;
  created_at: number;
}

export enum SmartListType {
  Inbox = 'smart_inbox',
  Today = 'smart_today',
  Week = 'smart_week',
  All = 'smart_all',
  Completed = 'smart_completed',
  Trash = 'smart_trash',
}
