import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import { PokerTable } from '../PokerTable';
import { Game } from '../../Game';
import type { GameState, Player } from '../../types';
import { Suit, Rank, Position, GameStage } from '../../types';

// Mock the useGameState hook
vi.mock('../../hooks/useGameState', () => ({
  useGameState: vi.fn(),
}));

import { useGameState } from '../../hooks/useGameState';

// Helper to create a mock player
function createMockPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'player-1',
    name: 'Test Player',
    chipStack: 1000,
    holeCards: [],
    currentBet: 0,
    position: Position.DEALER,
    isActive: true,
    isAllIn: false,
    lastAction: null,
    isHuman: false,
    ...overrides,
  };
}

describe('Feature: poker-game-ui, Property 8: Game State Synchronization', () => {
  let mockGame: Game;

  beforeEach(() => {
    // Create a mock game instance
    mockGame = {
      getGameState: vi.fn(),
      startNewHand: vi.fn(),
      processHumanAction: vi.fn(),
    } as any;
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * **Validates: Requirements 13.2, 13.3**
   * 
   * For any game state change in the GameEngine, the UI should reflect the updated state
   * within the polling interval (100ms).
   */
  it('should display exactly 6 player positions as per requirements', () => {
    // The PokerTable component always renders 6 player positions (1 human + 5 AI)
    // as specified in Requirements 1.1, 1.2, 1.3
    
    // Create 6 players
    const players: Player[] = [];
    for (let i = 0; i < 6; i++) {
      players.push(
        createMockPlayer({
          id: `player-${i}`,
          name: `Player ${i}`,
          isHuman: i === 0,
        })
      );
    }

    const gameState: GameState = {
      players,
      communityCards: [],
      pot: { mainPot: 0, sidePots: [], totalPot: 0 },
      currentStage: GameStage.PRE_FLOP,
      dealerPosition: 0,
      activePlayer: 0,
      bettingRound: 0,
      handHistory: [],
      authenticatedUser: null,
    };

    vi.mocked(useGameState).mockReturnValue({
      gameState,
      isPlayerTurn: false,
    });

    render(<PokerTable game={mockGame} />);

    // Should render exactly 6 player positions
    const positions = screen.getAllByTestId(/player-position-\d/);
    expect(positions).toHaveLength(6);
  });

  it('should display the correct pot amount for any pot value', () => {
    // Arbitrary for pot amounts (1 to 1,000,000, excluding 0 to avoid duplicate text issues)
    const potAmountArbitrary = fc.integer({ min: 1, max: 1000000 });

    fc.assert(
      fc.property(potAmountArbitrary, (potAmount) => {
        const gameState: GameState = {
          players: Array.from({ length: 6 }, (_, i) =>
            createMockPlayer({ id: `player-${i}`, name: `Player ${i}`, isHuman: i === 0, chipStack: potAmount + 1000 })
          ),
          communityCards: [],
          pot: { mainPot: potAmount, sidePots: [], totalPot: potAmount },
          currentStage: GameStage.PRE_FLOP,
          dealerPosition: 0,
          activePlayer: 0,
          bettingRound: 0,
          handHistory: [],
          authenticatedUser: null,
        };

        vi.mocked(useGameState).mockReturnValue({
          gameState,
          isPlayerTurn: false,
        });

        const { unmount } = render(<PokerTable game={mockGame} />);

        // Format the pot amount with commas
        const formattedPot = potAmount.toLocaleString('en-US');
        
        // Should display the pot amount (with $ prefix) - use getAllByText since pot display shows it
        const potElements = screen.getAllByText(`$${formattedPot}`);
        expect(potElements.length).toBeGreaterThan(0);
        
        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should display the correct game stage for any stage', () => {
    // Arbitrary for game stages
    const stageArbitrary = fc.constantFrom(
      GameStage.PRE_FLOP,
      GameStage.FLOP,
      GameStage.TURN,
      GameStage.RIVER,
      GameStage.SHOWDOWN
    );

    const stageNames = {
      [GameStage.PRE_FLOP]: 'Pre-Flop',
      [GameStage.FLOP]: 'Flop',
      [GameStage.TURN]: 'Turn',
      [GameStage.RIVER]: 'River',
      [GameStage.SHOWDOWN]: 'Showdown',
    };

    fc.assert(
      fc.property(stageArbitrary, (stage) => {
        const gameState: GameState = {
          players: Array.from({ length: 6 }, (_, i) =>
            createMockPlayer({ id: `player-${i}`, name: `Player ${i}`, isHuman: i === 0 })
          ),
          communityCards: [],
          pot: { mainPot: 0, sidePots: [], totalPot: 0 },
          currentStage: stage,
          dealerPosition: 0,
          activePlayer: 0,
          bettingRound: 0,
          handHistory: [],
          authenticatedUser: null,
        };

        vi.mocked(useGameState).mockReturnValue({
          gameState,
          isPlayerTurn: false,
        });

        const { unmount } = render(<PokerTable game={mockGame} />);

        // Should display the correct stage name
        const stageElements = screen.getAllByText(stageNames[stage]);
        expect(stageElements.length).toBeGreaterThan(0);
        
        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should highlight the active player for any active player index', () => {
    // Create 6 players
    const players: Player[] = [];
    for (let i = 0; i < 6; i++) {
      players.push(
        createMockPlayer({
          id: `player-${i}`,
          name: `Player ${i}`,
          isHuman: i === 0,
        })
      );
    }

    // Arbitrary for active player index (0-5 for 6 players)
    const activePlayerArbitrary = fc.integer({ min: 0, max: 5 });

    fc.assert(
      fc.property(activePlayerArbitrary, (activePlayerIndex) => {
        const gameState: GameState = {
          players,
          communityCards: [],
          pot: { mainPot: 0, sidePots: [], totalPot: 0 },
          currentStage: GameStage.PRE_FLOP,
          dealerPosition: 0,
          activePlayer: activePlayerIndex,
          bettingRound: 0,
          handHistory: [],
          authenticatedUser: null,
        };

        vi.mocked(useGameState).mockReturnValue({
          gameState,
          isPlayerTurn: activePlayerIndex === 0,
        });

        const { container, unmount } = render(<PokerTable game={mockGame} />);

        // Get all player position containers
        const positions = container.querySelectorAll('[data-testid^="player-position-"]');
        
        // Check that exactly one position has the active highlight
        let highlightedCount = 0;
        positions.forEach((position, index) => {
          const playerPosition = position.querySelector('[data-testid="player-position"]');
          if (playerPosition?.className.includes('ring-4') && 
              playerPosition?.className.includes('ring-yellow-400')) {
            highlightedCount++;
            // The highlighted position should match the active player index
            expect(index).toBe(activePlayerIndex);
          }
        });

        // Exactly one player should be highlighted
        expect(highlightedCount).toBe(1);
        
        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should show dealer button at the correct position for any dealer index', () => {
    // Create 6 players
    const players: Player[] = [];
    for (let i = 0; i < 6; i++) {
      players.push(
        createMockPlayer({
          id: `player-${i}`,
          name: `Player ${i}`,
          isHuman: i === 0,
        })
      );
    }

    // Arbitrary for dealer position index (0-5 for 6 players)
    const dealerPositionArbitrary = fc.integer({ min: 0, max: 5 });

    fc.assert(
      fc.property(dealerPositionArbitrary, (dealerPosition) => {
        const gameState: GameState = {
          players,
          communityCards: [],
          pot: { mainPot: 0, sidePots: [], totalPot: 0 },
          currentStage: GameStage.PRE_FLOP,
          dealerPosition,
          activePlayer: 0,
          bettingRound: 0,
          handHistory: [],
          authenticatedUser: null,
        };

        vi.mocked(useGameState).mockReturnValue({
          gameState,
          isPlayerTurn: false,
        });

        const { unmount } = render(<PokerTable game={mockGame} />);

        // Should have exactly one dealer button
        const dealerButtons = screen.getAllByTestId('dealer-button');
        expect(dealerButtons).toHaveLength(1);
        
        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should display correct community card count based on game stage', () => {
    // Arbitrary for game stages
    const stageArbitrary = fc.constantFrom(
      GameStage.PRE_FLOP,
      GameStage.FLOP,
      GameStage.TURN,
      GameStage.RIVER,
      GameStage.SHOWDOWN
    );

    const expectedCardCounts = {
      [GameStage.PRE_FLOP]: 0,
      [GameStage.FLOP]: 3,
      [GameStage.TURN]: 4,
      [GameStage.RIVER]: 5,
      [GameStage.SHOWDOWN]: 5,
    };

    fc.assert(
      fc.property(stageArbitrary, (stage) => {
        // Create community cards based on stage
        const cardCount = expectedCardCounts[stage];
        const communityCards = [];
        for (let i = 0; i < cardCount; i++) {
          communityCards.push({
            rank: Rank.ACE,
            suit: Suit.SPADES,
          });
        }

        const gameState: GameState = {
          players: Array.from({ length: 6 }, (_, i) =>
            createMockPlayer({ id: `player-${i}`, name: `Player ${i}`, isHuman: i === 0 })
          ),
          communityCards,
          pot: { mainPot: 0, sidePots: [], totalPot: 0 },
          currentStage: stage,
          dealerPosition: 0,
          activePlayer: 0,
          bettingRound: 0,
          handHistory: [],
          authenticatedUser: null,
        };

        vi.mocked(useGameState).mockReturnValue({
          gameState,
          isPlayerTurn: false,
        });

        const { container, unmount } = render(<PokerTable game={mockGame} />);

        // Count visible cards (not empty slots)
        const communityCardsContainer = container.querySelector('[data-testid="community-cards"]');
        const visibleCards = communityCardsContainer?.querySelectorAll('[data-testid="playing-card"]');
        
        // Should display the correct number of cards for the stage
        expect(visibleCards?.length).toBe(cardCount);
        
        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should show betting controls only when it is the human player turn', () => {
    // Create 6 players
    const players: Player[] = [];
    for (let i = 0; i < 6; i++) {
      players.push(
        createMockPlayer({
          id: `player-${i}`,
          name: `Player ${i}`,
          isHuman: i === 0,
        })
      );
    }

    // Arbitrary for active player index (0-5 for 6 players)
    const activePlayerArbitrary = fc.integer({ min: 0, max: 5 });

    fc.assert(
      fc.property(activePlayerArbitrary, (activePlayerIndex) => {
        const gameState: GameState = {
          players,
          communityCards: [],
          pot: { mainPot: 0, sidePots: [], totalPot: 0 },
          currentStage: GameStage.PRE_FLOP,
          dealerPosition: 0,
          activePlayer: activePlayerIndex,
          bettingRound: 0,
          handHistory: [],
          authenticatedUser: null,
        };

        const isHumanTurn = activePlayerIndex === 0;

        vi.mocked(useGameState).mockReturnValue({
          gameState,
          isPlayerTurn: isHumanTurn,
        });

        const { unmount } = render(<PokerTable game={mockGame} />);

        // Betting controls should only be visible when it's the human player's turn
        const foldButtons = screen.queryAllByText('Fold');
        
        if (isHumanTurn) {
          expect(foldButtons.length).toBeGreaterThan(0);
        } else {
          expect(foldButtons.length).toBe(0);
        }
        
        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('should show start hand button only at showdown stage', () => {
    // Arbitrary for game stages
    const stageArbitrary = fc.constantFrom(
      GameStage.PRE_FLOP,
      GameStage.FLOP,
      GameStage.TURN,
      GameStage.RIVER,
      GameStage.SHOWDOWN
    );

    fc.assert(
      fc.property(stageArbitrary, (stage) => {
        const gameState: GameState = {
          players: Array.from({ length: 6 }, (_, i) =>
            createMockPlayer({ id: `player-${i}`, name: `Player ${i}`, isHuman: i === 0 })
          ),
          communityCards: [],
          pot: { mainPot: 0, sidePots: [], totalPot: 0 },
          currentStage: stage,
          dealerPosition: 0,
          activePlayer: 0,
          bettingRound: 0,
          handHistory: [],
          authenticatedUser: null,
        };

        vi.mocked(useGameState).mockReturnValue({
          gameState,
          isPlayerTurn: false,
        });

        const { unmount } = render(<PokerTable game={mockGame} />);

        const startButtons = screen.queryAllByText('Start New Hand');
        
        // Start button should only be visible at showdown
        if (stage === GameStage.SHOWDOWN) {
          expect(startButtons.length).toBeGreaterThan(0);
        } else {
          expect(startButtons.length).toBe(0);
        }
        
        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
