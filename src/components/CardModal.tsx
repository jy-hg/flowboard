import { useId, useState, type FormEvent } from 'react';
import type { CardData, Priority } from '../types';
import { useModal } from '../hooks/useModal';
import { useConfirm } from '../hooks/useConfirm';
import styles from './CardModal.module.css';

export type CardFormValues = Pick<CardData, 'title' | 'assignee' | 'priority' | 'dueDate'>;

interface CardModalProps {
  mode: 'create' | 'edit';
  initialValues: CardFormValues;
  knownAssignees?: string[];
  onSave: (values: CardFormValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const PRIORITIES: Priority[] = ['High', 'Medium', 'Low'];

export function CardModal({ mode, initialValues, knownAssignees = [], onSave, onCancel, onDelete }: CardModalProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [assignee, setAssignee] = useState(initialValues.assignee);
  const [priority, setPriority] = useState<Priority>(initialValues.priority);
  const [dueDate, setDueDate] = useState(initialValues.dueDate);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useModal<HTMLDivElement>(onCancel);
  const deleteConfirm = useConfirm(() => onDelete?.());
  const confirmTextId = useId();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required.');
      return;
    }
    onSave({ title: trimmedTitle, assignee: assignee.trim(), priority, dueDate });
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="card-modal-title">{mode === 'create' ? 'New card' : 'Edit card'}</h2>
          <button type="button" className={styles.closeButton} onClick={onCancel} aria-label="Close">
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="card-title">Title</label>
            <input
              id="card-title"
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter card title..."
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'card-title-error' : undefined}
              autoFocus
            />
            {error && (
              <span id="card-title-error" className={styles.error} role="alert">
                {error}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="card-assignee">Assignee</label>
            <input
              id="card-assignee"
              type="text"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              placeholder="Who's on this?"
              list="card-assignee-options"
              autoComplete="off"
            />
            <datalist id="card-assignee-options">
              {knownAssignees.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="card-priority">Priority</label>
              <select
                id="card-priority"
                value={priority}
                onChange={(event) => setPriority(event.target.value as Priority)}
              >
                {PRIORITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="card-due-date">Due date</label>
              <input
                id="card-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>
          </div>

          <div className={styles.footer}>
            {mode === 'edit' && onDelete && (
              deleteConfirm.isConfirming ? (
                <div
                  className={styles.confirm}
                  role="group"
                  aria-labelledby={confirmTextId}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      event.stopPropagation();
                      deleteConfirm.cancel();
                    }
                  }}
                >
                  <span id={confirmTextId} className={styles.confirmText}>
                    Delete this card?
                  </span>
                  <button type="button" className={styles.confirmDelete} onClick={deleteConfirm.confirm}>
                    Yes, delete
                  </button>
                  <button
                    ref={deleteConfirm.cancelRef}
                    type="button"
                    className={styles.confirmCancel}
                    onClick={deleteConfirm.cancel}
                  >
                    Keep card
                  </button>
                </div>
              ) : (
                <button
                  ref={deleteConfirm.triggerRef}
                  type="button"
                  className={styles.deleteButton}
                  onClick={deleteConfirm.request}
                >
                  Delete card
                </button>
              )
            )}
            <div className={styles.actions}>
              <button type="button" className={styles.cancelButton} onClick={onCancel}>
                Cancel
              </button>
              <button type="submit" className={styles.saveButton}>
                {mode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
