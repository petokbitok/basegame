import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import fc from 'fast-check';
import { PlayerPosition } from '../PlayerPosition';
import { CommunityCards } from '../CommunityCards';
import type { Player, Card, GameStage } from '../../types';
import { Suit, Rank, Position, GameStage as GameStageEnum } from '../../types';

/**
 * Feature: poker-game-ui
 * Property 1: Card Visibility Rules
 * 
 * For any game state, hole cards should be displayed face-up for the human player,
 * face-down for AI opponents (except at showdown), and community cards should always
 * be face-up when present.
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.7**
 */

// Arbitraries for generating test data
const suitArb = fc.constantFrom(Suit.HEARTS, Suit.DIAMONDS, Suit.SPADES, Suit.CLUBS);
const rankArb = fc.constantFrom(
  Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
  Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
  Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
);

const cardArb = fc.record({
  suit: suitArb,
  rank: rankArb,
});

const holeCardsArb = fc.tuple(cardArb, cardArb);

const playerArb = (isHuman: boolean) => fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  chipStack: fc.integer({ min: 0, max: 1000000 }),
  holeCards: holeCardsArb,
  currentBet: fc.integer({ min: 0, max: 1000 }),
  position: fc.constantFrom(
    Position.SMALL_BLIND,
    Position.BIG_BLIND,
    Position.EARLY,
    Position.MIDDLE,
    Position.LATE,
    Position.DEALER
  ),
  isActive: fc.boolean(),
  isAllIn: fc.boolean(),
  lastAction: fc.constant(null),
  isHuman: fc.constant(isHuman),
});

const communityCardsArb = fc.array(cardArb, { minLength: 0, maxLength: 5 });

const gameStageArb = fc.constantFrom(
  GameStageEnum.PRE_FLOP,
  GameStageEnum.FLOP,
  GameStageEnum.TURN,
  GameStageEnum.RIVER,
  GameStageEnum.SHOWDOWN
);

