import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PokerTable } from '../PokerTable';
import { Game } from '../../Game';
import type { GameState, Player, PotState } from '../../types';
import { Suit, Rank, Position, GameStage, ActionType } from '../../types';

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
    holeCards: [
      { rank: Rank.ACE, suit: Suit.SPADES },
      { rank: Rank.KING, suit: Suit.HEARTS },
    ],
    currentBet: 0,
    position: Position.DEALER,
    isActive: true,
    isAllIn: false,
    lastAction: null,
    isHuman: false,
    ...overrides,
  };
}

// Helper to create a mock game state
function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  const defaultPot: PotState = {
    mainPot: 100,
    sidePots: [],
    totalPot: 100,
  };

  return {
    players: [
      createMockPlayer({ id: 'human', name: 'You', isHuman: true }),
      createMockPlayer({ id: 'ai1', name: 'AI Player 1', isHuman: false }),
      createMockPlayer({ id: 'ai2', name: 'AI Player 2', isHuman: false }),
      createMockPlayer({ id: 'ai3', name: 'AI Player 3', isHuman: false }),
      createMockPlayer({ id: 'ai4', name: 'AI Player 4', isHuman: false }),
      createMockPlayer({ id: 'ai5', name: 'AI Player 5', isHuman: false }),
    ],
    communityCards: [],
    pot: defaultPot,
    currentStage: GameStage.PRE_FLOP,
    dealerPosition: 0,
    activePlayer: 0,
    bettingRound: 0,
    handHistory: [],
    authenticatedUser: null,
    ...overrides,
  };
}

