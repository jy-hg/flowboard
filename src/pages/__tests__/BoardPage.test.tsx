import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CardData } from '../../types';

const api = vi.hoisted(() => ({
  fetchBoard: vi.fn(), renameBoard: vi.fn(),
  fetchCards: vi.fn(), createCard: vi.fn(), updateCard: vi.fn(), moveCard: vi.fn(), deleteCard: vi.fn(),
}));
vi.mock('../../lib/boards', () => ({ fetchBoard: api.fetchBoard, renameBoard: api.renameBoard }));
vi.mock('../../lib/cards', () => ({
  fetchCards: api.fetchCards, createCard: api.createCard, updateCard: api.updateCard,
  moveCard: api.moveCard, deleteCard: api.deleteCard,
}));
vi.mock('../../lib/AuthContext', () => ({ useAuth: () => ({ session: { user: { id: 'u1' } } }) }));
vi.mock('../../components/Navbar', () => ({ Navbar: () => <nav /> }));

import { BoardPage } from '../BoardPage';

const card = (over: Partial<CardData>): CardData => ({
  id: 'c1', boardId: 'b1', title: 'Alpha', assignee: 'Sam', priority: 'High', dueDate: '', columnId: 'backlog', ...over,
});
const board = { id: 'b1', name: 'Roadmap', createdAt: '2026-10-01' };

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/boards/b1']}>
      <Routes><Route path="/boards/:boardId" element={<BoardPage />} /></Routes>
    </MemoryRouter>,
  );
}
const column = (name: string) => screen.getByRole('heading', { name }).closest('section')!;

beforeEach(() => {
  vi.resetAllMocks();
  api.fetchBoard.mockResolvedValue(board);
  api.fetchCards.mockResolvedValue([card({}), card({ id: 'c2', title: 'Beta', assignee: 'Kim', priority: 'Low', columnId: 'done' })]);
});

describe('BoardPage – loading', () => {
  it('shows a status message, then the cards in their columns', async () => {
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Loading board');
    expect(await screen.findByRole('heading', { level: 1, name: /Roadmap/ })).toBeInTheDocument();
    expect(within(column('Backlog')).getByText('Alpha')).toBeInTheDocument();
    expect(within(column('Done')).getByText('Beta')).toBeInTheDocument();
  });

  it('sets a noindex robots meta and board title (audit: private pages)', async () => {
    renderPage();
    await screen.findByText('Alpha');
    expect(document.title).toBe('Roadmap – FlowBoard');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  it('shows a headed not-found state for a missing board (audit)', async () => {
    api.fetchBoard.mockResolvedValue(null);
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'Board not found' })).toBeInTheDocument();
  });

  it('keeps the loading status off the <main> landmark (audit)', () => {
    renderPage();
    expect(screen.getByRole('main')).not.toHaveAttribute('role', 'status');
  });

  it('surfaces load errors in an alert', async () => {
    api.fetchCards.mockRejectedValue(new Error('load failed'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('load failed');
  });
});

describe('BoardPage – creating cards', () => {
  it('creates a card in the chosen column with the signed-in user', async () => {
    api.createCard.mockResolvedValue(card({ id: 'c3', title: 'Gamma', columnId: 'in-progress' }));
    renderPage();
    await screen.findByText('Alpha');
    await userEvent.click(within(column('In Progress')).getByRole('button', { name: /Add card/ }));
    await userEvent.type(screen.getByLabelText('Title'), 'Gamma');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(api.createCard).toHaveBeenCalledWith('u1', 'b1', 'in-progress', {
      title: 'Gamma', assignee: '', priority: 'Medium', dueDate: '',
    });
    expect(await within(column('In Progress')).findByText('Gamma')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the modal open and shows an error if saving fails', async () => {
    api.createCard.mockRejectedValue(new Error('save failed'));
    renderPage();
    await screen.findByText('Alpha');
    await userEvent.click(within(column('Backlog')).getByRole('button', { name: /Add card/ }));
    await userEvent.type(screen.getByLabelText('Title'), 'Nope');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('save failed');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

describe('BoardPage – editing cards', () => {
  it('replaces the card in place by id', async () => {
    api.updateCard.mockResolvedValue(card({ title: 'Alpha v2' }));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /Alpha/ }));
    expect(screen.getByRole('dialog', { name: 'Edit card' })).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Title'));
    await userEvent.type(screen.getByLabelText('Title'), 'Alpha v2');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(api.updateCard).toHaveBeenCalledWith('c1', expect.objectContaining({ title: 'Alpha v2' }));
    expect(await screen.findByText('Alpha v2')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });
});

describe('BoardPage – moving cards', () => {
  it('moves optimistically and persists the new column', async () => {
    let resolveMove!: () => void;
    api.moveCard.mockReturnValue(new Promise<void>((r) => (resolveMove = r)));
    renderPage();
    await screen.findByText('Alpha');
    const select = within(within(column('Backlog')).getByRole('button', { name: /Alpha/ }).parentElement!).getByLabelText('Move to');
    await userEvent.selectOptions(select, 'in-review');
    // visible before the server answers
    expect(within(column('In Review')).getByText('Alpha')).toBeInTheDocument();
    expect(api.moveCard).toHaveBeenCalledWith('c1', 'in-review');
    resolveMove();
  });

  it('rolls back and shows an error when the move fails', async () => {
    api.moveCard.mockRejectedValue(new Error('move failed'));
    renderPage();
    await screen.findByText('Alpha');
    const select = within(column('Backlog')).getByLabelText('Move to');
    await userEvent.selectOptions(select, 'done');
    expect(await screen.findByRole('alert')).toHaveTextContent('move failed');
    await waitFor(() => expect(within(column('Backlog')).getByText('Alpha')).toBeInTheDocument());
    expect(within(column('Done')).queryByText('Alpha')).not.toBeInTheDocument();
  });
});

describe('BoardPage – deleting cards', () => {
  async function openDelete() {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /Alpha/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete card' }));
  }

  it('removes the card only after the delete succeeds', async () => {
    api.deleteCard.mockResolvedValue(undefined);
    await openDelete();
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(api.deleteCard).toHaveBeenCalledWith('c1');
    await waitFor(() => expect(screen.queryByText('Alpha')).not.toBeInTheDocument());
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('keeps the card and shows an error when the delete fails', async () => {
    api.deleteCard.mockRejectedValue(new Error('delete failed'));
    await openDelete();
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('delete failed');
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0);
  });
});

describe('BoardPage – search and filters', () => {
  it('filters by title or assignee, case-insensitively', async () => {
    renderPage();
    await screen.findByText('Alpha');
    await userEvent.type(screen.getByLabelText('Search cards by title or assignee'), 'KIM');
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('filters by priority', async () => {
    renderPage();
    await screen.findByText('Alpha');
    await userEvent.selectOptions(screen.getByLabelText('Filter by priority'), 'High');
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });
});

describe('BoardPage – rename (audit: focus return)', () => {
  it('has a descriptive rename button and returns focus to it after cancelling', async () => {
    renderPage();
    const rename = await screen.findByRole('button', { name: 'Roadmap, rename board' });
    await userEvent.click(rename);
    await userEvent.keyboard('{Escape}');
    expect(api.renameBoard).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Roadmap, rename board' })).toHaveFocus());
  });
});
