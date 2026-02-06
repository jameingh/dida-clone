export enum Priority {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3,
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
  tags?: string[];
  parent_id?: string;
}
