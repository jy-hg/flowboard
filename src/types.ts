export type Priority = 'High' | 'Medium' | 'Low';

export type ColumnId = 'backlog' | 'in-progress' | 'in-review' | 'done';

export interface CardData {
  id: string;
  boardId: string;
  title: string;
  assignee: string;
  priority: Priority;
  dueDate: string;
  columnId: ColumnId;
}

export interface ColumnDef {
  id: ColumnId;
  label: string;
}

export const COLUMNS: ColumnDef[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'in-review', label: 'In Review' },
  { id: 'done', label: 'Done' },
];

export interface BoardMeta {
  id: string;
  name: string;
  createdAt: string;
}
