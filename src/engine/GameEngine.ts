import { CardDeck } from '../core/CardDeck';
import { HandEvaluator } from '../core/HandEvaluator';
import { BettingSystem } from '../core/BettingSystem';
import {
  Card,
  Player,
  GameState,
  GameStage,
  ActionType,
  PlayerAction,
  HandRecord,
  PotState,
  Position,
} from '../types';

/**
 * Game result after processing an action
 */
export interface GameResult {
  success: boolean;
  newState: GameState;
  message?: string;
  error?: string;
}

/**
 * Winner result from hand evaluation
 */
export interface WinnerResult {
  playerId: string;
  amount: number;
  handRank: any;
}

/**
 * Core game engine for Texas Hold'em poker
 * Manages game state, card dealing, betting rounds, and winner determination
 */
export class GameEngine {
  private deck: CardDeck;
  private handEvaluator: HandEvaluator;
  private bettingSystem: BettingSystem;
  private gameState: GameState;
  private smallBlind: number;
  private bigBlind: number;
  private chipBalances: Map<string, number>; // Local chip balance storage

  constructor(
    players: Player[],
    smallBlind: number = 10,
    bigBlind: number = 20
  ) {
    this.deck = new CardDeck();
    this.handEvaluator = new HandEvaluator();
    this.bettingSystem = new BettingSystem(bigBlind);
    this.smallBlind = smallBlind;
    this.bigBlind = bigBlind;
    this.chipBalances = new Map();

    // Initialize chip balances locally
    players.forEach((player) => {
      this.chipBalances.set(player.id, player.chipStack);
    });

    this.gameState = {
      players: players.map((p) => ({ ...p })),
      communityCards: [],
      pot: { mainPot: 0, sidePots: [], totalPot: 0 },
      currentStage: GameStage.PRE_FLOP,
      dealerPosition: 0,
      activePlayer: 0,
      bettingRound: 0,
      handHistory: [],
      authenticatedUser: null,
    };
  }

  /**
   * Start a new hand
   * Deals hole cards and posts blinds
   */
  startNewHand(): void {
    // Reset deck and shuffle
    this.deck.reset();
    this.deck.shuffle();

    // Reset community cards
    this.gameState.communityCards = [];

    // Reset pot
    this.gameState.pot = { mainPot: 0, sidePots: [], totalPot: 0 };

    // Reset player states
    this.gameState.players.forEach((player) => {
      player.holeCards = [];
      player.currentBet = 0;
      player.isActive = player.chipStack > 0;
      player.isAllIn = false;
      player.lastAction = null;
    });

    // Set stage to pre-flop
    this.gameState.currentStage = GameStage.PRE_FLOP;
    this.gameState.bettingRound = 0;

    // Deal hole cards (2 cards per player)
    this.dealHoleCards();

    // Post blinds
    this.postBlinds();

    // Set active player (first to act after big blind)
    this.gameState.activePlayer =
      (this.gameState.dealerPosition + 3) % this.gameState.players.length;
  }

  /**
   * Deal hole cards to all active players
   */
  dealHoleCards(): void {
    const activePlayers = this.gameState.players.filter((p) => p.isActive);

    // Deal 2 cards to each player
    for (let i = 0; i < 2; i++) {
      activePlayers.forEach((player) => {
        const card = this.deck.dealCard();
        if (card) {
          player.holeCards.push(card);
        }
      });
    }
  }

  /**
   * Deal community cards based on current stage
   * @param stage Game stage to deal cards for
   */
  dealCommunityCards(stage: GameStage): void {
    switch (stage) {
      case GameStage.FLOP:
        // Burn one card, then deal 3 cards
        this.deck.dealCard(); // Burn card
        for (let i = 0; i < 3; i++) {
          const card = this.deck.dealCard();
          if (card) {
            this.gameState.communityCards.push(card);
          }
        }
        break;

      case GameStage.TURN:
      case GameStage.RIVER:
        // Burn one card, then deal 1 card
        this.deck.dealCard(); // Burn card
        const card = this.deck.dealCard();
        if (card) {
          this.gameState.communityCards.push(card);
        }
        break;
    }

    this.gameState.currentStage = stage;
  }

