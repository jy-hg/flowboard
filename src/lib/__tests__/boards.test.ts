import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseMock } from '../../test/supabaseMock';

const mock = vi.hoisted(() => ({ current: null as unknown as ReturnType<typeof createSupabaseMock> }));
vi.mock('../supabaseClient', async () => {
  const { createSupabaseMock } = await import('../../test/supabaseMock');
  mock.current = createSupabaseMock();
  return { supabase: mock.current.supabase };
});

import { deleteBoard, fetchBoard, fetchBoards } from '../boards';

beforeEach(() => mock.current.reset());

describe('boards', () => {
  it('fetchBoards returns newest first', async () => {
    mock.current.respondWith([{ id: 'b1', name: 'One', created_at: '2026-10-01' }]);
    const boards = await fetchBoards();
    expect(mock.current.lastCalls()).toContainEqual(['order', ['created_at', { ascending: false }]]);
    expect(boards).toHaveLength(1);
    expect(boards[0]).toMatchObject({ id: 'b1', name: 'One' });
  });

  it('fetchBoard returns null for a missing board instead of throwing', async () => {
    mock.current.respondWith(null);
    expect(await fetchBoard('missing')).toBeNull();
  });

  it('deleteBoard throws on error', async () => {
    mock.current.respondWith(null, { message: 'fail' });
    await expect(deleteBoard('b1')).rejects.toMatchObject({ message: 'fail' });
  });
});
