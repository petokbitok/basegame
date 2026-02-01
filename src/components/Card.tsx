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
      <div className="w-12 h-16 md:w-14 md:h-20 rounded border border-dashed border-gray-400 bg-transparent" />
    );
  }

  const isRed = card.suit === 'HEARTS' || card.suit === 'DIAMONDS';
  const color = isRed ? 'text-card-red' : 'text-card-black';

  if (faceDown) {
    return (
      <div
        className={`w-12 h-16 md:w-14 md:h-20 rounded border border-gray-300 bg-gradient-to-br from-blue-600 to-blue-800 shadow-md ${
          animate ? 'animate-deal-card' : ''
        }`}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-white text-2xl opacity-30">🃏</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-12 h-16 md:w-14 md:h-20 rounded border border-gray-300 bg-white shadow-md flex flex-col items-center justify-center ${color} ${
        animate ? 'animate-deal-card' : ''
      }`}
      style={{ animationDelay: `${animationDelay}ms` }}
      data-testid="playing-card"
    >
      <div className="text-lg md:text-xl font-bold">
        {RANK_DISPLAY[card.rank]}
      </div>
      <div className="text-base md:text-lg">
        {SUIT_SYMBOLS[card.suit as keyof typeof SUIT_SYMBOLS]}
      </div>
    </div>
  );
}
