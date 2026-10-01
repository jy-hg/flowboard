import { useState, type FormEvent } from 'react';
import { useModal } from '../hooks/useModal';
import styles from './CreateBoardModal.module.css';

interface CreateBoardModalProps {
  onCreate: (name: string) => void;
  onCancel: () => void;
}

export function CreateBoardModal({ onCreate, onCancel }: CreateBoardModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const modalRef = useModal<HTMLDivElement>(onCancel);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Board name is required.');
      return;
    }
    onCreate(trimmed);
  }

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-board-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="create-board-title">Create board</h2>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="board-name">Board name</label>
            <input
              id="board-name"
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Product Roadmap"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'board-name-error' : undefined}
              autoFocus
            />
            {error && (
              <span id="board-name-error" className={styles.error} role="alert">
                {error}
              </span>
            )}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className={styles.createButton}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
