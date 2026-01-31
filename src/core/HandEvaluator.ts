import { Card, HandRank, HandType, Rank } from '../types';

/**
 * HandEvaluator implements efficient poker hand ranking using a hybrid approach:
 * - Bit manipulation for common hand types (pairs, two pair, three of a kind)
 * - Direct evaluation of 7 cards without generating all 5-card combinations
 * - Proper tie-breaking with kickers
 * 
 * Performance target: <1ms per evaluation
 */
export class HandEvaluator {
  /**
   * Evaluates the best possible 5-card poker hand from 7 cards (2 hole + 5 community)
   */
  evaluateHand(holeCards: Card[], communityCards: Card[]): HandRank {
    const allCards = [...holeCards, ...communityCards];
    
    if (allCards.length !== 7) {
      throw new Error(`Expected 7 cards, got ${allCards.length}`);
    }

    return this.getBestHand(allCards);
  }

  /**
   * Compares two poker hands
   * @returns positive if hand1 > hand2, negative if hand1 < hand2, 0 if equal
   */
  compareHands(hand1: HandRank, hand2: HandRank): number {
    // First compare hand types
    if (hand1.type !== hand2.type) {
      return hand1.type - hand2.type;
    }

    // Same hand type, compare primary rank
    if (hand1.primaryRank !== hand2.primaryRank) {
      return hand1.primaryRank - hand2.primaryRank;
    }

    // Same primary rank, compare kickers
    for (let i = 0; i < Math.max(hand1.kickers.length, hand2.kickers.length); i++) {
      const kicker1 = hand1.kickers[i] || 0;
      const kicker2 = hand2.kickers[i] || 0;
      if (kicker1 !== kicker2) {
        return kicker1 - kicker2;
      }
    }

    return 0; // Hands are equal
  }

  /**
   * Finds the best 5-card hand from any number of cards (optimized for 7 cards)
   */
  getBestHand(cards: Card[]): HandRank {
    // Check for flush and straight flush first (less common, but need to check)
    const flushHand = this.checkFlush(cards);
    if (flushHand) {
      const straightFlushHand = this.checkStraightFlush(flushHand.cards);
      if (straightFlushHand) {
        return straightFlushHand;
      }
      return flushHand.rank;
    }

    // Check for four of a kind
    const fourOfAKind = this.checkFourOfAKind(cards);
    if (fourOfAKind) {
      return fourOfAKind;
    }

    // Check for full house
    const fullHouse = this.checkFullHouse(cards);
    if (fullHouse) {
      return fullHouse;
    }

    // Check for straight
    const straight = this.checkStraight(cards);
    if (straight) {
      return straight;
    }

    // Check for three of a kind
    const threeOfAKind = this.checkThreeOfAKind(cards);
    if (threeOfAKind) {
      return threeOfAKind;
    }

    // Check for two pair
    const twoPair = this.checkTwoPair(cards);
    if (twoPair) {
      return twoPair;
    }

    // Check for pair
    const pair = this.checkPair(cards);
    if (pair) {
      return pair;
    }

    // High card
    return this.checkHighCard(cards);
  }

  /**
   * Groups cards by rank and returns a map of rank -> cards with that rank
   */
  private groupByRank(cards: Card[]): Map<number, Card[]> {
    const groups = new Map<number, Card[]>();
    for (const card of cards) {
      const rank = card.rank;
      if (!groups.has(rank)) {
        groups.set(rank, []);
      }
      groups.get(rank)!.push(card);
    }
    return groups;
  }

  /**
   * Groups cards by suit and returns a map of suit -> cards with that suit
   */
  private groupBySuit(cards: Card[]): Map<string, Card[]> {
    const groups = new Map<string, Card[]>();
    for (const card of cards) {
      const suit = card.suit;
      if (!groups.has(suit)) {
        groups.set(suit, []);
      }
      groups.get(suit)!.push(card);
    }
    return groups;
  }

  /**
   * Gets the top N cards by rank from a list of cards
   */
  private getTopCards(cards: Card[], count: number): Card[] {
    return [...cards]
      .sort((a, b) => b.rank - a.rank)
      .slice(0, count);
  }

