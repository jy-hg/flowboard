import { supabase } from './supabaseClient';
import type { BoardMeta } from '../types';

interface BoardRow {
  id: string;
  name: string;
  created_at: string;
}

function mapBoard(row: BoardRow): BoardMeta {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

export async function fetchBoards(): Promise<BoardMeta[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapBoard);
}

export async function fetchBoard(boardId: string): Promise<BoardMeta | null> {
  const { data, error } = await supabase
    .from('boards')
    .select('id, name, created_at')
    .eq('id', boardId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBoard(data) : null;
}

export async function createBoard(userId: string, name: string): Promise<BoardMeta> {
  const { data, error } = await supabase
    .from('boards')
    .insert({ name, user_id: userId })
    .select('id, name, created_at')
    .single();
  if (error) throw error;
  return mapBoard(data);
}

export async function deleteBoard(boardId: string): Promise<void> {
  const { error } = await supabase.from('boards').delete().eq('id', boardId);
  if (error) throw error;
}

export async function renameBoard(boardId: string, name: string): Promise<BoardMeta> {
  const { data, error } = await supabase
    .from('boards')
    .update({ name })
    .eq('id', boardId)
    .select('id, name, created_at')
    .single();
  if (error) throw error;
  return mapBoard(data);
}
