import { useState } from 'react';
import type { CardData, ColumnDef } from '../types';
import { Card } from './Card';
import dropIconUrl from '../assets/drop-icon.svg';
import addIconUrl from '../assets/add-icon.svg';
import styles from './Column.module.css';

interface ColumnProps {
  column: ColumnDef;
  cards: CardData[];
  onAddCard: () => void;
  onEditCard: (card: CardData) => void;
  onDropCard: (cardId: string, columnId: ColumnDef['id']) => void;
}

export function Column({ column, cards, onAddCard, onEditCard, onDropCard }: ColumnProps) {
  const [isOver, setIsOver] = useState(false);

  return (
    <section
      className={styles.column}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (!isOver) setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        const cardId = event.dataTransfer.getData('text/plain');
        if (cardId) onDropCard(cardId, column.id);
      }}
    >
      <div className={styles.header}>
        <h2 className={styles.title}>{column.label}</h2>
        <span className={styles.count}>{cards.length}</span>
      </div>

      {cards.length === 0 ? (
        <div className={`${styles.dropZone} ${isOver ? styles.over : ''}`}>
          <img src={dropIconUrl} alt="" width={24} height={24} loading="lazy" className={styles.dropIcon} />
          <span className={styles.dropText}>Drop a card here or add one below</span>
        </div>
      ) : (
        <div className={`${styles.cardList} ${isOver ? styles.over : ''}`}>
          {cards.map((card) => (
            <Card
              key={card.id}
              card={card}
              onClick={() => onEditCard(card)}
              onMove={(columnId) => onDropCard(card.id, columnId)}
              onDragStart={() => {}}
              onDragEnd={() => {}}
            />
          ))}
        </div>
      )}

      <button type="button" className={styles.addButton} onClick={onAddCard}>
        <img src={addIconUrl} alt="" width={16} height={16} className={styles.addIcon} />
        <span>Add card</span>
      </button>
    </section>
  );
}
