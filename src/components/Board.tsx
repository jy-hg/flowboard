import { COLUMNS, type CardData, type ColumnId } from '../types';
import { Column } from './Column';
import styles from './Board.module.css';

interface BoardProps {
  cards: CardData[];
  onAddCard: (columnId: ColumnId) => void;
  onEditCard: (card: CardData) => void;
  onMoveCard: (cardId: string, columnId: ColumnId) => void;
}

export function Board({ cards, onAddCard, onEditCard, onMoveCard }: BoardProps) {
  return (
    <div className={styles.board}>
      {COLUMNS.map((column) => (
        <Column
          key={column.id}
          column={column}
          cards={cards.filter((card) => card.columnId === column.id)}
          onAddCard={() => onAddCard(column.id)}
          onEditCard={onEditCard}
          onDropCard={onMoveCard}
        />
      ))}
    </div>
  );
}
