import { Card } from './Card';
import type { Card as CardType, GameStage } from '../types';

interface CommunityCardsProps {
  cards: CardType[];
  stage: GameStage;
}

export function CommunityCards({ cards, stage }: CommunityCardsProps) {
  // Determine how many cards should be visible based on stage
  const visibleCardCount = getVisibleCardCount(stage);
  
  // Create array of 5 slots
  const cardSlots = Array.from({ length: 5 }, (_, index) => {
    if (index < visibleCardCount && cards[index]) {
      return cards[index];
    }
    return null;
  });

  return (
    <div className="flex gap-1 justify-center items-center" data-testid="community-cards">
      {cardSlots.map((card, index) => (
        <Card
          key={index}
          card={card}
          animate={card !== null}
          animationDelay={index * 100}
        />
      ))}
    </div>
  );
}

function getVisibleCardCount(stage: GameStage): number {
  switch (stage) {
    case 'PRE_FLOP':
      return 0;
    case 'FLOP':
      return 3;
    case 'TURN':
      return 4;
    case 'RIVER':
    case 'SHOWDOWN':
      return 5;
    default:
      return 0;
  }
}