describe('PokerTable Component', () => {
  let mockGame: Game;

  beforeEach(() => {
    // Create a mock game instance
    mockGame = {
      getGameState: vi.fn(),
      startNewHand: vi.fn(),
      processHumanAction: vi.fn(),
    } as any;

    // Reset the mock
    vi.mocked(useGameState).mockReturnValue({
      gameState: createMockGameState(),
      isPlayerTurn: false,
    });
  });

  describe('Basic Rendering', () => {
    it('should render 6 player positions', () => {
      render(<PokerTable game={mockGame} />);

      // Check for all 6 player positions
      const positions = screen.getAllByTestId(/player-position-\d/);
      expect(positions).toHaveLength(6);
    });

    it('should render poker table felt', () => {
      render(<PokerTable game={mockGame} />);

      const tableFelt = screen.getByTestId('table-felt');
      expect(tableFelt).toBeInTheDocument();
      expect(tableFelt.className).toContain('bg-poker-felt');
    });

    it('should render community cards component', () => {
      render(<PokerTable game={mockGame} />);

      const communityCards = screen.getByTestId('community-cards');
      expect(communityCards).toBeInTheDocument();
    });

    it('should render pot display', () => {
      render(<PokerTable game={mockGame} />);

      // PotDisplay shows the pot amount
      expect(screen.getByText('$100')).toBeInTheDocument();
    });

    it('should render game stage indicator', () => {
      render(<PokerTable game={mockGame} />);

      // GameStageIndicator shows the current stage
      expect(screen.getByText('Pre-Flop')).toBeInTheDocument();
    });
  });

  describe('Player Positioning', () => {
    it('should place human player at bottom center', () => {
      render(<PokerTable game={mockGame} />);

      const humanPosition = screen.getByTestId('player-position-0');
      expect(humanPosition.getAttribute('data-player-type')).toBe('human');
      expect(humanPosition.className).toContain('bottom-4');
      expect(humanPosition.className).toContain('left-1/2');
    });

    it('should distribute AI players around the table', () => {
      render(<PokerTable game={mockGame} />);

      // Check that AI players are positioned correctly
      const ai1Position = screen.getByTestId('player-position-1');
      expect(ai1Position.getAttribute('data-player-type')).toBe('ai');
      expect(ai1Position.className).toContain('bottom-1/4');

      const ai2Position = screen.getByTestId('player-position-2');
      expect(ai2Position.getAttribute('data-player-type')).toBe('ai');
      expect(ai2Position.className).toContain('top-1/3');

      const ai3Position = screen.getByTestId('player-position-3');
      expect(ai3Position.getAttribute('data-player-type')).toBe('ai');
      expect(ai3Position.className).toContain('top-4');
    });
  });

  describe('Dealer Button Positioning', () => {
    it('should show dealer button at correct position', () => {
      const gameState = createMockGameState({ dealerPosition: 2 });
      vi.mocked(useGameState).mockReturnValue({
        gameState,
        isPlayerTurn: false,
      });

      render(<PokerTable game={mockGame} />);

      // The dealer button should be visible
      const dealerButton = screen.getByTestId('dealer-button');
      expect(dealerButton).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass game state to child components', () => {
      const gameState = createMockGameState({
        communityCards: [
          { rank: Rank.ACE, suit: Suit.SPADES },
          { rank: Rank.KING, suit: Suit.HEARTS },
          { rank: Rank.QUEEN, suit: Suit.DIAMONDS },
        ],
        currentStage: GameStage.FLOP,
        pot: { mainPot: 500, sidePots: [], totalPot: 500 },
      });

      vi.mocked(useGameState).mockReturnValue({
        gameState,
        isPlayerTurn: false,
      });

      render(<PokerTable game={mockGame} />);

      // Check that pot is displayed correctly
      expect(screen.getByText('$500')).toBeInTheDocument();

      // Check that stage is displayed correctly
      expect(screen.getByText('Flop')).toBeInTheDocument();
    });
  });

  describe('Responsive Styling', () => {
    it('should apply responsive classes to table container', () => {
      render(<PokerTable game={mockGame} />);

      const container = screen.getByTestId('poker-table');
      expect(container.className).toContain('max-w-6xl');
      expect(container.className).toContain('mx-auto');
    });

    it('should apply responsive padding to table felt', () => {
      render(<PokerTable game={mockGame} />);

      const tableFelt = screen.getByTestId('table-felt');
      // Check for responsive padding classes
      expect(tableFelt.className).toMatch(/p-\d+/);
      expect(tableFelt.className).toMatch(/md:p-\d+/);
    });

    it('should apply responsive border to table felt', () => {
      render(<PokerTable game={mockGame} />);

      const tableFelt = screen.getByTestId('table-felt');
      // Check for responsive border classes
      expect(tableFelt.className).toMatch(/border-\d+/);
      expect(tableFelt.className).toMatch(/md:border-\d+/);
    });
  });

  describe('Loading State', () => {
    it('should show loading message when game state is null', () => {
      vi.mocked(useGameState).mockReturnValue({
        gameState: null,
        isPlayerTurn: false,
      });

      render(<PokerTable game={mockGame} />);

      expect(screen.getByText('Loading game...')).toBeInTheDocument();
    });
  });

  describe('Betting Controls', () => {
    it('should show betting controls when it is player turn', () => {
      const gameState = createMockGameState({ activePlayer: 0 });
      vi.mocked(useGameState).mockReturnValue({
        gameState,
        isPlayerTurn: true,
      });

      render(<PokerTable game={mockGame} />);

      // Check for betting buttons
      expect(screen.getByText('Fold')).toBeInTheDocument();
      expect(screen.getByText('Check')).toBeInTheDocument();
    });

    it('should not show betting controls when it is not player turn', () => {
      const gameState = createMockGameState({ activePlayer: 1 });
      vi.mocked(useGameState).mockReturnValue({
        gameState,
        isPlayerTurn: false,
      });

      render(<PokerTable game={mockGame} />);

      // Betting buttons should not be present
      expect(screen.queryByText('Fold')).not.toBeInTheDocument();
      expect(screen.queryByText('Check')).not.toBeInTheDocument();
    });
  });

  describe('Start Hand Button', () => {
    it('should show start hand button at showdown', () => {
      const gameState = createMockGameState({ currentStage: GameStage.SHOWDOWN });
      vi.mocked(useGameState).mockReturnValue({
        gameState,
        isPlayerTurn: false,
      });

      render(<PokerTable game={mockGame} />);

      expect(screen.getByText('Start New Hand')).toBeInTheDocument();
    });

    it('should not show start hand button during active play', () => {
      const gameState = createMockGameState({ currentStage: GameStage.FLOP });
      vi.mocked(useGameState).mockReturnValue({
        gameState,
        isPlayerTurn: false,
      });

      render(<PokerTable game={mockGame} />);

      expect(screen.queryByText('Start New Hand')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Responsive Layout', () => {
    it('should apply mobile-friendly classes to betting controls', () => {
      const gameState = createMockGameState({ activePlayer: 0 });
      vi.mocked(useGameState).mockReturnValue({
        gameState,
        isPlayerTurn: true,
      });

      const { container } = render(<PokerTable game={mockGame} />);

      // Check for responsive flex classes on the inner flex container
      const bettingControlsContainer = container.querySelector('.bg-gray-900');
      expect(bettingControlsContainer).toBeInTheDocument();
      
      // The inner div has the responsive flex classes
      const flexContainer = bettingControlsContainer?.querySelector('.flex');
      expect(flexContainer?.className).toContain('flex-col');
      expect(flexContainer?.className).toContain('sm:flex-row');
    });
  });
});
