import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { createBoard, deleteBoard, fetchBoards } from '../lib/boards';
import type { BoardMeta } from '../types';
import { Navbar } from '../components/Navbar';
import { CreateBoardModal } from '../components/CreateBoardModal';
import { useConfirm } from '../hooks/useConfirm';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import newBoardIconUrl from '../assets/new-board-icon.svg';
import styles from './BoardsPage.module.css';

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function BoardCard({ board, onDelete }: { board: BoardMeta; onDelete: (id: string) => void }) {
  const confirm = useConfirm(() => onDelete(board.id));
  const confirmTextId = useId();

  return (
    <div className={styles.card}>
      <Link to={`/boards/${board.id}`} className={styles.cardLink}>
        <span className={styles.cardTitle}>{board.name}</span>
        <span className={styles.cardDate}>{formatDate(board.createdAt)}</span>
      </Link>
      <button
        ref={confirm.triggerRef}
        type="button"
        className={styles.deleteButton}
        aria-label={`Delete ${board.name}`}
        onClick={confirm.request}
      >
        <span aria-hidden="true">✕</span>
      </button>
      {confirm.isConfirming && (
        <div
          className={styles.confirmPanel}
          role="group"
          aria-labelledby={confirmTextId}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              confirm.cancel();
            }
          }}
        >
          <span id={confirmTextId} className={styles.confirmText}>
            Delete “{board.name}” and all its cards?
          </span>
          <div className={styles.confirmActions}>
            <button type="button" className={styles.confirmDelete} onClick={confirm.confirm}>
              Yes, delete
            </button>
            <button ref={confirm.cancelRef} type="button" className={styles.confirmCancel} onClick={confirm.cancel}>
              Keep board
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BoardsPage() {
  const { session } = useAuth();
  const [boards, setBoards] = useState<BoardMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useDocumentTitle('My Boards – FlowBoard', { noindex: true });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchBoards()
      .then((data) => {
        if (!cancelled) setBoards(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load boards.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateBoard(name: string) {
    if (!session) return;
    try {
      const board = await createBoard(session.user.id, name);
      setIsCreating(false);
      navigate(`/boards/${board.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board.');
    }
  }

  async function handleDeleteBoard(boardId: string) {
    const previous = boards;
    setBoards((current) => current.filter((board) => board.id !== boardId));
    headingRef.current?.focus();
    try {
      await deleteBoard(boardId);
    } catch (err) {
      setBoards(previous);
      setError(err instanceof Error ? err.message : 'Failed to delete board.');
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main id="main-content" tabIndex={-1} className={styles.main}>
        <div className={styles.content}>
          <div className={styles.headerRow}>
            <h1 ref={headingRef} tabIndex={-1}>
              My Boards
            </h1>
            <button type="button" className={styles.newBoardButton} onClick={() => setIsCreating(true)}>
              <img src={newBoardIconUrl} alt="" width={18} height={18} className={styles.newBoardIcon} />
              <span>New Board</span>
            </button>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
              <button type="button" className={styles.dismissError} onClick={() => setError(null)} aria-label="Dismiss error">
                <span aria-hidden="true">✕</span>
              </button>
            </p>
          )}

          {loading ? (
            <div className={styles.emptyState} role="status">
              Loading boards…
            </div>
          ) : boards.length === 0 ? (
            <div className={styles.emptyState}>No boards yet — create one to get started.</div>
          ) : (
            <div className={styles.grid}>
              {boards.map((board) => (
                <BoardCard key={board.id} board={board} onDelete={handleDeleteBoard} />
              ))}
            </div>
          )}
        </div>
      </main>

      {isCreating && <CreateBoardModal onCreate={handleCreateBoard} onCancel={() => setIsCreating(false)} />}
    </div>
  );
}