  /**
   * Post small and big blinds
   */
  private postBlinds(): void {
    const players = this.gameState.players;
    const smallBlindPos = (this.gameState.dealerPosition + 1) % players.length;
    const bigBlindPos = (this.gameState.dealerPosition + 2) % players.length;

    // Post small blind
    const sbPlayer = players[smallBlindPos];
    const sbAmount = Math.min(this.smallBlind, sbPlayer.chipStack);
    sbPlayer.currentBet = sbAmount;
    sbPlayer.chipStack -= sbAmount;
    this.gameState.pot.mainPot += sbAmount;
    this.gameState.pot.totalPot += sbAmount;

    if (sbPlayer.chipStack === 0) {
      sbPlayer.isAllIn = true;
    }

    // Post big blind
    const bbPlayer = players[bigBlindPos];
    const bbAmount = Math.min(this.bigBlind, bbPlayer.chipStack);
    bbPlayer.currentBet = bbAmount;
    bbPlayer.chipStack -= bbAmount;
    this.gameState.pot.mainPot += bbAmount;
    this.gameState.pot.totalPot += bbAmount;

    if (bbPlayer.chipStack === 0) {
      bbPlayer.isAllIn = true;
    }

    // Update chip balances locally
    this.chipBalances.set(sbPlayer.id, sbPlayer.chipStack);
    this.chipBalances.set(bbPlayer.id, bbPlayer.chipStack);
  }

  /**
   * Process a player action
   * @param playerId Player ID
   * @param action Player action
   * @returns GameResult Result of processing the action
   */
  processPlayerAction(
    playerId: string,
    action: PlayerAction
  ): GameResult {
    const player = this.gameState.players.find((p) => p.id === playerId);

    if (!player) {
      return {
        success: false,
        newState: this.gameState,
        error: 'Player not found',
      };
    }

    // Validate action using betting system
    const currentBet = Math.max(...this.gameState.players.map(p => p.currentBet));
    const validation = this.bettingSystem.validateAction(
      player,
      action,
      currentBet,
      this.gameState.players
    );

    if (!validation.valid) {
      return {
        success: false,
        newState: this.gameState,
        error: validation.error,
      };
    }

    // Process the action
    const result = this.bettingSystem.processAction(
      player,
      action,
      this.gameState.players,
      this.gameState.pot
    );

    if (!result.success) {
      return {
        success: false,
        newState: this.gameState,
        error: result.error,
      };
    }

    // Update player state
    player.lastAction = action;
    if (action.type === ActionType.FOLD) {
      player.isActive = false;
    }

    // Update chip balance locally
    this.chipBalances.set(player.id, player.chipStack);

    // Update pot from result
    if (result.pot) {
      this.gameState.pot = result.pot;
    }

    // Check if betting round is complete
    if (this.isBettingRoundComplete()) {
      this.advanceGameStage();
    } else {
      // Move to next active player
      this.moveToNextPlayer();
    }

    return {
      success: true,
      newState: { ...this.gameState },
      message: 'Action processed successfully',
    };
  }

  /**
   * Check if betting round is complete
   * @returns boolean True if betting round is complete
   */
  private isBettingRoundComplete(): boolean {
    const activePlayers = this.gameState.players.filter(
      (p) => p.isActive && !p.isAllIn
    );

    if (activePlayers.length === 0) {
      return true;
    }

    if (activePlayers.length === 1) {
      return true;
    }

    // Check if all active players have acted and bets are equal
    const currentBet = Math.max(
      ...this.gameState.players.map((p) => p.currentBet)
    );

    return activePlayers.every(
      (p) => p.lastAction !== null && p.currentBet === currentBet
    );
  }

  /**
   * Move to next active player
   */
  private moveToNextPlayer(): void {
    const startPlayer = this.gameState.activePlayer;
    let nextPlayer = (this.gameState.activePlayer + 1) % this.gameState.players.length;
    let attempts = 0;

    while (
      (!this.gameState.players[nextPlayer].isActive ||
        this.gameState.players[nextPlayer].isAllIn) &&
      attempts < this.gameState.players.length
    ) {
      nextPlayer = (nextPlayer + 1) % this.gameState.players.length;
      attempts++;
    }

    // If we couldn't find an active player, betting round is complete
    if (attempts >= this.gameState.players.length) {
      this.advanceGameStage();
      return;
    }

    this.gameState.activePlayer = nextPlayer;
  }

