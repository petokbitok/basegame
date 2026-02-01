import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { render } from '@testing-library/react';
import { Card } from '../Card';
import { Suit, Rank } from '../../types';

describe('Feature: poker-game-ui, Property 2: Card Suit Rendering', () => {
  /**
   * **Validates: Requirements 2.4, 2.5**
   * 
   * For any card, the suit symbol (♠ ♥ ♦ ♣) should be rendered with the correct color
   * (red for hearts/diamonds, black for spades/clubs)
   */
  it('should render hearts and diamonds with red color', () => {
    // Arbitrary for red suits (hearts and diamonds)
    const redSuitArbitrary = fc.constantFrom(Suit.HEARTS, Suit.DIAMONDS);
    
    // Arbitrary for all ranks
    const rankArbitrary = fc.constantFrom(
      Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
      Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
      Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
    );

    fc.assert(
      fc.property(
        redSuitArbitrary,
        rankArbitrary,
        (suit, rank) => {
          const card = { suit, rank };
          const { container } = render(<Card card={card} faceDown={false} />);
          
          // Find the card element
          const cardElement = container.querySelector('[data-testid="playing-card"]');
          expect(cardElement).toBeTruthy();
          
          // Should have red color class
          expect(cardElement?.className).toContain('text-card-red');
          
          // Should not have black color class
          expect(cardElement?.className).not.toContain('text-card-black');
          
          // Should display the correct suit symbol
          const suitSymbol = suit === Suit.HEARTS ? '♥' : '♦';
          expect(cardElement?.textContent).toContain(suitSymbol);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render spades and clubs with black color', () => {
    // Arbitrary for black suits (spades and clubs)
    const blackSuitArbitrary = fc.constantFrom(Suit.SPADES, Suit.CLUBS);
    
    // Arbitrary for all ranks
    const rankArbitrary = fc.constantFrom(
      Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
      Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
      Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
    );

    fc.assert(
      fc.property(
        blackSuitArbitrary,
        rankArbitrary,
        (suit, rank) => {
          const card = { suit, rank };
          const { container } = render(<Card card={card} faceDown={false} />);
          
          // Find the card element
          const cardElement = container.querySelector('[data-testid="playing-card"]');
          expect(cardElement).toBeTruthy();
          
          // Should have black color class
          expect(cardElement?.className).toContain('text-card-black');
          
          // Should not have red color class
          expect(cardElement?.className).not.toContain('text-card-red');
          
          // Should display the correct suit symbol
          const suitSymbol = suit === Suit.SPADES ? '♠' : '♣';
          expect(cardElement?.textContent).toContain(suitSymbol);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render all suit symbols correctly for any card', () => {
    // Arbitrary for all suits
    const suitArbitrary = fc.constantFrom(
      Suit.HEARTS, Suit.DIAMONDS, Suit.SPADES, Suit.CLUBS
    );
    
    // Arbitrary for all ranks
    const rankArbitrary = fc.constantFrom(
      Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
      Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
      Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
    );

    // Map suits to their symbols
    const suitSymbols = {
      [Suit.HEARTS]: '♥',
      [Suit.DIAMONDS]: '♦',
      [Suit.SPADES]: '♠',
      [Suit.CLUBS]: '♣',
    };

    fc.assert(
      fc.property(
        suitArbitrary,
        rankArbitrary,
        (suit, rank) => {
          const card = { suit, rank };
          const { container } = render(<Card card={card} faceDown={false} />);
          
          // Find the card element
          const cardElement = container.querySelector('[data-testid="playing-card"]');
          expect(cardElement).toBeTruthy();
          
          // Should display the correct suit symbol
          const expectedSymbol = suitSymbols[suit];
          expect(cardElement?.textContent).toContain(expectedSymbol);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should apply correct color based on suit for all cards', () => {
    // Arbitrary for all suits
    const suitArbitrary = fc.constantFrom(
      Suit.HEARTS, Suit.DIAMONDS, Suit.SPADES, Suit.CLUBS
    );
    
    // Arbitrary for all ranks
    const rankArbitrary = fc.constantFrom(
      Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
      Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
      Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
    );

    fc.assert(
      fc.property(
        suitArbitrary,
        rankArbitrary,
        (suit, rank) => {
          const card = { suit, rank };
          const { container } = render(<Card card={card} faceDown={false} />);
          
          // Find the card element
          const cardElement = container.querySelector('[data-testid="playing-card"]');
          expect(cardElement).toBeTruthy();
          
          // Determine expected color based on suit
          const isRed = suit === Suit.HEARTS || suit === Suit.DIAMONDS;
          const expectedColorClass = isRed ? 'text-card-red' : 'text-card-black';
          const unexpectedColorClass = isRed ? 'text-card-black' : 'text-card-red';
          
          // Should have the correct color class
          expect(cardElement?.className).toContain(expectedColorClass);
          
          // Should not have the incorrect color class
          expect(cardElement?.className).not.toContain(unexpectedColorClass);
        }
      ),
      { numRuns: 100 }
    );
  });
});
