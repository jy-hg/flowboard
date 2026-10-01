import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSupabaseMock } from '../../test/supabaseMock';

const mock = vi.hoisted(() => ({ current: null as unknown as ReturnType<typeof createSupabaseMock> }));
vi.mock('../supabaseClient', async () => {
  const { createSupabaseMock } = await import('../../test/supabaseMock');
  mock.current = createSupabaseMock();
  return { supabase: mock.current.supabase };
});

import { createCard, deleteCard, fetchCards, moveCard, updateCard } from '../cards';

const row = {
  id: 'c1',
  board_id: 'b1',
  title: 'Write tests',
  assignee: 'Sam',
  priority: 'High',
  due_date: null,
  column_id: 'backlog',
};
const values = { title: 'Write tests', assignee: 'Sam', priority: 'High' as const, dueDate: '' };

beforeEach(() => mock.current.reset());

describe('fetchCards', () => {
  it('queries the board oldest-first and maps rows to camelCase', async () => {
    mock.current.respondWith([row, { ...row, id: 'c2', due_date: '2026-10-05' }]);
    const cards = await fetchCards('b1');
    expect(mock.current.lastCalls()).toEqual([
      ['from', ['cards']],
      ['select', ['id, board_id, title, assignee, priority, due_date, column_id']],
      ['eq', ['board_id', 'b1']],
      ['order', ['created_at', { ascending: true }]],
    ]);
    expect(cards[0]).toEqual({
      id: 'c1', boardId: 'b1', title: 'Write tests', assignee: 'Sam',
      priority: 'High', dueDate: '', columnId: 'backlog',
    });
    expect(cards[1].dueDate).toBe('2026-10-05');
  });

  it('returns an empty list when there is no data', async () => {
    mock.current.respondWith(null);
    expect(await fetchCards('b1')).toEqual([]);
  });

  it('throws when Supabase returns an error', async () => {
    mock.current.respondWith(null, { message: 'boom' });
    await expect(fetchCards('b1')).rejects.toMatchObject({ message: 'boom' });
  });
});

describe('createCard', () => {
  it('inserts with user, board and column, and stores an empty due date as null', async () => {
    mock.current.respondWith(row);
    const card = await createCard('u1', 'b1', 'backlog', values);
    const insert = mock.current.lastCalls().find(([name]) => name === 'insert');
    expect(insert?.[1][0]).toEqual({
      user_id: 'u1', board_id: 'b1', column_id: 'backlog', title: 'Write tests',
      assignee: 'Sam', priority: 'High', due_date: null,
    });
    expect(card.id).toBe('c1');
  });

  it('passes a real due date through', async () => {
    mock.current.respondWith({ ...row, due_date: '2026-10-05' });
    await createCard('u1', 'b1', 'done', { ...values, dueDate: '2026-10-05' });
    const insert = mock.current.lastCalls().find(([name]) => name === 'insert');
    expect(insert?.[1][0]).toMatchObject({ due_date: '2026-10-05', column_id: 'done' });
  });

  it('throws on error', async () => {
    mock.current.respondWith(null, { message: 'denied' });
    await expect(createCard('u1', 'b1', 'backlog', values)).rejects.toMatchObject({ message: 'denied' });
  });
});

describe('updateCard', () => {
  it('updates the editable fields for one card id', async () => {
    mock.current.respondWith({ ...row, title: 'New title' });
    const card = await updateCard('c1', { ...values, title: 'New title' });
    const calls = mock.current.lastCalls();
    expect(calls.find(([n]) => n === 'update')?.[1][0]).toEqual({
      title: 'New title', assignee: 'Sam', priority: 'High', due_date: null,
    });
    expect(calls).toContainEqual(['eq', ['id', 'c1']]);
    expect(card.title).toBe('New title');
  });

  it('throws on error', async () => {
    mock.current.respondWith(null, { message: 'nope' });
    await expect(updateCard('c1', values)).rejects.toMatchObject({ message: 'nope' });
  });
});

describe('moveCard', () => {
  it('changes only column_id for the given card', async () => {
    mock.current.respondWith(null);
    await moveCard('c1', 'in-review');
    const calls = mock.current.lastCalls();
    expect(calls.find(([n]) => n === 'update')?.[1][0]).toEqual({ column_id: 'in-review' });
    expect(calls).toContainEqual(['eq', ['id', 'c1']]);
  });

  it('throws on error', async () => {
    mock.current.respondWith(null, { message: 'fail' });
    await expect(moveCard('c1', 'done')).rejects.toMatchObject({ message: 'fail' });
  });
});

describe('deleteCard', () => {
  it('deletes by id', async () => {
    mock.current.respondWith(null);
    await deleteCard('c1');
    const calls = mock.current.lastCalls();
    expect(calls.map(([n]) => n)).toEqual(['from', 'delete', 'eq']);
    expect(calls[2]).toEqual(['eq', ['id', 'c1']]);
  });

  it('throws on error', async () => {
    mock.current.respondWith(null, { message: 'fail' });
    await expect(deleteCard('c1')).rejects.toMatchObject({ message: 'fail' });
  });
});
