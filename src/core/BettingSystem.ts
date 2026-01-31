import { Player, PlayerAction, ActionType, PotState, SidePot } from '../types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface PotOdds {
  potSize: number;
  callAmount: number;
  odds: number; // ratio as decimal (e.g., 2.5 means 2.5:1)
  percentage: number; // percentage needed to break even
}

export interface DistributionResult {
  distributions: Map<string, number>;
  totalDistributed: number;
}

export class BettingSystem {
  private bigBlindAmount: number;

  constructor(bigBlindAmount: number) {
    this.bigBlindAmount = bigBlindAmount;
  }

  /**
   * Validates a player action before processing
   */
  validateAction(
    player: Player,
    action: PlayerAction,
    currentBet: number,
    players: Player[]
  ): ValidationResult {
    // Player must be active
    if (!player.isActive) {
      return { valid: false, error: 'Player is not active' };
    }

    // Player cannot act if all-in
    if (player.isAllIn) {
      return { valid: false, error: 'Player is all-in and cannot act' };
    }

    const amountToCall = currentBet - player.currentBet;

    switch (action.type) {
      case ActionType.FOLD:
        // Fold is always valid
        return { valid: true };

      case ActionType.CHECK:
        // Can only check if no bet to call
        if (amountToCall > 0) {
          return { valid: false, error: 'Cannot check, must call or raise' };
        }
        return { valid: true };

      case ActionType.CALL:
        // Must have a bet to call
        if (amountToCall === 0) {
          return { valid: false, error: 'No bet to call, use check instead' };
        }
        // Player must have chips (or will be all-in)
        if (player.chipStack === 0) {
          return { valid: false, error: 'No chips to call with' };
        }
        return { valid: true };

      case ActionType.BET:
        // Can only bet if no current bet
        if (currentBet > 0) {
          return { valid: false, error: 'Cannot bet, there is already a bet. Use raise instead' };
        }
        // Must specify amount
        if (!action.amount || action.amount <= 0) {
          return { valid: false, error: 'Bet amount must be positive' };
        }
        // Minimum bet is big blind
        if (action.amount < this.bigBlindAmount && action.amount < player.chipStack) {
          return { valid: false, error: `Minimum bet is ${this.bigBlindAmount}` };
        }
        // Cannot bet more than chip stack
        if (action.amount > player.chipStack) {
          return { valid: false, error: 'Cannot bet more than chip stack' };
        }
        return { valid: true };

      case ActionType.RAISE:
        // Must have a bet to raise
        if (currentBet === 0) {
          return { valid: false, error: 'No bet to raise, use bet instead' };
        }
        // Must specify amount
        if (!action.amount || action.amount <= 0) {
          return { valid: false, error: 'Raise amount must be positive' };
        }
        // Calculate minimum raise (current bet + last raise amount, or current bet + big blind)
        const lastRaiseAmount = this.calculateLastRaiseAmount(players, currentBet);
        const minimumRaise = currentBet + lastRaiseAmount;
        
        // Check if player has enough for minimum raise
        const totalNeeded = action.amount;
        if (totalNeeded < minimumRaise && totalNeeded < player.chipStack + player.currentBet) {
          return { valid: false, error: `Minimum raise to ${minimumRaise}` };
        }
        // Cannot raise more than chip stack
        if (action.amount > player.chipStack + player.currentBet) {
          return { valid: false, error: 'Cannot raise more than chip stack' };
        }
        return { valid: true };

      default:
        return { valid: false, error: 'Invalid action type' };
    }
  }

  /**
   * Process a validated player action
   */
  processAction(
    player: Player,
    action: PlayerAction,
    players: Player[],
    pot: PotState
  ): { success: boolean; pot?: PotState; error?: string } {
    const currentBet = this.getCurrentBet(players);

    switch (action.type) {
      case ActionType.FOLD:
        player.isActive = false;
        player.lastAction = action;
        break;

      case ActionType.CHECK:
        player.lastAction = action;
        break;

      case ActionType.CALL: {
        const amountToCall = currentBet - player.currentBet;
        const actualCall = Math.min(amountToCall, player.chipStack);
        
        player.chipStack -= actualCall;
        player.currentBet += actualCall;
        player.lastAction = { ...action, amount: actualCall };
        
        if (player.chipStack === 0) {
          player.isAllIn = true;
        }
        
        pot.mainPot += actualCall;
        pot.totalPot += actualCall;
        break;
      }

      case ActionType.BET: {
        const betAmount = action.amount!;
        const actualBet = Math.min(betAmount, player.chipStack);
        
        player.chipStack -= actualBet;
        player.currentBet += actualBet;
        player.lastAction = { ...action, amount: actualBet };
        
        if (player.chipStack === 0) {
          player.isAllIn = true;
        }
        
        pot.mainPot += actualBet;
        pot.totalPot += actualBet;
        break;
      }

      case ActionType.RAISE: {
        const raiseAmount = action.amount!;
        const amountToAdd = raiseAmount - player.currentBet;
        const actualRaise = Math.min(amountToAdd, player.chipStack);
        
        player.chipStack -= actualRaise;
        player.currentBet += actualRaise;
        player.lastAction = { ...action, amount: player.currentBet };
        
        if (player.chipStack === 0) {
          player.isAllIn = true;
        }
        
        pot.mainPot += actualRaise;
        pot.totalPot += actualRaise;
        break;
      }

      default:
        return {
          success: false,
          error: 'Invalid action type'
        };
    }

    return {
      success: true,
      pot
    };
  }

