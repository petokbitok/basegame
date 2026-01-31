import { Player, PlayerAction, ActionType, GameState, Card } from '../types';
import { HandEvaluator } from '../core/HandEvaluator';

/**
 * Basic AI player for poker game
 * Makes decisions based on hand strength and pot odds
 */
export class AIPlayer {
  private handEvaluator: HandEvaluator;
  private playerId: string;

  constructor(playerId: string) {
    this.playerId = playerId;
    this.handEvaluator = new HandEvaluator();
  }

  /**
   * Make a decision based on current game state
   * @param gameState Current game state
   * @param player AI player
   * @returns PlayerAction Decision
   */
  makeDecision(gameState: GameState, player: Player): PlayerAction {
    // Calculate hand strength
    const handStrength = this.calculateHandStrength(
      player.holeCards,
      gameState.communityCards
    );

    const currentBet = Math.max(...gameState.players.map((p) => p.currentBet));
    const callAmount = currentBet - player.currentBet;
    const potOdds = this.calculatePotOdds(callAmount, gameState.pot.totalPot);

    // Decision logic based on hand strength
    if (handStrength > 0.8) {
      // Strong hand - raise
      const raiseAmount = Math.min(
        Math.floor(gameState.pot.totalPot * 0.5),
        player.chipStack
      );
      return {
        type: ActionType.RAISE,
        amount: currentBet + raiseAmount,
        playerId: this.playerId,
      };
    } else if (handStrength > 0.6) {
      // Good hand - call or bet
      if (callAmount === 0) {
        const betAmount = Math.min(
          Math.floor(gameState.pot.totalPot * 0.3),
          player.chipStack
        );
        return {
          type: ActionType.BET,
          amount: betAmount,
          playerId: this.playerId,
        };
      } else {
        return {
          type: ActionType.CALL,
          amount: callAmount,
          playerId: this.playerId,
        };
      }
    } else if (handStrength > 0.4 && potOdds > 0.3) {
      // Medium hand with good pot odds - call
      if (callAmount === 0) {
        return {
          type: ActionType.CHECK,
          playerId: this.playerId,
        };
      } else {
        return {
          type: ActionType.CALL,
          amount: callAmount,
          playerId: this.playerId,
        };
      }
    } else {
      // Weak hand - fold or check
      if (callAmount === 0) {
        return {
          type: ActionType.CHECK,
          playerId: this.playerId,
        };
      } else {
        return {
          type: ActionType.FOLD,
          playerId: this.playerId,
        };
      }
    }
  }

  /**
   * Calculate hand strength (0-1 scale)
   * @param holeCards Player's hole cards
   * @param communityCards Community cards
   * @returns number Hand strength
   */
  calculateHandStrength(holeCards: Card[], communityCards: Card[]): number {
    if (holeCards.length === 0) return 0;

    if (communityCards.length === 0) {
      // Pre-flop: evaluate hole cards
      return this.evaluateHoleCards(holeCards);
    }

    // Post-flop: evaluate full hand
    const allCards = [...holeCards, ...communityCards];
    if (allCards.length < 7) {
      // Not enough cards yet, use partial evaluation
      return this.evaluateHoleCards(holeCards) * 0.7;
    }

    const handRank = this.handEvaluator.evaluateHand(holeCards, communityCards);
    
    // Normalize strength based on hand type
    // Royal Flush = 9, High Card = 0
    const typeStrength = handRank.type / 9;
    const rankStrength = handRank.primaryRank / 14;
    
    return Math.min(typeStrength * 0.8 + rankStrength * 0.2, 1);
  }

  /**
   * Evaluate hole cards strength (pre-flop)
   * @param holeCards Hole cards
   * @returns number Strength (0-1)
   */
  private evaluateHoleCards(holeCards: Card[]): number {
    if (holeCards.length !== 2) return 0;

    const [card1, card2] = holeCards;
    const isPair = card1.rank === card2.rank;
    const isSuited = card1.suit === card2.suit;
    const highCard = Math.max(card1.rank, card2.rank);

    let strength = 0;

    // Pairs are strong
    if (isPair) {
      strength = 0.5 + (highCard / 14) * 0.3;
    } else {
      // High cards
      strength = (highCard / 14) * 0.4;

      // Suited adds value
      if (isSuited) {
        strength += 0.1;
      }

      // Connected cards add value
      if (Math.abs(card1.rank - card2.rank) === 1) {
        strength += 0.05;
      }
    }

    return Math.min(strength, 1);
  }

  /**
   * Calculate pot odds
   * @param callAmount Amount to call
   * @param potSize Current pot size
   * @returns number Pot odds ratio
   */
  private calculatePotOdds(callAmount: number, potSize: number): number {
    if (callAmount === 0) return 1;
    return potSize / (potSize + callAmount);
  }
}
