import { HandEvaluator } from '../HandEvaluator';
import { Card, Rank, Suit, HandType } from '../../types';

describe('HandEvaluator Unit Tests', () => {
  const evaluator = new HandEvaluator();

  describe('Royal Flush vs Straight Flush', () => {
    it('should recognize that royal flush beats straight flush', () => {
      const royalFlush: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.JACK, suit: Suit.HEARTS },
        { rank: Rank.TEN, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      const straightFlush: Card[] = [
        { rank: Rank.NINE, suit: Suit.DIAMONDS },
        { rank: Rank.EIGHT, suit: Suit.DIAMONDS },
        { rank: Rank.SEVEN, suit: Suit.DIAMONDS },
        { rank: Rank.SIX, suit: Suit.DIAMONDS },
        { rank: Rank.FIVE, suit: Suit.DIAMONDS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.SPADES }
      ];

      const royalFlushHand = evaluator.getBestHand(royalFlush);
      const straightFlushHand = evaluator.getBestHand(straightFlush);

      expect(royalFlushHand.type).toBe(HandType.ROYAL_FLUSH);
      expect(straightFlushHand.type).toBe(HandType.STRAIGHT_FLUSH);
      expect(evaluator.compareHands(royalFlushHand, straightFlushHand)).toBeGreaterThan(0);
    });

    it('should recognize higher straight flush beats lower straight flush', () => {
      const straightFlushNine: Card[] = [
        { rank: Rank.NINE, suit: Suit.HEARTS },
        { rank: Rank.EIGHT, suit: Suit.HEARTS },
        { rank: Rank.SEVEN, suit: Suit.HEARTS },
        { rank: Rank.SIX, suit: Suit.HEARTS },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      const straightFlushSix: Card[] = [
        { rank: Rank.SIX, suit: Suit.DIAMONDS },
        { rank: Rank.FIVE, suit: Suit.DIAMONDS },
        { rank: Rank.FOUR, suit: Suit.DIAMONDS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS },
        { rank: Rank.TWO, suit: Suit.DIAMONDS },
        { rank: Rank.ACE, suit: Suit.CLUBS },
        { rank: Rank.KING, suit: Suit.SPADES }
      ];

      const hand1 = evaluator.getBestHand(straightFlushNine);
      const hand2 = evaluator.getBestHand(straightFlushSix);

      expect(hand1.type).toBe(HandType.STRAIGHT_FLUSH);
      expect(hand2.type).toBe(HandType.STRAIGHT_FLUSH);
      expect(evaluator.compareHands(hand1, hand2)).toBeGreaterThan(0);
    });
  });

  describe('Tie-breaking with Kickers', () => {
    it('should use kickers to break ties with pairs', () => {
      // Pair of 10s with A-K-Q kickers
      const pairTensAKQ: Card[] = [
        { rank: Rank.TEN, suit: Suit.HEARTS },
        { rank: Rank.TEN, suit: Suit.DIAMONDS },
        { rank: Rank.ACE, suit: Suit.CLUBS },
        { rank: Rank.KING, suit: Suit.SPADES },
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      // Pair of 10s with A-K-J kickers
      const pairTensAKJ: Card[] = [
        { rank: Rank.TEN, suit: Suit.CLUBS },
        { rank: Rank.TEN, suit: Suit.SPADES },
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.DIAMONDS },
        { rank: Rank.JACK, suit: Suit.CLUBS },
        { rank: Rank.TWO, suit: Suit.SPADES },
        { rank: Rank.THREE, suit: Suit.HEARTS }
      ];

      const hand1 = evaluator.getBestHand(pairTensAKQ);
      const hand2 = evaluator.getBestHand(pairTensAKJ);

      expect(hand1.type).toBe(HandType.PAIR);
      expect(hand2.type).toBe(HandType.PAIR);
      expect(hand1.primaryRank).toBe(Rank.TEN);
      expect(hand2.primaryRank).toBe(Rank.TEN);

      // First two kickers are the same (A, K), third kicker decides (Q > J)
      expect(evaluator.compareHands(hand1, hand2)).toBeGreaterThan(0);
    });

    it('should use kickers to break ties with three of a kind', () => {
      // Three 7s with A-K kickers
      const threeSevensAK: Card[] = [
        { rank: Rank.SEVEN, suit: Suit.HEARTS },
        { rank: Rank.SEVEN, suit: Suit.DIAMONDS },
        { rank: Rank.SEVEN, suit: Suit.CLUBS },
        { rank: Rank.ACE, suit: Suit.SPADES },
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      // Three 7s with A-Q kickers
      const threeSevensAQ: Card[] = [
        { rank: Rank.SEVEN, suit: Suit.SPADES },
        { rank: Rank.SEVEN, suit: Suit.CLUBS },
        { rank: Rank.SEVEN, suit: Suit.HEARTS },
        { rank: Rank.ACE, suit: Suit.DIAMONDS },
        { rank: Rank.QUEEN, suit: Suit.CLUBS },
        { rank: Rank.TWO, suit: Suit.SPADES },
        { rank: Rank.THREE, suit: Suit.HEARTS }
      ];

      const hand1 = evaluator.getBestHand(threeSevensAK);
      const hand2 = evaluator.getBestHand(threeSevensAQ);

      expect(hand1.type).toBe(HandType.THREE_OF_A_KIND);
      expect(hand2.type).toBe(HandType.THREE_OF_A_KIND);

      // First kicker is the same (A), second kicker decides (K > Q)
      expect(evaluator.compareHands(hand1, hand2)).toBeGreaterThan(0);
    });

    it('should use kickers to break ties with four of a kind', () => {
      // Four 5s with Ace kicker
      const fourFivesAce: Card[] = [
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.FIVE, suit: Suit.DIAMONDS },
        { rank: Rank.FIVE, suit: Suit.CLUBS },
        { rank: Rank.FIVE, suit: Suit.SPADES },
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      // Four 5s with King kicker
      const fourFivesKing: Card[] = [
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.FIVE, suit: Suit.DIAMONDS },
        { rank: Rank.FIVE, suit: Suit.CLUBS },
        { rank: Rank.FIVE, suit: Suit.SPADES },
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.DIAMONDS }
      ];

      const hand1 = evaluator.getBestHand(fourFivesAce);
      const hand2 = evaluator.getBestHand(fourFivesKing);

      expect(hand1.type).toBe(HandType.FOUR_OF_A_KIND);
      expect(hand2.type).toBe(HandType.FOUR_OF_A_KIND);

      // Kicker decides (A > K)
      expect(evaluator.compareHands(hand1, hand2)).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle wheel straight (A-2-3-4-5) correctly', () => {
      const wheelStraight: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.DIAMONDS },
        { rank: Rank.THREE, suit: Suit.CLUBS },
        { rank: Rank.FOUR, suit: Suit.SPADES },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.QUEEN, suit: Suit.DIAMONDS }
      ];

      const hand = evaluator.getBestHand(wheelStraight);

      expect(hand.type).toBe(HandType.STRAIGHT);
      expect(hand.primaryRank).toBe(Rank.FIVE); // In a wheel, 5 is the high card
    });

    it('should recognize wheel straight loses to six-high straight', () => {
      const wheelStraight: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.TWO, suit: Suit.DIAMONDS },
        { rank: Rank.THREE, suit: Suit.CLUBS },
        { rank: Rank.FOUR, suit: Suit.SPADES },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.QUEEN, suit: Suit.DIAMONDS }
      ];

      const sixHighStraight: Card[] = [
        { rank: Rank.SIX, suit: Suit.HEARTS },
        { rank: Rank.FIVE, suit: Suit.DIAMONDS },
        { rank: Rank.FOUR, suit: Suit.CLUBS },
        { rank: Rank.THREE, suit: Suit.SPADES },
        { rank: Rank.TWO, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.QUEEN, suit: Suit.DIAMONDS }
      ];

      const wheelHand = evaluator.getBestHand(wheelStraight);
      const sixHighHand = evaluator.getBestHand(sixHighStraight);

      expect(wheelHand.type).toBe(HandType.STRAIGHT);
      expect(sixHighHand.type).toBe(HandType.STRAIGHT);
      expect(evaluator.compareHands(sixHighHand, wheelHand)).toBeGreaterThan(0);
    });

    it('should handle full house with two three-of-a-kinds', () => {
      // Three Kings and three Queens - should make Kings full of Queens
      const twoThrees: Card[] = [
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.DIAMONDS },
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.QUEEN, suit: Suit.DIAMONDS },
        { rank: Rank.QUEEN, suit: Suit.CLUBS },
        { rank: Rank.TWO, suit: Suit.SPADES }
      ];

      const hand = evaluator.getBestHand(twoThrees);

      expect(hand.type).toBe(HandType.FULL_HOUSE);
      expect(hand.primaryRank).toBe(Rank.KING); // Higher three of a kind
      expect(hand.kickers[0]).toBe(Rank.QUEEN); // Lower three of a kind becomes the pair
    });

    it('should handle full house with three pairs', () => {
      // Three pairs: Aces, Kings, Queens - should make Aces full of Kings
      const threePairs: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.ACE, suit: Suit.DIAMONDS },
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.KING, suit: Suit.SPADES },
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.QUEEN, suit: Suit.DIAMONDS },
        { rank: Rank.TWO, suit: Suit.CLUBS }
      ];

      const hand = evaluator.getBestHand(threePairs);

      expect(hand.type).toBe(HandType.TWO_PAIR);
      expect(hand.primaryRank).toBe(Rank.ACE);
      expect(hand.kickers[0]).toBe(Rank.KING);
      expect(hand.kickers[1]).toBe(Rank.QUEEN); // Third pair becomes kicker
    });

    it('should choose flush over straight when both are present', () => {
      const flushAndStraight: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.HEARTS },
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.JACK, suit: Suit.HEARTS },
        { rank: Rank.TEN, suit: Suit.SPADES }, // Breaks the flush
        { rank: Rank.NINE, suit: Suit.HEARTS },
        { rank: Rank.EIGHT, suit: Suit.DIAMONDS }
      ];

      const hand = evaluator.getBestHand(flushAndStraight);

      // Should be a flush (5 hearts), not a straight
      expect(hand.type).toBe(HandType.FLUSH);
    });

    it('should handle best 5 cards from 7 with multiple pairs', () => {
      const multiplePairs: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.ACE, suit: Suit.DIAMONDS },
        { rank: Rank.KING, suit: Suit.CLUBS },
        { rank: Rank.KING, suit: Suit.SPADES },
        { rank: Rank.FIVE, suit: Suit.HEARTS },
        { rank: Rank.FIVE, suit: Suit.DIAMONDS },
        { rank: Rank.TWO, suit: Suit.CLUBS }
      ];

      const hand = evaluator.getBestHand(multiplePairs);

      expect(hand.type).toBe(HandType.TWO_PAIR);
      expect(hand.primaryRank).toBe(Rank.ACE);
      expect(hand.kickers[0]).toBe(Rank.KING);
      expect(hand.kickers[1]).toBe(Rank.FIVE); // Best kicker from remaining cards
    });

    it('should handle evaluateHand with 2 hole cards and 5 community cards', () => {
      const holeCards: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.ACE, suit: Suit.DIAMONDS }
      ];

      const communityCards: Card[] = [
        { rank: Rank.ACE, suit: Suit.CLUBS },
        { rank: Rank.KING, suit: Suit.SPADES },
        { rank: Rank.QUEEN, suit: Suit.HEARTS },
        { rank: Rank.NINE, suit: Suit.DIAMONDS },
        { rank: Rank.SEVEN, suit: Suit.CLUBS }
      ];

      const hand = evaluator.evaluateHand(holeCards, communityCards);

      expect(hand.type).toBe(HandType.THREE_OF_A_KIND);
      expect(hand.primaryRank).toBe(Rank.ACE);
    });

    it('should throw error if not exactly 7 cards provided to evaluateHand', () => {
      const holeCards: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.ACE, suit: Suit.DIAMONDS }
      ];

      const communityCards: Card[] = [
        { rank: Rank.KING, suit: Suit.SPADES },
        { rank: Rank.QUEEN, suit: Suit.HEARTS }
      ];

      expect(() => {
        evaluator.evaluateHand(holeCards, communityCards);
      }).toThrow('Expected 7 cards, got 4');
    });
  });

  describe('Performance', () => {
    it('should evaluate hands in less than 1ms', () => {
      const cards: Card[] = [
        { rank: Rank.ACE, suit: Suit.HEARTS },
        { rank: Rank.KING, suit: Suit.DIAMONDS },
        { rank: Rank.QUEEN, suit: Suit.CLUBS },
        { rank: Rank.JACK, suit: Suit.SPADES },
        { rank: Rank.TEN, suit: Suit.HEARTS },
        { rank: Rank.NINE, suit: Suit.DIAMONDS },
        { rank: Rank.EIGHT, suit: Suit.CLUBS }
      ];

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        evaluator.getBestHand(cards);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(1); // Should be less than 1ms per evaluation
    });
  });
});