  /**
   * Calculate pot odds for a player
   */
  calculatePotOdds(potSize: number, callAmount: number): PotOdds {
    if (callAmount === 0) {
      return {
        potSize,
        callAmount: 0,
        odds: 0,
        percentage: 0
      };
    }

    const odds = potSize / callAmount;
    const percentage = (callAmount / (potSize + callAmount)) * 100;

    return {
      potSize,
      callAmount,
      odds,
      percentage
    };
  }

  /**
   * Distribute pot to winners
   */
  distributePot(
    winners: Array<{ playerId: string; handRank?: any }>,
    pot: PotState,
    players: Player[]
  ): DistributionResult {
    const distributions = new Map<string, number>();
    let totalDistributed = 0;

    // If only one winner, they get everything
    if (winners.length === 1) {
      const amount = pot.totalPot;
      distributions.set(winners[0].playerId, amount);
      totalDistributed = amount;
      return { distributions, totalDistributed };
    }

    // Multiple winners - split the pot
    const sharePerWinner = Math.floor(pot.totalPot / winners.length);
    const remainder = pot.totalPot % winners.length;

    winners.forEach((winner, index) => {
      let amount = sharePerWinner;
      // Give remainder to first winner(s)
      if (index < remainder) {
        amount += 1;
      }
      distributions.set(winner.playerId, amount);
      totalDistributed += amount;
    });

    return { distributions, totalDistributed };
  }

  /**
   * Calculate side pots when players are all-in
   */
  calculateSidePots(players: Player[]): PotState {
    // Get all players who have bet
    const bettingPlayers = players.filter(p => p.currentBet > 0);
    
    if (bettingPlayers.length === 0) {
      return {
        mainPot: 0,
        sidePots: [],
        totalPot: 0
      };
    }

    // Sort players by their current bet amount
    const sortedPlayers = [...bettingPlayers].sort((a, b) => a.currentBet - b.currentBet);
    
    const sidePots: SidePot[] = [];
    let remainingPlayers = [...sortedPlayers];
    let previousBet = 0;

    while (remainingPlayers.length > 0) {
      const currentPlayer = remainingPlayers[0];
      const currentBet = currentPlayer.currentBet;
      const betIncrement = currentBet - previousBet;

      if (betIncrement > 0) {
        // Create a pot for this level
        const potAmount = betIncrement * remainingPlayers.length;
        const eligiblePlayers = remainingPlayers.map(p => p.id);

        sidePots.push({
          amount: potAmount,
          eligiblePlayers
        });
      }

      previousBet = currentBet;
      remainingPlayers.shift();
    }

    // Calculate totals
    const totalPot = sidePots.reduce((sum, pot) => sum + pot.amount, 0);
    const mainPot = sidePots.length > 0 ? sidePots[0].amount : 0;
    const additionalSidePots = sidePots.slice(1);

    return {
      mainPot,
      sidePots: additionalSidePots,
      totalPot
    };
  }

  /**
   * Reset all player bets for a new betting round
   */
  resetBetsForNewRound(players: Player[]): Player[] {
    return players.map(player => ({
      ...player,
      currentBet: 0
    }));
  }

  /**
   * Calculate the last raise amount to determine minimum raise
   */
  private calculateLastRaiseAmount(players: Player[], currentBet: number): number {
    // Find the last raise amount by looking at betting history
    // For simplicity, use big blind as minimum raise increment
    // In a full implementation, track the actual last raise amount
    return this.bigBlindAmount;
  }

  /**
   * Get the current highest bet
   */
  getCurrentBet(players: Player[]): number {
    return Math.max(...players.map(p => p.currentBet), 0);
  }

  /**
   * Check if betting round is complete
   */
  isBettingRoundComplete(players: Player[]): boolean {
    const activePlayers = players.filter(p => p.isActive && !p.isAllIn);
    
    if (activePlayers.length === 0) {
      return true;
    }

    if (activePlayers.length === 1) {
      return true;
    }

    // All active players must have acted and matched the current bet
    const currentBet = this.getCurrentBet(players);
    const allMatched = activePlayers.every(p => 
      p.lastAction !== null && (p.currentBet === currentBet || p.chipStack === 0)
    );

    return allMatched;
  }
}
