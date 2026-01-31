import { GameEngine } from './GameEngine';
import { Player, Position } from '../types';

/**
 * Game flow manager for automatic hand progression and player management
 * Handles dealer rotation, player elimination, and game termination
 */
export class GameFlowManager {
  private engine: GameEngine;
  private handCount: number = 0;
  private eliminatedPlayers: Set<string> = new Set();

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Start a new hand with automatic dealer rotation
   * Rotates dealer position and posts blinds
   */
  startNextHand(): void {
    const state = this.engine.getGameState();

    // Rotate dealer position
    let nextDealer = (state.dealerPosition + 1) % state.players.length;

    // Find next active player for dealer
    let attempts = 0;
    while (
      state.players[nextDealer].chipStack === 0 &&
      attempts < state.players.length
    ) {
      nextDealer = (nextDealer + 1) % state.players.length;
      attempts++;
    }

    // Update dealer position in state
    state.dealerPosition = nextDealer;

    // Update positions for all players
    this.updatePlayerPositions(state.players, nextDealer);

    // Start new hand
    this.engine.startNewHand();
    this.handCount++;
  }

  /**
   * Update player positions based on dealer position
   * @param players Array of players
   * @param dealerPos Dealer position index
   */
  private updatePlayerPositions(players: Player[], dealerPos: number): void {
    const numPlayers = players.length;

    players.forEach((player, index) => {
      const relativePos = (index - dealerPos + numPlayers) % numPlayers;

      if (relativePos === 0) {
        player.position = Position.DEALER;
      } else if (relativePos === 1) {
        player.position = Position.SMALL_BLIND;
      } else if (relativePos === 2) {
        player.position = Position.BIG_BLIND;
      } else if (relativePos <= 4) {
        player.position = Position.EARLY;
      } else if (relativePos <= 6) {
        player.position = Position.MIDDLE;
      } else {
        player.position = Position.LATE;
      }
    });
  }

  /**
   * Check and handle player eliminations
   * Marks players with 0 chips as eliminated
   * @returns string[] Array of eliminated player IDs
   */
  handlePlayerEliminations(): string[] {
    const state = this.engine.getGameState();
    const newlyEliminated: string[] = [];

    state.players.forEach((player) => {
      if (player.chipStack === 0 && !this.eliminatedPlayers.has(player.id)) {
        this.eliminatedPlayers.add(player.id);
        newlyEliminated.push(player.id);
        player.isActive = false;
      }
    });

    return newlyEliminated;
  }

  /**
   * Check if game should terminate
   * Game ends when only one player has chips remaining
   * @returns boolean True if game should end
   */
  shouldGameEnd(): boolean {
    const state = this.engine.getGameState();
    const playersWithChips = state.players.filter((p) => p.chipStack > 0);

    return playersWithChips.length <= 1;
  }

  /**
   * Get the winner of the game (last player with chips)
   * @returns Player | null Winner or null if game not ended
   */
  getGameWinner(): Player | null {
    if (!this.shouldGameEnd()) {
      return null;
    }

    const state = this.engine.getGameState();
    const playersWithChips = state.players.filter((p) => p.chipStack > 0);

    return playersWithChips.length === 1 ? playersWithChips[0] : null;
  }

  /**
   * Get number of hands played
   * @returns number Hand count
   */
  getHandCount(): number {
    return this.handCount;
  }

  /**
   * Get list of eliminated players
   * @returns string[] Array of eliminated player IDs
   */
  getEliminatedPlayers(): string[] {
    return Array.from(this.eliminatedPlayers);
  }

  /**
   * Get number of active players (with chips)
   * @returns number Active player count
   */
  getActivePlayerCount(): number {
    const state = this.engine.getGameState();
    return state.players.filter((p) => p.chipStack > 0).length;
  }

  /**
   * Reset game flow manager for a new game
   */
  reset(): void {
    this.handCount = 0;
    this.eliminatedPlayers.clear();
  }

  /**
   * Check if a specific player is eliminated
   * @param playerId Player ID
   * @returns boolean True if player is eliminated
   */
  isPlayerEliminated(playerId: string): boolean {
    return this.eliminatedPlayers.has(playerId);
  }

  /**
   * Get game statistics
   * @returns Object with game statistics
   */
  getGameStats(): {
    handsPlayed: number;
    activePlayers: number;
    eliminatedPlayers: number;
    totalPlayers: number;
  } {
    const state = this.engine.getGameState();

    return {
      handsPlayed: this.handCount,
      activePlayers: this.getActivePlayerCount(),
      eliminatedPlayers: this.eliminatedPlayers.size,
      totalPlayers: state.players.length,
    };
  }
}
