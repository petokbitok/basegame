import * as fc from 'fast-check';
import { GameEngine } from '../GameEngine';
import { Player, Position, ActionType, GameStage } from '../../types';

describe('GameEngine Property Tests', () => {
  /**
   * Property 1: New Hand Initialization
   * For any game state, when a new hand begins, each active player should receive
   * exactly 2 hole cards and blinds should be posted correctly
   * Validates: Requirements 1.2
   */
  describe('Property 1: New Hand Initialization', () => {
    it('should deal exactly 2 hole cards to each active player', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }),
          fc.integer({ min: 100, max: 1000 }),
          (numPlayers, startingChips) => {
            const players: Player[] = [];
            for (let i = 0; i < numPlayers; i++) {
              players.push({
                id: `player${i}`,
                name: `Player ${i}`,
                chipStack: startingChips,
                holeCards: [],
                currentBet: 0,
                position: Position.EARLY,
                isActive: true,
                isAllIn: false,
                lastAction: null,
                isHuman: i === 0,
              });
            }

            const engine = new GameEngine(players, 10, 20);
            engine.startNewHand();

            const state = engine.getGameState();

            // Each active player should have exactly 2 hole cards
            state.players.forEach((player) => {
              if (player.isActive) {
                expect(player.holeCards.length).toBe(2);
              }
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should post blinds correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 8 }),
          fc.integer({ min: 100, max: 1000 }),
          fc.integer({ min: 5, max: 50 }),
          (numPlayers, startingChips, smallBlind) => {
            const bigBlind = smallBlind * 2;
            const players: Player[] = [];
            for (let i = 0; i < numPlayers; i++) {
              players.push({
                id: `player${i}`,
                name: `Player ${i}`,
                chipStack: startingChips,
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
            engine.startNewHand();

            const state = engine.getGameState();

            // Pot should contain at least small blind + big blind
            expect(state.pot.totalPot).toBeGreaterThanOrEqual(
              smallBlind + bigBlind
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 2: Community Card Dealing Sequence
   * For any game stage transition, community cards should be dealt in the correct
   * sequence (3 for flop, 1 for turn, 1 for river)
   * Validates: Requirements 1.3
   */
  describe('Property 2: Community Card Dealing Sequence', () => {
    it('should deal 3 cards on flop', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 6 }),
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
            engine.startNewHand();

            // Manually advance to flop
            const state = engine.getGameState();
            expect(state.communityCards.length).toBe(0);

            // Deal flop
            engine.advanceGameStage();
            const flopState = engine.getGameState();

            expect(flopState.communityCards.length).toBe(3);
            expect(flopState.currentStage).toBe(GameStage.FLOP);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should deal 1 card on turn and river', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 6 }),
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
            engine.startNewHand();

            // Advance to flop
            engine.advanceGameStage();
            const flopState = engine.getGameState();
            expect(flopState.communityCards.length).toBe(3);

            // Advance to turn
            engine.advanceGameStage();
            const turnState = engine.getGameState();
            expect(turnState.communityCards.length).toBe(4);
            expect(turnState.currentStage).toBe(GameStage.TURN);

            // Advance to river
            engine.advanceGameStage();
            const riverState = engine.getGameState();
            expect(riverState.communityCards.length).toBe(5);
            expect(riverState.currentStage).toBe(GameStage.RIVER);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 5: Pot Distribution Accuracy
   * For any completed hand, the total pot should be distributed exactly to the
   * winner(s) with no chips lost or created
   * Validates: Requirements 1.6, 2.4
   */
  describe('Property 5: Pot Distribution Accuracy', () => {
    it('should distribute pot without losing or creating chips', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 6 }),
          fc.integer({ min: 500, max: 2000 }),
          (numPlayers, startingChips) => {
            const players: Player[] = [];
            for (let i = 0; i < numPlayers; i++) {
              players.push({
                id: `player${i}`,
                name: `Player ${i}`,
                chipStack: startingChips,
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
            const totalChipsBefore = players.reduce(
              (sum, p) => sum + p.chipStack,
              0
            );

            engine.startNewHand();

            // Simulate all players folding except one
            const state = engine.getGameState();
            const activePlayers = state.players.filter((p) => p.isActive);

            // All but one player folds
            for (let i = 1; i < activePlayers.length; i++) {
              engine.processPlayerAction(activePlayers[i].id, {
                type: ActionType.FOLD,
                playerId: activePlayers[i].id,
              });
            }

            const finalState = engine.getGameState();
            const totalChipsAfter = finalState.players.reduce(
              (sum, p) => sum + p.chipStack,
              0
            );

            // Total chips should remain constant (conservation of chips)
            // Pot should be distributed, so we don't add it
            expect(totalChipsAfter).toBe(totalChipsBefore);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 13: Early Pot Award
   * For any betting round where all players except one fold, the remaining player
   * should be awarded the pot immediately without showdown
   * Validates: Requirements 7.5
   */
  describe('Property 13: Early Pot Award', () => {
    it('should award pot immediately when all but one player folds', () => {
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
            engine.startNewHand();

            const stateBefore = engine.getGameState();
            const potBefore = stateBefore.pot.totalPot;
            const firstPlayer = stateBefore.players.find((p) => p.isActive)!;
            const chipsBefore = firstPlayer.chipStack;

            // All players except first one fold
            const activePlayers = stateBefore.players.filter((p) => p.isActive);
            for (let i = 1; i < activePlayers.length; i++) {
              engine.processPlayerAction(activePlayers[i].id, {
                type: ActionType.FOLD,
                playerId: activePlayers[i].id,
              });
            }

            const stateAfter = engine.getGameState();
            const firstPlayerAfter = stateAfter.players.find(
              (p) => p.id === firstPlayer.id
            )!;

            // Winner should have received the pot
            expect(firstPlayerAfter.chipStack).toBeGreaterThan(chipsBefore);

            // Only one player should be active
            const activeCount = stateAfter.players.filter(
              (p) => p.isActive
            ).length;
            expect(activeCount).toBe(1);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 32: Chip Balance Local Storage
   * For any player, chip balances should be stored and retrieved from local memory
   * only, never from blockchain
   * Validates: Requirements 11.8
   */
  describe('Property 32: Chip Balance Local Storage', () => {
    it('should store and retrieve chip balances locally', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              chips: fc.integer({ min: 100, max: 5000 }),
            }),
            { minLength: 2, maxLength: 8 }
          ),
          (playerData) => {
            // Filter out duplicate IDs
            const uniquePlayerData = playerData.filter((pd, index, self) =>
              index === self.findIndex((p) => p.id === pd.id)
            );
            
            // Skip if we don't have at least 2 unique players
            if (uniquePlayerData.length < 2) {
              return true;
            }
            
            const players: Player[] = uniquePlayerData.map((pd, i) => ({
              id: pd.id,
              name: `Player ${i}`,
              chipStack: pd.chips,
              holeCards: [],
              currentBet: 0,
              position: Position.EARLY,
              isActive: true,
              isAllIn: false,
              lastAction: null,
              isHuman: false,
            }));

            const engine = new GameEngine(players);

            // Check that all chip balances are stored locally
            players.forEach((player) => {
              const balance = engine.getChipBalance(player.id);
              expect(balance).toBe(player.chipStack);
            });

            // Update a chip balance
            const firstPlayer = players[0];
            const newBalance = firstPlayer.chipStack + 500;
            engine.updateChipBalance(firstPlayer.id, newBalance);

            // Verify it was updated locally
            const updatedBalance = engine.getChipBalance(firstPlayer.id);
            expect(updatedBalance).toBe(newBalance);

            // Get all balances
            const allBalances = engine.getAllChipBalances();
            expect(allBalances.size).toBe(players.length);
            expect(allBalances.get(firstPlayer.id)).toBe(newBalance);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Card Uniqueness Property
   * For any hand, no card should appear more than once across all players' hole
   * cards and community cards
   */
  describe('Card Uniqueness', () => {
    it('should never deal duplicate cards in a single hand', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 8 }),
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
            engine.startNewHand();

            // Advance through all stages to deal all cards
            engine.advanceGameStage(); // Flop
            engine.advanceGameStage(); // Turn
            engine.advanceGameStage(); // River

            const state = engine.getGameState();

            // Collect all dealt cards
            const allCards: string[] = [];

            // Add hole cards
            state.players.forEach((player) => {
              player.holeCards.forEach((card) => {
                allCards.push(`${card.rank}-${card.suit}`);
              });
            });

            // Add community cards
            state.communityCards.forEach((card) => {
              allCards.push(`${card.rank}-${card.suit}`);
            });

            // Check for duplicates
            const uniqueCards = new Set(allCards);
            expect(uniqueCards.size).toBe(allCards.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
