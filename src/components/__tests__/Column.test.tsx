import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Column } from '../Column';
import type { CardData } from '../../types';

const card: CardData = {
  id: 'c1', boardId: 'b1', title: 'A card', assignee: '', priority: 'Low', dueDate: '', columnId: 'backlog',
};
const column = { id: 'in-progress' as const, label: 'In Progress' };

function setup(cards: CardData[] = [card]) {
  const props = { onAddCard: vi.fn(), onEditCard: vi.fn(), onDropCard: vi.fn() };
  const { container } = render(<Column column={column} cards={cards} {...props} />);
  return { props, section: container.querySelector('section')! };
}

describe('Column', () => {
  it('renders an h2 heading with the card count (audit: heading order)', () => {
    setup();
    expect(screen.getByRole('heading', { level: 2, name: 'In Progress' })).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows the empty drop zone when there are no cards', () => {
    setup([]);
    expect(screen.getByText(/Drop a card here/)).toBeInTheDocument();
  });

  it('moves a dropped card into this column', () => {
    const { props, section } = setup();
    fireEvent.drop(section, { dataTransfer: { getData: () => 'c9' } });
    expect(props.onDropCard).toHaveBeenCalledWith('c9', 'in-progress');
  });

  it('ignores drops with no card id', () => {
    const { props, section } = setup();
    fireEvent.drop(section, { dataTransfer: { getData: () => '' } });
    expect(props.onDropCard).not.toHaveBeenCalled();
  });

  it('"Add card" and card click call back', () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Add card/ }));
    fireEvent.click(screen.getByRole('button', { name: /A card/ }));
    expect(props.onAddCard).toHaveBeenCalled();
    expect(props.onEditCard).toHaveBeenCalledWith(card);
  });

  it('keeps decorative images empty-alt with explicit dimensions (audit: CLS)', () => {
    setup([]);
    const img = document.querySelector('img')!;
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('width');
    expect(img).toHaveAttribute('height');
  });
});
