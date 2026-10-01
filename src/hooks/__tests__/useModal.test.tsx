import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useModal } from '../useModal';

function Modal({ onClose }: { onClose: () => void }) {
  const ref = useModal<HTMLDivElement>(onClose);
  return (
    <div ref={ref} role="dialog">
      <button>first</button>
      <button>last</button>
    </div>
  );
}

function Page({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div>
      <button>trigger</button>
      <main data-testid="page">content</main>
      {open && <Modal onClose={onClose} />}
    </div>
  );
}

describe('useModal (audit: focus management)', () => {
  it('Escape calls onClose', () => {
    const onClose = vi.fn();
    render(<Page open onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab and Shift+Tab inside the modal', () => {
    render(<Page open onClose={vi.fn()} />);
    const first = screen.getByText('first');
    const last = screen.getByText('last');
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });

  it('makes the page behind inert, and restores it on close', () => {
    const { rerender } = render(<Page open onClose={vi.fn()} />);
    expect(screen.getByTestId('page').inert).toBe(true);
    rerender(<Page open={false} onClose={vi.fn()} />);
    expect(screen.getByTestId('page').inert).toBe(false);
  });

  it('returns focus to the element that opened it', async () => {
    const { rerender } = render(<Page open={false} onClose={vi.fn()} />);
    await userEvent.click(screen.getByText('trigger'));
    rerender(<Page open onClose={vi.fn()} />);
    rerender(<Page open={false} onClose={vi.fn()} />);
    expect(screen.getByText('trigger')).toHaveFocus();
  });
});
