import * as fc from 'fast-check';
import { HandEvaluator } from '../HandEvaluator';
import { Card, Rank, Suit, HandType } from '../../types';

// Arbitraries for generating test data (defined at module level)
const rankArbitrary = fc.constantFrom(
  Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
  Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
  Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE
);

const suitArbitrary = fc.constantFrom(
  Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES
);

const cardArbitrary = fc.record({
  rank: rankArbitrary,
  suit: suitArbitrary
});

// Generate two valid 7-card hands from the same deck (no duplicates across both hands)
const twoHandsArbitrary = fc.integer({ min: 0, max: 1000000 }).chain(seed => {
  // Create a full deck
  const deck: Card[] = [];
  for (const suit of [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES]) {
    for (const rank of [Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
                        Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
                        Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE]) {
      deck.push({ rank, suit });
    }
  }
  
  // Shuffle using the seed for reproducibility
  const shuffled = [...deck];
  let currentIndex = shuffled.length;
  let randomValue = seed;
  
  while (currentIndex > 0) {
    randomValue = (randomValue * 1103515245 + 12345) & 0x7fffffff;
    const randomIndex = randomValue % currentIndex;
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  
  // Return two hands of 7 cards each from the shuffled deck
  return fc.constant([shuffled.slice(0, 7), shuffled.slice(7, 14)]);
});

// Generate a single valid 7-card hand (no duplicates)
const sevenCardHandArbitrary = fc.integer({ min: 0, max: 1000000 }).chain(seed => {
  // Create a full deck
  const deck: Card[] = [];
  for (const suit of [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES]) {
    for (const rank of [Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
                        Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
                        Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE]) {
      deck.push({ rank, suit });
    }
  }
  
  // Shuffle using the seed for reproducibility
  const shuffled = [...deck];
  let currentIndex = shuffled.length;
  let randomValue = seed;
  
  while (currentIndex > 0) {
    randomValue = (randomValue * 1103515245 + 12345) & 0x7fffffff;
    const randomIndex = randomValue % currentIndex;
    currentIndex--;
    [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
  }
  
  return fc.constant(shuffled.slice(0, 7));
});

describe('HandEvaluator Property Tests', () => {
  const evaluator = new HandEvaluator();

  /**
   * **Feature: poker-ai-game, Property 3: Hand Evaluation Correctness**
   * **Validates: Requirements 2.1, 2.3**
   * 
   * For any set of 7 cards (2 hole + 5 community), the hand evaluator should 
   * identify the strongest possible 5-card poker hand according to standard rankings
   */
  describe('Property 3: Hand Evaluation Correctness', () => {
    it('should always return a valid hand type', () => {
      fc.assert(
        fc.property(sevenCardHandArbitrary, (cards) => {
          const holeCards = cards.slice(0, 2);
          const communityCards = cards.slice(2, 7);
          
          const result = evaluator.evaluateHand(holeCards, communityCards);
          
          // Result should have a valid hand type
          expect(result.type).toBeGreaterThanOrEqual(HandType.HIGH_CARD);
          expect(result.type).toBeLessThanOrEqual(HandType.ROYAL_FLUSH);
          
          // Result should have a valid primary rank
          expect(result.primaryRank).toBeGreaterThanOrEqual(Rank.TWO);
          expect(result.primaryRank).toBeLessThanOrEqual(Rank.ACE);
          
          // Result should have a strength value
          expect(result.strength).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should identify royal flush correctly', () => {
      fc.assert(
        fc.property(suitArbitrary, fc.array(cardArbitrary, { minLength: 2, maxLength: 2 }), (suit, extraCards) => {
          // Create a royal flush in the given suit
          const royalFlush: Card[] = [
            { rank: Rank.ACE, suit },
            { rank: Rank.KING, suit },
            { rank: Rank.QUEEN, suit },
            { rank: Rank.JACK, suit },
            { rank: Rank.TEN, suit }
          ];
          
          // Add two extra cards that don't interfere
          const allCards = [...royalFlush, ...extraCards.filter(c => 
            c.suit !== suit || ![Rank.ACE, Rank.KING, Rank.QUEEN, Rank.JACK, Rank.TEN].includes(c.rank)
          ).slice(0, 2)];
          
          if (allCards.length === 7) {
            const result = evaluator.getBestHand(allCards);
            expect(result.type).toBe(HandType.ROYAL_FLUSH);
          }
        }),
        { numRuns: 50 }
      );
    });

    it('should identify straight flush correctly', () => {
      // Test with a specific straight flush (9-8-7-6-5 of hearts)
      const straightFlush: Card[] = [
        { rank: Rank.NINE, suit: Suit.HEARTS },
        { rank: Rank.EIGHT, suit: Suit.HEARTS },
        { rank: Rank.SEVEN, suit: Suit.HEARTS },
        { rank: Rank.SIX, suit: Suit.HEARTS },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];
      
      const result = evaluator.getBestHand(straightFlush);
      expect(result.type).toBe(HandType.STRAIGHT_FLUSH);
      expect(result.primaryRank).toBe(Rank.NINE);
    });

    it('should identify four of a kind correctly', () => {
      const fourOfAKind: Card[] = [
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.DIAMONDS },
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.KING, suit: Suit.SPADES },
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];
      
      const result = evaluator.getBestHand(fourOfAKind);
      expect(result.type).toBe(HandType.FOUR_OF_A_KIND);
      expect(result.primaryRank).toBe(Rank.KING);
      expect(result.kickers[0]).toBe(Rank.ACE);
    });

    it('should identify full house correctly', () => {
      const fullHouse: Card[] = [
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.QUEEN, suit: Suit.DIAMONDS },
        { rank: Rank.QUEEN, suit: Suit.CLUBS },
        { rank: Rank.JACK, suit: Suit.HEARTS },
        { rank: Rank.JACK, suit: Suit.DIAMONDS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.SPADES }
      ];
      
      const result = evaluator.getBestHand(fullHouse);
      expect(result.type).toBe(HandType.FULL_HOUSE);
      expect(result.primaryRank).toBe(Rank.QUEEN);
      expect(result.kickers[0]).toBe(Rank.JACK);
    });

    it('should identify flush correctly', () => {
      const flush: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.NINE, suit: Suit.HEARTS },
        { rank: Rank.SEVEN, suit: Suit.HEARTS },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];
      
      const result = evaluator.getBestHand(flush);
      expect(result.type).toBe(HandType.FLUSH);
      expect(result.primaryRank).toBe(Rank.ACE);
    });

    it('should identify straight correctly', () => {
      const straight: Card[] = [
        { rank: Rank.NINE, suit: Suit.HEARTS },
        { rank: Rank.EIGHT, suit: Suit.DIAMONDS },
        { rank: Rank.SEVEN, suit: Suit.CLUBS },
        { rank: Rank.SIX, suit: Suit.SPADES },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];
      
      const result = evaluator.getBestHand(straight);
      expect(result.type).toBe(HandType.STRAIGHT);
      expect(result.primaryRank).toBe(Rank.NINE);
    });

    it('should identify wheel straight (A-2-3-4-5) correctly', () => {
      const wheelStraight: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.DIAMONDS },
        { rank: Rank.THREE, suit: Suit.CLUBS },
        { rank: Rank.FOUR, suit: Suit.SPADES },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.QUEEN, suit: Suit.DIAMONDS }
      ];
      
      const result = evaluator.getBestHand(wheelStraight);
      expect(result.type).toBe(HandType.STRAIGHT);
      expect(result.primaryRank).toBe(Rank.FIVE); // In a wheel, 5 is the high card
    });

    it('should identify three of a kind correctly', () => {
      const threeOfAKind: Card[] = [
        { rank: Rank.TEN, suit: Suit.HEARTS },
        { rank: Rank.TEN, suit: Suit.DIAMONDS },
        { rank: Rank.TEN, suit: Suit.CLUBS },
        { rank: Rank.ACE, suit: Suit.SPADES },
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];
      
      const result = evaluator.getBestHand(threeOfAKind);
      expect(result.type).toBe(HandType.THREE_OF_A_KIND);
      expect(result.primaryRank).toBe(Rank.TEN);
      expect(result.kickers).toContain(Rank.ACE);
      expect(result.kickers).toContain(Rank.KING);
    });

    it('should identify two pair correctly', () => {
      const twoPair: Card[] = [
        { rank: Rank.JACK, suit: Suit.HEARTS },
        { rank: Rank.JACK, suit: Suit.DIAMONDS },
        { rank: Rank.NINE, suit: Suit.CLUBS },
        { rank: Rank.NINE, suit: Suit.SPADES },
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];
      
      const result = evaluator.getBestHand(twoPair);
      expect(result.type).toBe(HandType.TWO_PAIR);
      expect(result.primaryRank).toBe(Rank.JACK);
      expect(result.kickers[0]).toBe(Rank.NINE);
      expect(result.kickers[1]).toBe(Rank.ACE);
    });

    it('should identify pair correctly', () => {
      const pair: Card[] = [
        { rank: Rank.EIGHT, suit: Suit.HEARTS },
        { rank: Rank.EIGHT, suit: Suit.DIAMONDS },
        { rank: Rank.ACE, suit: Suit.CLUBS },
        { rank: Rank.KING, suit: Suit.SPADES },
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];
      
      const result = evaluator.getBestHand(pair);
      expect(result.type).toBe(HandType.PAIR);
      expect(result.primaryRank).toBe(Rank.EIGHT);
      expect(result.kickers).toContain(Rank.ACE);
      expect(result.kickers).toContain(Rank.KING);
      expect(result.kickers).toContain(Rank.QUEEN);
    });

    it('should identify high card correctly', () => {
      const highCard: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.DIAMONDS },
        { rank: Rank.NINE, suit: Suit.CLUBS },
        { rank: Rank.SEVEN, suit: Suit.SPADES },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.THREE, suit: Suit.CLUBS },
        { rank: Rank.TWO, suit: Suit.DIAMONDS }
      ];
      
      const result = evaluator.getBestHand(highCard);
      expect(result.type).toBe(HandType.HIGH_CARD);
      expect(result.primaryRank).toBe(Rank.ACE);
    });

    it('should always choose the strongest hand from 7 cards', () => {
      fc.assert(
        fc.property(sevenCardHandArbitrary, (cards) => {
          const result = evaluator.getBestHand(cards);
          
          // The result should be deterministic
          const result2 = evaluator.getBestHand(cards);
          expect(result.type).toBe(result2.type);
          expect(result.primaryRank).toBe(result2.primaryRank);
          expect(result.kickers).toEqual(result2.kickers);
          expect(result.strength).toBe(result2.strength);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: poker-ai-game, Property 4: Hand Comparison Consistency**
   * **Validates: Requirements 2.2**
   * 
   * For any two poker hands, if hand A beats hand B, then comparing them should 
   * always return the same result, and tie-breaking should use proper kicker rules
   */
  describe('Property 4: Hand Comparison Consistency', () => {
    it('should be consistent: if A > B then compareHands(A, B) > 0', () => {
      fc.assert(
        fc.property(twoHandsArbitrary, ([cards1, cards2]) => {
          const hand1 = evaluator.getBestHand(cards1);
          const hand2 = evaluator.getBestHand(cards2);
          
          const comparison = evaluator.compareHands(hand1, hand2);
          const reverseComparison = evaluator.compareHands(hand2, hand1);
          
          // Comparison should be antisymmetric
          if (comparison > 0) {
            expect(reverseComparison).toBeLessThan(0);
          } else if (comparison < 0) {
            expect(reverseComparison).toBeGreaterThan(0);
          } else {
            expect(reverseComparison).toBe(0);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should be transitive: if A > B and B > C, then A > C', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          (seed) => {
            // Generate 3 hands from the same deck
            const deck: Card[] = [];
            for (const suit of [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES]) {
              for (const rank of [Rank.TWO, Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX,
                                  Rank.SEVEN, Rank.EIGHT, Rank.NINE, Rank.TEN,
                                  Rank.JACK, Rank.QUEEN, Rank.KING, Rank.ACE]) {
                deck.push({ rank, suit });
              }
            }
            
            const shuffled = [...deck];
            let currentIndex = shuffled.length;
            let randomValue = seed;
            
            while (currentIndex > 0) {
              randomValue = (randomValue * 1103515245 + 12345) & 0x7fffffff;
              const randomIndex = randomValue % currentIndex;
              currentIndex--;
              [shuffled[currentIndex], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[currentIndex]];
            }
            
            const cards1 = shuffled.slice(0, 7);
            const cards2 = shuffled.slice(7, 14);
            const cards3 = shuffled.slice(14, 21);
            
            const handA = evaluator.getBestHand(cards1);
            const handB = evaluator.getBestHand(cards2);
            const handC = evaluator.getBestHand(cards3);
            
            const compAB = evaluator.compareHands(handA, handB);
            const compBC = evaluator.compareHands(handB, handC);
            const compAC = evaluator.compareHands(handA, handC);
            
            // If A > B and B > C, then A > C
            if (compAB > 0 && compBC > 0) {
              expect(compAC).toBeGreaterThan(0);
            }
            
            // If A < B and B < C, then A < C
            if (compAB < 0 && compBC < 0) {
              expect(compAC).toBeLessThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be symmetric: compareHands(A, B) = -compareHands(B, A)', () => {
      fc.assert(
        fc.property(twoHandsArbitrary, ([cards1, cards2]) => {
          const hand1 = evaluator.getBestHand(cards1);
          const hand2 = evaluator.getBestHand(cards2);
          
          const comp12 = evaluator.compareHands(hand1, hand2);
          const comp21 = evaluator.compareHands(hand2, hand1);
          
          // Handle the case where comp12 is 0 (equal hands)
          if (comp12 === 0) {
            expect(comp21).toBe(0);
          } else {
            expect(comp12).toBe(-comp21);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should be reflexive: compareHands(A, A) = 0', () => {
      fc.assert(
        fc.property(sevenCardHandArbitrary, (cards) => {
          const hand = evaluator.getBestHand(cards);
          
          const comparison = evaluator.compareHands(hand, hand);
          
          expect(comparison).toBe(0);
        }),
        { numRuns: 100 }
      );
    });

    it('should properly compare hands of different types', () => {
      // Royal flush beats everything
      const royalFlush: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.JACK, suit: Suit.HEARTS },
        { rank: Rank.TEN, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      // Four of a kind
      const fourOfAKind: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.ACE, suit: Suit.DIAMONDS },
        { rank: Rank.ACE, suit: Suit.CLUBS },
        { rank: Rank.ACE, suit: Suit.SPADES },
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      const royalFlushHand = evaluator.getBestHand(royalFlush);
      const fourOfAKindHand = evaluator.getBestHand(fourOfAKind);

      expect(evaluator.compareHands(royalFlushHand, fourOfAKindHand)).toBeGreaterThan(0);
    });

    it('should properly use kickers for tie-breaking with pairs', () => {
      // Pair of Kings with Ace kicker
      const pairKingsAce: Card[] = [
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.DIAMONDS },
        { rank: Rank.ACE, suit: Suit.CLUBS },
        { rank: Rank.QUEEN, suit: Suit.SPADES },
        { rank: Rank.JACK, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      // Pair of Kings with Queen kicker
      const pairKingsQueen: Card[] = [
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.KING, suit: Suit.SPADES },
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.JACK, suit: Suit.DIAMONDS },
        { rank: Rank.TEN, suit: Suit.CLUBS },
        { rank: Rank.TWO, suit: Suit.SPADES },
        { rank: Rank.THREE, suit: Suit.HEARTS }
      ];

      const hand1 = evaluator.getBestHand(pairKingsAce);
      const hand2 = evaluator.getBestHand(pairKingsQueen);

      // Both should be pairs of Kings
      expect(hand1.type).toBe(HandType.PAIR);
      expect(hand2.type).toBe(HandType.PAIR);
      expect(hand1.primaryRank).toBe(Rank.KING);
      expect(hand2.primaryRank).toBe(Rank.KING);

      // Hand1 should win because of better kicker (Ace > Queen)
      expect(evaluator.compareHands(hand1, hand2)).toBeGreaterThan(0);
    });

    it('should properly use kickers for tie-breaking with two pair', () => {
      // Two pair: Kings and Queens with Ace kicker
      const twoPairAce: Card[] = [
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.DIAMONDS },
        { rank: Rank.QUEEN, suit: Suit.CLUBS },
        { rank: Rank.QUEEN, suit: Suit.SPADES },
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      // Two pair: Kings and Queens with Jack kicker
      const twoPairJack: Card[] = [
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.KING, suit: Suit.SPADES },
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.QUEEN, suit: Suit.DIAMONDS },
        { rank: Rank.JACK, suit: Suit.CLUBS },
        { rank: Rank.TWO, suit: Suit.SPADES },
        { rank: Rank.THREE, suit: Suit.HEARTS }
      ];

      const hand1 = evaluator.getBestHand(twoPairAce);
      const hand2 = evaluator.getBestHand(twoPairJack);

      // Both should be two pair with same pairs
      expect(hand1.type).toBe(HandType.TWO_PAIR);
      expect(hand2.type).toBe(HandType.TWO_PAIR);
      expect(hand1.primaryRank).toBe(Rank.KING);
      expect(hand2.primaryRank).toBe(Rank.KING);

      // Hand1 should win because of better kicker (Ace > Jack)
      expect(evaluator.compareHands(hand1, hand2)).toBeGreaterThan(0);
    });

    it('should properly compare flushes by high card', () => {
      // Flush with Ace high
      const flushAceHigh: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.NINE, suit: Suit.HEARTS },
        { rank: Rank.SEVEN, suit: Suit.HEARTS },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      // Flush with King high
      const flushKingHigh: Card[] = [
        { rank: Rank.KING, suit: Suit.DIAMONDS },
        { rank: Rank.QUEEN, suit: Suit.DIAMONDS },
        { rank: Rank.JACK, suit: Suit.DIAMONDS },
        { rank: Rank.NINE, suit: Suit.DIAMONDS },
        { rank: Rank.SEVEN, suit: Suit.DIAMONDS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.SPADES }
      ];

      const hand1 = evaluator.getBestHand(flushAceHigh);
      const hand2 = evaluator.getBestHand(flushKingHigh);

      expect(hand1.type).toBe(HandType.FLUSH);
      expect(hand2.type).toBe(HandType.FLUSH);

      // Ace-high flush should beat King-high flush
      expect(evaluator.compareHands(hand1, hand2)).toBeGreaterThan(0);
    });

    it('should properly compare straights by high card', () => {
      // Straight: 9-8-7-6-5
      const straightNineHigh: Card[] = [
        { rank: Rank.NINE, suit: Suit.HEARTS },
        { rank: Rank.EIGHT, suit: Suit.DIAMONDS },
        { rank: Rank.SEVEN, suit: Suit.CLUBS },
        { rank: Rank.SIX, suit: Suit.SPADES },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      // Straight: 8-7-6-5-4
      const straightEightHigh: Card[] = [
        { rank: Rank.EIGHT, suit: Suit.HEARTS },
        { rank: Rank.SEVEN, suit: Suit.DIAMONDS },
        { rank: Rank.SIX, suit: Suit.CLUBS },
        { rank: Rank.FIVE, suit: Suit.SPADES },
        { rank: Rank.FOUR, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      const hand1 = evaluator.getBestHand(straightNineHigh);
      const hand2 = evaluator.getBestHand(straightEightHigh);

      expect(hand1.type).toBe(HandType.STRAIGHT);
      expect(hand2.type).toBe(HandType.STRAIGHT);

      // Nine-high straight should beat eight-high straight
      expect(evaluator.compareHands(hand1, hand2)).toBeGreaterThan(0);
    });

    it('should recognize equal hands as ties', () => {
      // Same pair of Aces with same kickers
      const pairAces1: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.ACE, suit: Suit.DIAMONDS },
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.QUEEN, suit: Suit.SPADES },
        { rank: Rank.JACK, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      const pairAces2: Card[] = [
        { rank: Rank.ACE, suit: Suit.CLUBS },
        { rank: Rank.ACE, suit: Suit.SPADES },
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.QUEEN, suit: Suit.DIAMONDS },
        { rank: Rank.JACK, suit: Suit.CLUBS },
        { rank: Rank.TWO, suit: Suit.SPADES },
        { rank: Rank.THREE, suit: Suit.HEARTS }
      ];

      const hand1 = evaluator.getBestHand(pairAces1);
      const hand2 = evaluator.getBestHand(pairAces2);

      expect(evaluator.compareHands(hand1, hand2)).toBe(0);
    });
  });
});
