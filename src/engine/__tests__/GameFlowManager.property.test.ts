import * as fc from 'fast-check';
import { GameEngine } from '../GameEngine';
import { GameFlowManager } from '../GameFlowManager';
import { Player, Position } from '../../types';

describe('GameFlowManager Property Tests', () => {
  /**
   * Property 11: Game Progression Consistency
   * For any completed hand, a new hand should start automatically with dealer
   * position rotated and new blinds posted
   * Validates: Requirements 7.1, 7.2
   */
  describe('Property 11: Game Progression Consistency', () => {
    it('should rotate dealer position for each new hand', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 8 }),
          fc.integer({ min: 2, max: 10 }),
          (numPlayers, numHands) => {
            const players: Player[] = [];
            for (let i = 0; i < numPlayers; i++) {
              players.push({
                id: `player${i}`,
                name: `Player ${i}`,
                chipStack: 10000,
                holeCards: [],
                currentBet: 0,
                position: Position.EARLY,
                isActive: true,
                isAllIn: false,
                lastAction: null,
                isHuman: false,
              });
            }

            const engine = new GameEngine(players);
            const flowManager = new GameFlowManager(engine);

            const dealerPositions: number[] = [];

            // Play multiple hands
            for (let i = 0; i < numHands; i++) {
              flowManager.startNextHand();
              const state = engine.getGameState();
              dealerPositions.push(state.dealerPosition);
            }

            // Dealer should rotate (positions should be different)
            if (numHands > 1) {
              const uniquePositions = new Set(dealerPositions);
              expect(uniquePositions.size).toBeGreaterThan(1);
            }

            // Each position should be within valid range
            dealerPositions.forEach((pos) => {
              expect(pos).toBeGreaterThanOrEqual(0);
              expect(pos).toBeLessThan(numPlayers);
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should post blinds for each new hand', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }),
          fc.integer({ min: 5, max: 50 }),
          (numPlayers, smallBlind) => {
            const bigBlind = smallBlind * 2;
            const players: Player[] = [];
            for (let i = 0; i < numPlayers; i++) {
              players.push({
                id: `player${i}`,
                name: `Player ${i}`,
                chipStack: 10000,
                holeCards: [],
                currentBet: 0,
                position: Position.EARLY,
                isActive: true,
                isAllIn: false,
                lastAction: null,
                isHuman: false,
              });
            }

            const engine = new GameEngine(players, smallBlind, bigBlind);
            const flowManager = new GameFlowManager(engine);

            flowManager.startNextHand();
            const state = engine.getGameState();

            // Pot should contain blinds
            expect(state.pot.totalPot).toBeGreaterThanOrEqual(
              smallBlind + bigBlind
            );
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 12: Player Elimination Handling
   * For any player with zero chips, they should be marked as eliminated and not
   * participate in future hands
   * Validates: Requirements 7.3
   */
  describe('Property 12: Player Elimination Handling', () => {
    it('should eliminate players with zero chips', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }),
          (numPlayers) => {
            const players: Player[] = [];
            for (let i = 0; i < numPlayers; i++) {
              players.push({
                id: `player${i}`,
                name: `Player ${i}`,
                chipStack: i === 0 ? 0 : 1000, // First player has no chips
                holeCards: [],
                currentBet: 0,
                position: Position.EARLY,
                isActive: true,
                isAllIn: false,
                lastAction: null,
                isHuman: false,
              });
            }

            const engine = new GameEngine(players);
            const flowManager = new GameFlowManager(engine);

            // Handle eliminations
            const eliminated = flowManager.handlePlayerEliminations();

            // First player should be eliminated
            expect(eliminated).toContain('player0');
            expect(flowManager.isPlayerEliminated('player0')).toBe(true);

            // Other players should not be eliminated
            for (let i = 1; i < numPlayers; i++) {
              expect(flowManager.isPlayerEliminated(`player${i}`)).toBe(false);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should not allow eliminated players in new hands', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }),
          (numPlayers) => {
            const players: Player[] = [];
            for (let i = 0; i < numPlayers; i++) {
              players.push({
                id: `player${i}`,
                name: `Player ${i}`,
                chipStack: 1000,
                holeCards: [],
                currentBet: 0,
                position: Position.EARLY,
                isActive: true,
                isAllIn: false,
                lastAction: null,
                isHuman: false,
              });
            }

            const engine = new GameEngine(players);
            const flowManager = new GameFlowManager(engine);

            // Manually set first player to 0 chips
            engine.updateChipBalance('player0', 0);

            // Handle eliminations
            flowManager.handlePlayerEliminations();

            // Start new hand
            flowManager.startNextHand();

            const state = engine.getGameState();
            const eliminatedPlayer = state.players.find(
              (p) => p.id === 'player0'
            );

            // Eliminated player should not be active
            expect(eliminatedPlayer?.isActive).toBe(false);
            expect(eliminatedPlayer?.holeCards.length).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Game Termination Property
   * For any game state, the game should end when only one player has chips
   */
  describe('Game Termination', () => {
    it('should detect game end when only one player has chips', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }),
          (numPlayers) => {
            const players: Player[] = [];
            for (let i = 0; i < numPlayers; i++) {
              players.push({
                id: `player${i}`,
                name: `Player ${i}`,
                chipStack: i === 0 ? 1000 : 0, // Only first player has chips
                holeCards: [],
                currentBet: 0,
                position: Position.EARLY,
                isActive: true,
                isAllIn: false,
                lastAction: null,
                isHuman: false,
              });
            }

            const engine = new GameEngine(players);
            const flowManager = new GameFlowManager(engine);

            // Game should end
            expect(flowManager.shouldGameEnd()).toBe(true);

            // Winner should be the player with chips
            const winner = flowManager.getGameWinner();
            expect(winner).not.toBeNull();
            expect(winner?.id).toBe('player0');
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should not end game when multiple players have chips', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 6 }),
          (numPlayers) => {
            const players: Player[] = [];
            for (let i = 0; i < numPlayers; i++) {
              players.push({
                id: `player${i}`,
                name: `Player ${i}`,
                chipStack: 1000, // All players have chips
                holeCards: [],
                currentBet: 0,
                position: Position.EARLY,
                isActive: true,
                isAllIn: false,
                lastAction: null,
                isHuman: false,
              });
            }

            const engine = new GameEngine(players);
            const flowManager = new GameFlowManager(engine);

            // Game should not end
            expect(flowManager.shouldGameEnd()).toBe(false);

            // No winner yet
            const winner = flowManager.getGameWinner();
            expect(winner).toBeNull();
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Game Statistics Property
   * For any game progression, statistics should accurately reflect the game state
   */
  describe('Game Statistics', () => {
    it('should track game statistics correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 6 }),
          fc.integer({ min: 1, max: 5 }),
          (numPlayers, handsToPlay) => {
            const players: Player[] = [];
            for (let i = 0; i < numPlayers; i++) {
              players.push({
                id: `player${i}`,
                name: `Player ${i}`,
                chipStack: 10000,
                holeCards: [],
                currentBet: 0,
                position: Position.EARLY,
                isActive: true,
                isAllIn: false,
                lastAction: null,
                isHuman: false,
              });
            }

            const engine = new GameEngine(players);
            const flowManager = new GameFlowManager(engine);

            // Play multiple hands
            for (let i = 0; i < handsToPlay; i++) {
              flowManager.startNextHand();
            }

            const stats = flowManager.getGameStats();

            // Verify statistics
            expect(stats.handsPlayed).toBe(handsToPlay);
            expect(stats.totalPlayers).toBe(numPlayers);
            expect(stats.activePlayers).toBeGreaterThan(0);
            expect(stats.activePlayers).toBeLessThanOrEqual(numPlayers);
            expect(stats.eliminatedPlayers).toBeGreaterThanOrEqual(0);
            expect(
              stats.activePlayers + stats.eliminatedPlayers
            ).toBeLessThanOrEqual(numPlayers);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