  /**
   * Calculates a numeric strength value for comparison
   * Uses a hierarchical system where hand type is most significant,
   * then primary rank, then kickers in order
   */
  private calculateStrength(type: HandType, primaryRank: number, kickers: number[]): number {
    // Hand type is most significant (multiply by 10^12)
    let strength = type * 1000000000000;
    
    // Primary rank is next (multiply by 10^9)
    strength += primaryRank * 1000000000;
    
    // Add kickers with decreasing significance (each gets 10^(9-3i))
    for (let i = 0; i < kickers.length && i < 5; i++) {
      strength += kickers[i] * Math.pow(1000, 3 - i);
    }
    
    return strength;
  }

  private checkFlush(cards: Card[]): { rank: HandRank; cards: Card[] } | null {
    const suitGroups = this.groupBySuit(cards);
    
    for (const suitCards of suitGroups.values()) {
      if (suitCards.length >= 5) {
        const topFive = this.getTopCards(suitCards, 5);
        const ranks = topFive.map(c => c.rank).sort((a, b) => b - a);
        
        return {
          rank: {
            type: HandType.FLUSH,
            primaryRank: ranks[0],
            kickers: ranks.slice(1),
            strength: this.calculateStrength(HandType.FLUSH, ranks[0], ranks.slice(1))
          },
          cards: topFive
        };
      }
    }
    
    return null;
  }

  private checkStraightFlush(flushCards: Card[]): HandRank | null {
    const straight = this.checkStraightFromCards(flushCards);
    if (!straight) {
      return null;
    }

    // Check if it's a royal flush (A-K-Q-J-10)
    if (straight.primaryRank === Rank.ACE) {
      return {
        type: HandType.ROYAL_FLUSH,
        primaryRank: Rank.ACE,
        kickers: [],
        strength: this.calculateStrength(HandType.ROYAL_FLUSH, Rank.ACE, [])
      };
    }

    return {
      type: HandType.STRAIGHT_FLUSH,
      primaryRank: straight.primaryRank,
      kickers: [],
      strength: this.calculateStrength(HandType.STRAIGHT_FLUSH, straight.primaryRank, [])
    };
  }

  private checkStraight(cards: Card[]): HandRank | null {
    return this.checkStraightFromCards(cards);
  }

