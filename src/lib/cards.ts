import { supabase } from './supabaseClient';
import type { CardData, ColumnId, Priority } from '../types';
import type { CardFormValues } from '../components/CardModal';

interface CardRow {
  id: string;
  board_id: string;
  title: string;
  assignee: string;
  priority: Priority;
  due_date: string | null;
  column_id: ColumnId;
}

const CARD_COLUMNS = 'id, board_id, title, assignee, priority, due_date, column_id';

function mapCard(row: CardRow): CardData {
  return {
    id: row.id,
    boardId: row.board_id,
    title: row.title,
    assignee: row.assignee,
    priority: row.priority,
    dueDate: row.due_date ?? '',
    columnId: row.column_id,
  };
}

export async function fetchCards(boardId: string): Promise<CardData[]> {
  const { data, error } = await supabase
    .from('cards')
    .select(CARD_COLUMNS)
    .eq('board_id', boardId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapCard);
}

export async function createCard(
  userId: string,
  boardId: string,
  columnId: ColumnId,
  values: CardFormValues,
): Promise<CardData> {
  const { data, error } = await supabase
    .from('cards')
    .insert({
      user_id: userId,
      board_id: boardId,
      column_id: columnId,
      title: values.title,
      assignee: values.assignee,
      priority: values.priority,
      due_date: values.dueDate || null,
    })
    .select(CARD_COLUMNS)
    .single();
  if (error) throw error;
  return mapCard(data);
}

export async function updateCard(cardId: string, values: CardFormValues): Promise<CardData> {
  const { data, error } = await supabase
    .from('cards')
    .update({
      title: values.title,
      assignee: values.assignee,
      priority: values.priority,
      due_date: values.dueDate || null,
    })
    .eq('id', cardId)
    .select(CARD_COLUMNS)
    .single();
  if (error) throw error;
  return mapCard(data);
}

export async function moveCard(cardId: string, columnId: ColumnId): Promise<void> {
  const { error } = await supabase.from('cards').update({ column_id: columnId }).eq('id', cardId);
  if (error) throw error;
}

export async function deleteCard(cardId: string): Promise<void> {
  const { error } = await supabase.from('cards').delete().eq('id', cardId);
  if (error) throw error;
}
