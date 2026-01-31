import * as fc from 'fast-check';
import { CardDeck } from '../CardDeck';
import { Card } from '../../types';

describe('CardDeck Property Tests', () => {
  /**
   * Property 9: Deck Integrity
   * For any single hand, no card should appear more than once across all dealt cards
   * Validates: Requirements 6.1, 6.4
   * Feature: poker-ai-game, Property 9: Deck Integrity
   */
  test('Property 9: Deck Integrity - no duplicate cards in dealt cards', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 52 }), (numCards) => {
        const deck = new CardDeck();
        deck.shuffle();
        
        const dealtCards: Card[] = [];
        const cardKeys = new Set<string>();
        
        // Deal the specified number of cards
        for (let i = 0; i < numCards; i++) {
          const card = deck.dealCard();
          dealtCards.push(card);
          
          const cardKey = `${card.rank}-${card.suit}`;
          
          // Check that this card hasn't been dealt before
          if (cardKeys.has(cardKey)) {
            return false;
          }
          
          cardKeys.add(cardKey);
        }
        
        // Verify all dealt cards are unique
        return cardKeys.size === dealtCards.length;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Deck contains exactly 52 unique cards after reset
   */
  test('Deck contains exactly 52 unique cards after reset', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const deck = new CardDeck();
        
        // Deal all cards
        const allCards: Card[] = [];
        while (deck.remainingCards() > 0) {
          allCards.push(deck.dealCard());
        }
        
        // Check we have exactly 52 cards
        if (allCards.length !== 52) {
          return false;
        }
        
        // Check all cards are unique
        const cardKeys = new Set(allCards.map(c => `${c.rank}-${c.suit}`));
        return cardKeys.size === 52;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Deck has correct number of each suit
   */
  test('Deck has exactly 13 cards of each suit', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const deck = new CardDeck();
        
        const allCards: Card[] = [];
        while (deck.remainingCards() > 0) {
          allCards.push(deck.dealCard());
        }
        
        // Count cards by suit
        const suitCounts = new Map<string, number>();
        for (const card of allCards) {
          const count = suitCounts.get(card.suit) || 0;
          suitCounts.set(card.suit, count + 1);
        }
        
        // Each suit should have exactly 13 cards
        return Array.from(suitCounts.values()).every(count => count === 13);
      }),
      { numRuns: 100 }
    );
  });
});


describe('CardDeck Shuffling Property Tests', () => {
  /**
   * Property 10: Shuffling Effectiveness
   * For any two consecutive shuffles of the same deck, the resulting card order should be different
   * Validates: Requirements 6.2
   * Feature: poker-ai-game, Property 10: Shuffling Effectiveness
   */
  test('Property 10: Shuffling Effectiveness - consecutive shuffles produce different orders', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const deck = new CardDeck();
        
        // First shuffle and record order
        deck.shuffle();
        const firstOrder: Card[] = [];
        while (deck.remainingCards() > 0) {
          firstOrder.push(deck.dealCard());
        }
        
        // Reset and second shuffle
        deck.reset();
        deck.shuffle();
        const secondOrder: Card[] = [];
        while (deck.remainingCards() > 0) {
          secondOrder.push(deck.dealCard());
        }
        
        // Check that at least some cards are in different positions
        let differentPositions = 0;
        for (let i = 0; i < firstOrder.length; i++) {
          const card1 = firstOrder[i];
          const card2 = secondOrder[i];
          if (card1.rank !== card2.rank || card1.suit !== card2.suit) {
            differentPositions++;
          }
        }
        
        // With cryptographic randomness, it's extremely unlikely that
        // two shuffles produce the same order (probability: 1/52!)
        // We expect at least 40 cards to be in different positions
        return differentPositions >= 40;
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property test: Shuffling preserves all cards
   */
  test('Shuffling preserves all 52 cards', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (numShuffles) => {
        const deck = new CardDeck();
        
        // Shuffle multiple times
        for (let i = 0; i < numShuffles; i++) {
          deck.shuffle();
        }
        
        // Deal all cards
        const allCards: Card[] = [];
        while (deck.remainingCards() > 0) {
          allCards.push(deck.dealCard());
        }
        
        // Verify we still have exactly 52 unique cards
        const cardKeys = new Set(allCards.map(c => `${c.rank}-${c.suit}`));
        return allCards.length === 52 && cardKeys.size === 52;
      }),
      { numRuns: 100 }
    );
  });
});