  /**
   * Advance to next game stage
   */
  advanceGameStage(): void {
    // Check if only one player remains active (all others folded)
    const activePlayers = this.gameState.players.filter((p) => p.isActive);
    if (activePlayers.length === 1) {
      // Award pot to the last remaining player
      this.gameState.currentStage = GameStage.SHOWDOWN;
      this.determineWinner();
      return;
    }

    // Reset current bets for next round
    this.gameState.players.forEach((p) => {
      p.currentBet = 0;
      p.lastAction = null;
    });

    switch (this.gameState.currentStage) {
      case GameStage.PRE_FLOP:
        this.dealCommunityCards(GameStage.FLOP);
        break;
      case GameStage.FLOP:
        this.dealCommunityCards(GameStage.TURN);
        break;
      case GameStage.TURN:
        this.dealCommunityCards(GameStage.RIVER);
        break;
      case GameStage.RIVER:
        this.gameState.currentStage = GameStage.SHOWDOWN;
        this.determineWinner();
        break;
    }

    // Set active player to first after dealer
    this.gameState.activePlayer =
      (this.gameState.dealerPosition + 1) % this.gameState.players.length;
  }

  /**
   * Determine winner and distribute pot
   * @returns WinnerResult[] Array of winners
   */
  determineWinner(): WinnerResult[] {
    const activePlayers = this.gameState.players.filter((p) => p.isActive);

    if (activePlayers.length === 1) {
      // Only one player left, they win
      const winner = activePlayers[0];
      winner.chipStack += this.gameState.pot.totalPot;
      this.chipBalances.set(winner.id, winner.chipStack);

      return [
        {
          playerId: winner.id,
          amount: this.gameState.pot.totalPot,
          handRank: null,
        },
      ];
    }

    // Evaluate all hands
    const handRankings = activePlayers.map((player) => ({
      player,
      handRank: this.handEvaluator.evaluateHand(
        player.holeCards,
        this.gameState.communityCards
      ),
    }));

    // Sort by hand strength (descending)
    handRankings.sort((a, b) =>
      this.handEvaluator.compareHands(b.handRank, a.handRank)
    );

    // Distribute pot
    const winners: WinnerResult[] = [];
    const winningRank = handRankings[0].handRank;

    // Find all players with winning hand (for split pots)
    const winningPlayers = handRankings.filter(
      (hr) => this.handEvaluator.compareHands(hr.handRank, winningRank) === 0
    );

    const amountPerWinner = Math.floor(
      this.gameState.pot.totalPot / winningPlayers.length
    );

    winningPlayers.forEach((wp) => {
      wp.player.chipStack += amountPerWinner;
      this.chipBalances.set(wp.player.id, wp.player.chipStack);

      winners.push({
        playerId: wp.player.id,
        amount: amountPerWinner,
        handRank: wp.handRank,
      });
    });

    // Add to hand history
    this.gameState.handHistory.push({
      handNumber: this.gameState.handHistory.length + 1,
      winner: winners[0].playerId,
      potSize: this.gameState.pot.totalPot,
      winningHand: winners[0].handRank,
      timestamp: Date.now(),
    });

    return winners;
  }

  /**
   * Get current game state
   * @returns GameState Current game state
   */
  getGameState(): GameState {
    return { ...this.gameState };
  }

  /**
   * Get chip balance for a player (from local storage)
   * @param playerId Player ID
   * @returns number Chip balance
   */
  getChipBalance(playerId: string): number {
    return this.chipBalances.get(playerId) || 0;
  }

  /**
   * Update chip balance for a player (in local storage)
   * @param playerId Player ID
   * @param amount New chip amount
   */
  updateChipBalance(playerId: string, amount: number): void {
    this.chipBalances.set(playerId, amount);

    // Also update in game state
    const player = this.gameState.players.find((p) => p.id === playerId);
    if (player) {
      player.chipStack = amount;
    }
  }

  /**
   * Get all chip balances
   * @returns Map<string, number> All chip balances
   */
  getAllChipBalances(): Map<string, number> {
    return new Map(this.chipBalances);
  }

  /**
   * Set dealer position
   * @param position Dealer position index
   */
  setDealerPosition(position: number): void {
    this.gameState.dealerPosition = position;
  }
}
