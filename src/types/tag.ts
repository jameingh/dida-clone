export interface Tag {
  id: string;
  name: string;
  color: string;
  parent_id?: string | null;
  is_pinned?: boolean;
  created_at: number;
}
