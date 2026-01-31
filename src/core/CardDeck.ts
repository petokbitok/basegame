import { Card, Rank, Suit } from '../types';

export class CardDeck {
  private cards: Card[];
  private dealtCards: Set<string>;

  constructor() {
    this.cards = [];
    this.dealtCards = new Set();
    this.reset();
  }

  /**
   * Reset the deck to contain all 52 cards
   */
  reset(): void {
    this.cards = [];
    this.dealtCards.clear();
    
    // Create all 52 cards
    for (const suit of Object.values(Suit)) {
      for (let rank = 2; rank <= 14; rank++) {
        this.cards.push({ rank: rank as Rank, suit });
      }
    }
  }

  /**
   * Shuffle the deck using Fisher-Yates algorithm with cryptographically secure randomness
   */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      // Generate cryptographically secure random index
      let j: number;
      
      if (typeof window !== 'undefined' && window.crypto) {
        // Browser environment
        const randomArray = new Uint32Array(1);
        window.crypto.getRandomValues(randomArray);
        j = randomArray[0] % (i + 1);
      } else {
        // Node.js environment
        const crypto = require('crypto');
        const randomBytes = crypto.randomBytes(4);
        const randomValue = randomBytes.readUInt32BE(0);
        j = randomValue % (i + 1);
      }
      
      // Swap cards[i] and cards[j]
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  /**
   * Deal a single card from the deck
   * @returns The dealt card
   * @throws Error if deck is empty
   */
  dealCard(): Card {
    if (this.cards.length === 0) {
      throw new Error('Cannot deal card: deck is empty');
    }
    
    const card = this.cards.pop()!;
    const cardKey = this.getCardKey(card);
    
    if (this.dealtCards.has(cardKey)) {
      throw new Error(`Card ${cardKey} has already been dealt`);
    }
    
    this.dealtCards.add(cardKey);
    return card;
  }

  /**
   * Get the number of remaining cards in the deck
   */
  remainingCards(): number {
    return this.cards.length;
  }

  /**
   * Get a unique key for a card
   */
  private getCardKey(card: Card): string {
    return `${card.rank}-${card.suit}`;
  }
}
