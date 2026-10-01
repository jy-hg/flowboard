import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CardModal, type CardFormValues } from '../CardModal';

const empty: CardFormValues = { title: '', assignee: '', priority: 'Medium', dueDate: '' };

function setup(mode: 'create' | 'edit', initial = empty, withDelete = mode === 'edit') {
  const props = { onSave: vi.fn(), onCancel: vi.fn(), onDelete: withDelete ? vi.fn() : undefined };
  render(<CardModal mode={mode} initialValues={initial} {...props} />);
  return props;
}

describe('CardModal – create', () => {
  it('requires a title and announces the error accessibly', async () => {
    const props = setup('create');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(props.onSave).not.toHaveBeenCalled();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Title is required.');
    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', alert.id);
  });

  it('rejects a whitespace-only title', async () => {
    const props = setup('create');
    await userEvent.type(screen.getByLabelText('Title'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it('saves trimmed values with the chosen priority and due date', async () => {
    const props = setup('create');
    await userEvent.type(screen.getByLabelText('Title'), '  New thing  ');
    await userEvent.type(screen.getByLabelText('Assignee'), ' Sam ');
    await userEvent.selectOptions(screen.getByLabelText('Priority'), 'High');
    await userEvent.type(screen.getByLabelText('Due date'), '2026-10-05');
    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(props.onSave).toHaveBeenCalledWith({
      title: 'New thing', assignee: 'Sam', priority: 'High', dueDate: '2026-10-05',
    });
  });

  it('has no delete button in create mode', () => {
    setup('create');
    expect(screen.queryByRole('button', { name: 'Delete card' })).not.toBeInTheDocument();
  });
});

describe('CardModal – edit', () => {
  const existing: CardFormValues = { title: 'Old', assignee: 'Kim', priority: 'Low', dueDate: '2026-11-01' };

  it('prefills the form and saves edits', async () => {
    const props = setup('edit', existing);
    expect(screen.getByLabelText('Title')).toHaveValue('Old');
    expect(screen.getByLabelText('Priority')).toHaveValue('Low');
    await userEvent.clear(screen.getByLabelText('Title'));
    await userEvent.type(screen.getByLabelText('Title'), 'Updated');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(props.onSave).toHaveBeenCalledWith({ ...existing, title: 'Updated' });
  });

  it('delete needs a second confirming click', async () => {
    const props = setup('edit', existing);
    await userEvent.click(screen.getByRole('button', { name: 'Delete card' }));
    expect(props.onDelete).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it('confirm moves focus to the safe option and "Keep card" restores focus to the trigger', async () => {
    const props = setup('edit', existing);
    await userEvent.click(screen.getByRole('button', { name: 'Delete card' }));
    expect(screen.getByRole('button', { name: 'Keep card' })).toHaveFocus();
    expect(screen.getByRole('group', { name: 'Delete this card?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep card' }));
    expect(screen.getByRole('button', { name: 'Delete card' })).toHaveFocus();
    expect(props.onDelete).not.toHaveBeenCalled();
  });

  it('Escape in the confirm step cancels only the confirm, not the modal', async () => {
    const props = setup('edit', existing);
    await userEvent.click(screen.getByRole('button', { name: 'Delete card' }));
    await userEvent.keyboard('{Escape}');
    expect(props.onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete card' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(props.onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('CardModal – accessibility (audit)', () => {
  it('is a labelled modal dialog', () => {
    setup('create');
    const dialog = screen.getByRole('dialog', { name: 'New card' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
