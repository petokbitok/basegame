import type { Card as CardType } from '../types';

interface CardProps {
  card: CardType | null;
  faceDown?: boolean;
  animate?: boolean;
  animationDelay?: number;
}

const SUIT_SYMBOLS = {
  SPADES: '♠',
  HEARTS: '♥',
  DIAMONDS: '♦',
  CLUBS: '♣',
};

const RANK_DISPLAY: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
  7: '7', 8: '8', 9: '9', 10: '10',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

export function Card({ card, faceDown = false, animate = false, animationDelay = 0 }: CardProps) {
  if (!card) {
    return (
      <div className="w-20 h-28 md:w-24 md:h-32 rounded-lg border-2 border-dashed border-gray-400 bg-transparent" />
    );
  }

  const isRed = card.suit === 'HEARTS' || card.suit === 'DIAMONDS';
  const color = isRed ? 'text-card-red' : 'text-card-black';

  if (faceDown) {
    return (
      <div
        className={`w-20 h-28 md:w-24 md:h-32 rounded-lg border-2 border-gray-300 bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg ${
          animate ? 'animate-deal-card' : ''
        }`}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-4xl opacity-30">🃏</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-20 h-28 md:w-24 md:h-32 rounded-lg border-2 border-gray-300 bg-white shadow-lg flex flex-col items-center justify-center ${color} ${
        animate ? 'animate-deal-card' : ''
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
      data-testid="playing-card"
    >
      <div className="text-3xl md:text-4xl font-bold">
        {RANK_DISPLAY[card.rank]}
      </div>
      <div className="text-2xl md:text-3xl">
        {SUIT_SYMBOLS[card.suit as keyof typeof SUIT_SYMBOLS]}
      </div>
    </div>
  );
}