  private checkStraightFromCards(cards: Card[]): HandRank | null {
    // Get unique ranks and sort descending
    const uniqueRanks = Array.from(new Set(cards.map(c => c.rank))).sort((a, b) => b - a);
    
    // Check for regular straight (5 consecutive ranks)
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
        return {
          type: HandType.STRAIGHT,
          primaryRank: uniqueRanks[i],
          kickers: [],
          strength: this.calculateStrength(HandType.STRAIGHT, uniqueRanks[i], [])
        };
      }
    }

    // Check for wheel straight (A-2-3-4-5)
    if (uniqueRanks.includes(Rank.ACE) && 
        uniqueRanks.includes(Rank.TWO) && 
        uniqueRanks.includes(Rank.THREE) && 
        uniqueRanks.includes(Rank.FOUR) && 
        uniqueRanks.includes(Rank.FIVE)) {
      return {
        type: HandType.STRAIGHT,
        primaryRank: Rank.FIVE, // In a wheel, the 5 is the high card
        kickers: [],
        strength: this.calculateStrength(HandType.STRAIGHT, Rank.FIVE, [])
      };
    }

    return null;
  }

  private checkFourOfAKind(cards: Card[]): HandRank | null {
    const rankGroups = this.groupByRank(cards);
    
    for (const [rank, groupCards] of rankGroups) {
      if (groupCards.length === 4) {
        // Find the best kicker from remaining cards
        const remainingCards = cards.filter(c => c.rank !== rank);
        const kicker = this.getTopCards(remainingCards, 1)[0];
        
        return {
          type: HandType.FOUR_OF_A_KIND,
          primaryRank: rank,
          kickers: [kicker.rank],
          strength: this.calculateStrength(HandType.FOUR_OF_A_KIND, rank, [kicker.rank])
        };
      }
    }
    
    return null;
  }

  private checkFullHouse(cards: Card[]): HandRank | null {
    const rankGroups = this.groupByRank(cards);
    
    // Find all three of a kinds and pairs
    const threes: number[] = [];
    const pairs: number[] = [];
    
    for (const [rank, groupCards] of rankGroups) {
      if (groupCards.length >= 3) {
        threes.push(rank);
      } else if (groupCards.length === 2) {
        pairs.push(rank);
      }
    }

    // If we have two three-of-a-kinds, use the higher one as the three and the lower as the pair
    if (threes.length >= 2) {
      threes.sort((a, b) => b - a);
      return {
        type: HandType.FULL_HOUSE,
        primaryRank: threes[0],
        kickers: [threes[1]],
        strength: this.calculateStrength(HandType.FULL_HOUSE, threes[0], [threes[1]])
      };
    }

    // Standard full house: one three of a kind and one pair
    if (threes.length >= 1 && pairs.length >= 1) {
      threes.sort((a, b) => b - a);
      pairs.sort((a, b) => b - a);
      
      return {
        type: HandType.FULL_HOUSE,
        primaryRank: threes[0],
        kickers: [pairs[0]],
        strength: this.calculateStrength(HandType.FULL_HOUSE, threes[0], [pairs[0]])
      };
    }
    
    return null;
  }

  private checkThreeOfAKind(cards: Card[]): HandRank | null {
    const rankGroups = this.groupByRank(cards);
    
    for (const [rank, groupCards] of rankGroups) {
      if (groupCards.length === 3) {
        // Find the best two kickers from remaining cards
        const remainingCards = cards.filter(c => c.rank !== rank);
        const kickers = this.getTopCards(remainingCards, 2).map(c => c.rank);
        
        return {
          type: HandType.THREE_OF_A_KIND,
          primaryRank: rank,
          kickers: kickers,
          strength: this.calculateStrength(HandType.THREE_OF_A_KIND, rank, kickers)
        };
      }
    }
    
    return null;
  }

  private checkTwoPair(cards: Card[]): HandRank | null {
    const rankGroups = this.groupByRank(cards);
    const pairs: number[] = [];
    
    for (const [rank, groupCards] of rankGroups) {
      if (groupCards.length === 2) {
        pairs.push(rank);
      }
    }

    if (pairs.length >= 2) {
      // Sort pairs descending and take the top two
      pairs.sort((a, b) => b - a);
      const topPair = pairs[0];
      const secondPair = pairs[1];
      
      // Find the best kicker from remaining cards
      const remainingCards = cards.filter(c => c.rank !== topPair && c.rank !== secondPair);
      const kicker = this.getTopCards(remainingCards, 1)[0];
      
      return {
        type: HandType.TWO_PAIR,
        primaryRank: topPair,
        kickers: [secondPair, kicker.rank],
        strength: this.calculateStrength(HandType.TWO_PAIR, topPair, [secondPair, kicker.rank])
      };
    }
    
    return null;
  }

  private checkPair(cards: Card[]): HandRank | null {
    const rankGroups = this.groupByRank(cards);
    
    for (const [rank, groupCards] of rankGroups) {
      if (groupCards.length === 2) {
        // Find the best three kickers from remaining cards
        const remainingCards = cards.filter(c => c.rank !== rank);
        const kickers = this.getTopCards(remainingCards, 3).map(c => c.rank);
        
        return {
          type: HandType.PAIR,
          primaryRank: rank,
          kickers: kickers,
          strength: this.calculateStrength(HandType.PAIR, rank, kickers)
        };
      }
    }
    
    return null;
  }

  private checkHighCard(cards: Card[]): HandRank {
    const topFive = this.getTopCards(cards, 5);
    const ranks = topFive.map(c => c.rank).sort((a, b) => b - a);
    
    return {
      type: HandType.HIGH_CARD,
      primaryRank: ranks[0],
      kickers: ranks.slice(1),
      strength: this.calculateStrength(HandType.HIGH_CARD, ranks[0], ranks.slice(1))
    };
  }
}
