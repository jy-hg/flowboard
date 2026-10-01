import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Card } from '../Card';
import type { CardData } from '../../types';

const base: CardData = {
  id: 'c1', boardId: 'b1', title: 'Ship it', assignee: 'Sam Lee', priority: 'High',
  dueDate: '', columnId: 'backlog',
};

function setup(card: Partial<CardData> = {}) {
  const props = { onClick: vi.fn(), onMove: vi.fn(), onDragStart: vi.fn(), onDragEnd: vi.fn() };
  render(<Card card={{ ...base, ...card }} {...props} />);
  return props;
}

describe('Card', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-10T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('shows title, priority and assignee initials', () => {
    setup();
    expect(screen.getByText('Ship it')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('SL')).toBeInTheDocument();
  });

  it('shows "?" initials-free avatar only when there is an assignee', () => {
    setup({ assignee: '' });
    expect(screen.queryByTitle('Sam Lee')).not.toBeInTheDocument();
  });

  it('flags past due dates as overdue but not for done cards', () => {
    const { unmount } = render(
      <Card card={{ ...base, dueDate: '2026-10-01' }} onClick={vi.fn()} onMove={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} />,
    );
    expect(screen.getByText(/Oct 1/).className).toContain('overdue');
    unmount();
    render(
      <Card card={{ ...base, dueDate: '2026-10-01', columnId: 'done' }} onClick={vi.fn()} onMove={vi.fn()} onDragStart={vi.fn()} onDragEnd={vi.fn()} />,
    );
    expect(screen.getByText(/Oct 1/).className).not.toContain('overdue');
  });

  it('opens on click and on Enter/Space (keyboard access)', () => {
    const props = setup();
    const button = screen.getByRole('button', { name: /Ship it/ });
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyDown(button, { key: ' ' });
    fireEvent.keyDown(button, { key: 'a' });
    expect(props.onClick).toHaveBeenCalledTimes(3);
    expect(button).toHaveAttribute('tabindex', '0');
  });

  it('moves via the "Move to" select without opening the card', async () => {
    vi.useRealTimers();
    const props = setup();
    await userEvent.selectOptions(screen.getByLabelText('Move to'), 'done');
    expect(props.onMove).toHaveBeenCalledWith('done');
    expect(props.onClick).not.toHaveBeenCalled();
  });

  it('writes its id to the drag payload on drag start', () => {
    const props = setup();
    const setData = vi.fn();
    const draggable = screen.getByRole('button', { name: /Ship it/ }).parentElement!;
    fireEvent.dragStart(draggable, { dataTransfer: { setData, effectAllowed: '' } });
    expect(setData).toHaveBeenCalledWith('text/plain', 'c1');
    expect(props.onDragStart).toHaveBeenCalledWith('c1');
    fireEvent.dragEnd(draggable);
    expect(props.onDragEnd).toHaveBeenCalled();
  });
});
