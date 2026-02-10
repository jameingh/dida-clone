export enum Priority {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3,
}

export enum RepeatType {
  None = 'none',
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Yearly = 'yearly',
  Weekday = 'weekday',
  Custom = 'custom',
}

export interface RepeatRule {
  type: RepeatType;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  list_id: string;
  completed: boolean;
  priority: Priority;
  due_date: number | null;
  reminder: string | null;
  repeat_rule: RepeatRule | null;
  tags: string[];
  parent_id: string | null;
  order: number;
  is_deleted: boolean;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

export interface CreateTaskInput {
  title: string;
  list_id: string;
  description?: string;
  priority?: Priority;
  due_date?: number;
  reminder?: string;
  repeat_rule?: RepeatRule;
  tags?: string[];
  parent_id?: string;
}
