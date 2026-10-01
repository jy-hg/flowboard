import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { fetchBoard, renameBoard } from '../lib/boards';
import { createCard, deleteCard, fetchCards, moveCard, updateCard } from '../lib/cards';
import { COLUMNS, type BoardMeta, type CardData, type ColumnId, type Priority } from '../types';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Navbar } from '../components/Navbar';
import { Board } from '../components/Board';
import { CardModal, type CardFormValues } from '../components/CardModal';
import styles from './BoardPage.module.css';

type ModalState = { mode: 'create'; columnId: ColumnId } | { mode: 'edit'; card: CardData } | null;

const EMPTY_FORM: CardFormValues = { title: '', assignee: '', priority: 'Medium', dueDate: '' };
const PRIORITY_FILTERS: Array<Priority | 'all'> = ['all', 'High', 'Medium', 'Low'];

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { session } = useAuth();
  const [board, setBoard] = useState<BoardMeta | null | undefined>(undefined);
  const [cards, setCards] = useState<CardData[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const renameButtonRef = useRef<HTMLButtonElement>(null);
  const wasEditingName = useRef(false);
  const cancelRename = useRef(false);

  useDocumentTitle(board ? `${board.name} – FlowBoard` : 'Board – FlowBoard', { noindex: true });

  // Return focus to the rename button when the inline editor closes.
  useEffect(() => {
    if (wasEditingName.current && !isEditingName) renameButtonRef.current?.focus();
    wasEditingName.current = isEditingName;
  }, [isEditingName]);

  useEffect(() => {
    if (!boardId) return;
    let cancelled = false;
    setBoard(undefined);
    Promise.all([fetchBoard(boardId), fetchCards(boardId)])
      .then(([boardData, cardData]) => {
        if (cancelled) return;
        setBoard(boardData);
        setCards(cardData);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load board.');
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const knownAssignees = useMemo(
    () => Array.from(new Set(cards.map((card) => card.assignee).filter(Boolean))).sort(),
    [cards],
  );

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesQuery =
        !query || card.title.toLowerCase().includes(query) || card.assignee.toLowerCase().includes(query);
      const matchesPriority = priorityFilter === 'all' || card.priority === priorityFilter;
      return matchesQuery && matchesPriority;
    });
  }, [cards, search, priorityFilter]);

  if (board === undefined) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main id="main-content" tabIndex={-1} className={styles.loadingState}>
          {error ? (
            <>
              <p role="alert">{error}</p>
              <Link to="/boards" className={styles.breadcrumbLink}>
                ← Back to boards
              </Link>
            </>
          ) : (
            <p role="status">Loading board…</p>
          )}
        </main>
      </div>
    );
  }

  if (!board) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main id="main-content" tabIndex={-1} className={styles.notFound}>
          <h1>Board not found</h1>
          <p>This board doesn't exist or was deleted.</p>
          <Link to="/boards" className={styles.breadcrumbLink}>
            ← Back to boards
          </Link>
        </main>
      </div>
    );
  }

  function handleAddCard(columnId: ColumnId) {
    setModal({ mode: 'create', columnId });
  }

  function handleEditCard(card: CardData) {
    setModal({ mode: 'edit', card });
  }

  async function handleMoveCard(cardId: string, columnId: ColumnId) {
    const previous = cards;
    setCards((current) => current.map((card) => (card.id === cardId ? { ...card, columnId } : card)));
    try {
      await moveCard(cardId, columnId);
    } catch (err) {
      setCards(previous);
      setError(err instanceof Error ? err.message : 'Failed to move card.');
    }
  }

  async function handleSaveCard(values: CardFormValues) {
    if (!modal || !boardId || !session) return;
    try {
      if (modal.mode === 'create') {
        const newCard = await createCard(session.user.id, boardId, modal.columnId, values);
        setCards((current) => [...current, newCard]);
      } else {
        const updated = await updateCard(modal.card.id, values);
        setCards((current) => current.map((card) => (card.id === updated.id ? updated : card)));
      }
      setModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save card.');
    }
  }

  async function handleDeleteCard() {
    if (!modal || modal.mode !== 'edit') return;
    const cardId = modal.card.id;
    try {
      await deleteCard(cardId);
      setCards((current) => current.filter((card) => card.id !== cardId));
      setModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete card.');
    }
  }

  function startEditingName() {
    setNameDraft(board!.name);
    setIsEditingName(true);
  }

  async function handleSaveName(event: { preventDefault(): void }) {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed || !boardId) {
      setIsEditingName(false);
      return;
    }
    if (trimmed === board!.name) {
      setIsEditingName(false);
      return;
    }
    try {
      const updated = await renameBoard(boardId, trimmed);
      setBoard(updated);
      setIsEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename board.');
    }
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main id="main-content" tabIndex={-1} className={styles.main}>
      <div className={styles.breadcrumb}>
        <div className={styles.breadcrumbTop}>
          <Link to="/boards" className={styles.breadcrumbLink}>
            Boards
          </Link>
          <span className={styles.breadcrumbSeparator} aria-hidden="true">
            /
          </span>
          {isEditingName ? (
            <form onSubmit={handleSaveName}>
              <input
                className={styles.nameInput}
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={(event) => {
                  if (cancelRename.current) {
                    cancelRename.current = false;
                    return;
                  }
                  handleSaveName(event);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    cancelRename.current = true;
                    setIsEditingName(false);
                  }
                }}
                aria-label="Board name"
                autoFocus
              />
            </form>
          ) : (
            <h1 className={styles.boardName}>
              <button
                ref={renameButtonRef}
                type="button"
                className={styles.nameButton}
                onClick={startEditingName}
                aria-label={`${board.name}, rename board`}
              >
                {board.name}
              </button>
            </h1>
          )}
          <span className={styles.columnCount}>{COLUMNS.length} columns</span>
        </div>

        <div className={styles.toolbar}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search cards…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search cards by title or assignee"
          />
          <select
            className={styles.priorityFilter}
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as Priority | 'all')}
            aria-label="Filter by priority"
          >
            {PRIORITY_FILTERS.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All priorities' : option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className={styles.errorBanner} role="alert">
          {error}
          <button type="button" className={styles.dismissError} onClick={() => setError(null)} aria-label="Dismiss error">
            <span aria-hidden="true">✕</span>
          </button>
        </p>
      )}

      <Board
        cards={filteredCards}
        onAddCard={handleAddCard}
        onEditCard={handleEditCard}
        onMoveCard={handleMoveCard}
      />
      </main>

      {modal && (
        <CardModal
          mode={modal.mode}
          initialValues={modal.mode === 'create' ? EMPTY_FORM : modal.card}
          knownAssignees={knownAssignees}
          onSave={handleSaveCard}
          onCancel={() => setModal(null)}
          onDelete={modal.mode === 'edit' ? handleDeleteCard : undefined}
        />
      )}
    </div>
  );
}