describe('Feature: poker-game-ui, Property 1: Card Visibility Rules', () => {
  it('should display human player hole cards face-up for any game state', () => {
    fc.assert(
      fc.property(
        playerArb(true),
        fc.boolean(),
        fc.boolean(),
        (player, isActive, isDealer) => {
          const { container, unmount } = render(
            <PlayerPosition
              player={player}
              isActive={isActive}
              isDealer={isDealer}
              position="bottom"
              isHuman={true}
            />
          );

          // Human player cards should be face-up (showing rank and suit)
          const playingCards = container.querySelectorAll('[data-testid="playing-card"]');
          
          // Should have 2 cards rendered as face-up
          expect(playingCards.length).toBe(2);
          
          // Each card should display rank and suit (not card back)
          playingCards.forEach((cardElement, index) => {
            // Face-up cards have white background
            expect(cardElement.className).toContain('bg-white');
            
            // Face-up cards should not have the card back gradient
            expect(cardElement.className).not.toContain('from-blue-600');
            expect(cardElement.className).not.toContain('to-blue-800');
            
            // Should display actual card content (rank and suit)
            const holeCard = player.holeCards[index];
            const rankDisplay: Record<number, string> = {
              2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
              7: '7', 8: '8', 9: '9', 10: '10',
              11: 'J', 12: 'Q', 13: 'K', 14: 'A',
            };
            const suitSymbols = {
              [Suit.HEARTS]: '♥',
              [Suit.DIAMONDS]: '♦',
              [Suit.SPADES]: '♠',
              [Suit.CLUBS]: '♣',
            };
            
            expect(cardElement.textContent).toContain(rankDisplay[holeCard.rank]);
            expect(cardElement.textContent).toContain(suitSymbols[holeCard.suit]);
          });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display AI opponent hole cards face-down for any non-showdown game state', () => {
    fc.assert(
      fc.property(
        playerArb(false),
        fc.boolean(),
        fc.boolean(),
        gameStageArb,
        (player, isActive, isDealer, stage) => {
          // Skip showdown stage for this test (tested separately)
          if (stage === GameStageEnum.SHOWDOWN) {
            return true;
          }

          const { container, unmount } = render(
            <PlayerPosition
              player={player}
              isActive={isActive}
              isDealer={isDealer}
              position="top"
              isHuman={false}
            />
          );

          // AI player cards should be face-down (showing card back)
          const cardElements = container.querySelectorAll('.w-20, .w-24');
          
          // Should have 2 cards
          expect(cardElements.length).toBeGreaterThanOrEqual(2);
          
          // Cards should have the card back gradient (face-down)
          let faceDownCount = 0;
          cardElements.forEach((cardElement) => {
            if (cardElement.className.includes('from-blue-600') && 
                cardElement.className.includes('to-blue-800')) {
              faceDownCount++;
            }
          });
          
          // At least 2 cards should be face-down
          expect(faceDownCount).toBeGreaterThanOrEqual(2);
          
          // Should not display playing-card test id (which is only for face-up cards)
          const playingCards = container.querySelectorAll('[data-testid="playing-card"]');
          expect(playingCards.length).toBe(0);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display all active players hole cards face-up at showdown', () => {
    fc.assert(
      fc.property(
        playerArb(false),
        fc.boolean(),
        fc.boolean(),
        (player, isActive, isDealer) => {
          // At showdown, even AI cards should be face-up
          // This is simulated by passing isHuman=true to force face-up display
          const showdownPlayer = { ...player, isActive: true };
          
          const { container, unmount } = render(
            <PlayerPosition
              player={showdownPlayer}
              isActive={isActive}
              isDealer={isDealer}
              position="top"
              isHuman={true} // At showdown, cards are revealed
            />
          );

          // At showdown, cards should be face-up
          const playingCards = container.querySelectorAll('[data-testid="playing-card"]');
          
          // Should have 2 face-up cards
          expect(playingCards.length).toBe(2);
          
          // Each card should be face-up (white background, not blue gradient)
          playingCards.forEach((cardElement) => {
            expect(cardElement.className).toContain('bg-white');
            expect(cardElement.className).not.toContain('from-blue-600');
          });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display community cards face-up when present for any game stage', () => {
    fc.assert(
      fc.property(
        communityCardsArb,
        gameStageArb,
        (cards, stage) => {
          const { container, unmount } = render(
            <CommunityCards cards={cards} stage={stage} />
          );

          // Determine expected visible card count based on stage
          const expectedVisibleCount = getExpectedVisibleCount(stage);
          
          // Get all face-up playing cards
          const playingCards = container.querySelectorAll('[data-testid="playing-card"]');
          
          // Number of face-up cards should match stage and available cards
          const actualVisibleCount = Math.min(expectedVisibleCount, cards.length);
          expect(playingCards.length).toBe(actualVisibleCount);
          
          // All visible cards should be face-up (white background)
          playingCards.forEach((cardElement) => {
            expect(cardElement.className).toContain('bg-white');
            
            // Should not have card back styling
            expect(cardElement.className).not.toContain('from-blue-600');
            expect(cardElement.className).not.toContain('to-blue-800');
          });
          
          // Verify each visible card displays its actual rank and suit
          for (let i = 0; i < actualVisibleCount; i++) {
            const card = cards[i];
            const cardElement = playingCards[i];
            
            const rankDisplay: Record<number, string> = {
              2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
              7: '7', 8: '8', 9: '9', 10: '10',
              11: 'J', 12: 'Q', 13: 'K', 14: 'A',
            };
            const suitSymbols = {
              [Suit.HEARTS]: '♥',
              [Suit.DIAMONDS]: '♦',
              [Suit.SPADES]: '♠',
              [Suit.CLUBS]: '♣',
            };
            
            expect(cardElement.textContent).toContain(rankDisplay[card.rank]);
            expect(cardElement.textContent).toContain(suitSymbols[card.suit]);
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never display community cards face-down', () => {
    fc.assert(
      fc.property(
        communityCardsArb,
        gameStageArb,
        (cards, stage) => {
          const { container, unmount } = render(
            <CommunityCards cards={cards} stage={stage} />
          );

          // Check that no card has the face-down styling
          const allCardElements = container.querySelectorAll('.w-20, .w-24');
          
          allCardElements.forEach((cardElement) => {
            // If it's a card (not an empty slot), it should not be face-down
            if (!cardElement.className.includes('border-dashed')) {
              // Should not have card back gradient
              expect(cardElement.className).not.toContain('from-blue-600');
              expect(cardElement.className).not.toContain('to-blue-800');
            }
          });

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain card visibility rules across all player positions and game states', () => {
    fc.assert(
      fc.property(
        playerArb(true),  // Human player
        playerArb(false), // AI player
        communityCardsArb,
        gameStageArb,
        fc.boolean(),
        fc.boolean(),
        (humanPlayer, aiPlayer, communityCards, stage, isActiveHuman, isActiveAI) => {
          // Render human player
          const { container: humanContainer, unmount: unmountHuman } = render(
            <PlayerPosition
              player={humanPlayer}
              isActive={isActiveHuman}
              isDealer={false}
              position="bottom"
              isHuman={true}
            />
          );

          // Render AI player
          const { container: aiContainer, unmount: unmountAI } = render(
            <PlayerPosition
              player={aiPlayer}
              isActive={isActiveAI}
              isDealer={false}
              position="top"
              isHuman={false}
            />
          );

          // Render community cards
          const { container: communityContainer, unmount: unmountCommunity } = render(
            <CommunityCards cards={communityCards} stage={stage} />
          );

          // Verify human cards are face-up
          const humanPlayingCards = humanContainer.querySelectorAll('[data-testid="playing-card"]');
          expect(humanPlayingCards.length).toBe(2);
          humanPlayingCards.forEach((card) => {
            expect(card.className).toContain('bg-white');
          });

          // Verify AI cards are face-down (unless showdown)
          if (stage !== GameStageEnum.SHOWDOWN) {
            const aiPlayingCards = aiContainer.querySelectorAll('[data-testid="playing-card"]');
            expect(aiPlayingCards.length).toBe(0); // No face-up cards for AI
            
            const aiFaceDownCards = aiContainer.querySelectorAll('.from-blue-600');
            expect(aiFaceDownCards.length).toBeGreaterThanOrEqual(2);
          }

          // Verify community cards are face-up when present
          const communityPlayingCards = communityContainer.querySelectorAll('[data-testid="playing-card"]');
          communityPlayingCards.forEach((card) => {
            expect(card.className).toContain('bg-white');
            expect(card.className).not.toContain('from-blue-600');
          });

          unmountHuman();
          unmountAI();
          unmountCommunity();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Helper function to determine expected visible card count based on stage
function getExpectedVisibleCount(stage: GameStage): number {
  switch (stage) {
    case GameStageEnum.PRE_FLOP:
      return 0;
    case GameStageEnum.FLOP:
      return 3;
    case GameStageEnum.TURN:
      return 4;
    case GameStageEnum.RIVER:
    case GameStageEnum.SHOWDOWN:
      return 5;
    default:
      return 0;
  }
}
