import { useState } from 'react';
import { COLUMNS, type CardData, type ColumnId } from '../types';
import styles from './Card.module.css';

interface CardProps {
  card: CardData;
  onClick: () => void;
  onMove: (columnId: ColumnId) => void;
  onDragStart: (cardId: string) => void;
  onDragEnd: () => void;
}

const priorityClass: Record<CardData['priority'], string> = {
  High: styles.priorityHigh,
  Medium: styles.priorityMedium,
  Low: styles.priorityLow,
};

function formatDueDate(dueDate: string) {
  if (!dueDate) return null;
  const date = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(dueDate: string, columnId: ColumnId) {
  if (!dueDate || columnId === 'done') return false;
  const date = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return date < startOfToday;
}

function initials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + last).toUpperCase();
}

export function Card({ card, onClick, onMove, onDragStart, onDragEnd }: CardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dueLabel = formatDueDate(card.dueDate);
  const overdue = isOverdue(card.dueDate, card.columnId);

  return (
    <div
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', card.id);
        event.dataTransfer.effectAllowed = 'move';
        setIsDragging(true);
        onDragStart(card.id);
      }}
      onDragEnd={() => {
        setIsDragging(false);
        onDragEnd();
      }}
    >
      <div
        className={styles.cardBody}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
      >
        <span className={styles.title}>{card.title}</span>
        <span className={styles.meta}>
          <span className={`${styles.priority} ${priorityClass[card.priority]}`}>{card.priority}</span>
          <span className={styles.rightMeta}>
            {dueLabel && <span className={overdue ? styles.overdue : undefined}>{dueLabel}</span>}
            {card.assignee && (
              <span className={styles.avatar} title={card.assignee}>
                {initials(card.assignee)}
              </span>
            )}
          </span>
        </span>
      </div>

      <label className={styles.moveField}>
        <span className={styles.moveLabel}>Move to</span>
        <select
          value={card.columnId}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => onMove(event.target.value as ColumnId)}
        >
          {COLUMNS.map((column) => (
            <option key={column.id} value={column.id}>
              {column.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
