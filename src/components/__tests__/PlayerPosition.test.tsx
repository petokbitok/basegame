import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PlayerPosition } from '../PlayerPosition';
import type { Player, ActionType } from '../../types';
import { Suit, Rank, Position } from '../../types';

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

describe('PlayerPosition Component', () => {
  describe('Basic Rendering', () => {
    it('should render player name', () => {
      const player = createMockPlayer({ name: 'Alice' });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('should render formatted chip stack', () => {
      const player = createMockPlayer({ chipStack: 5000 });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.getByText('$5,000')).toBeInTheDocument();
    });

    it('should render two card slots', () => {
      const player = createMockPlayer();
      const { container } = render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      // Card component renders with specific classes
      const cards = container.querySelectorAll('.w-12, .w-14');
      expect(cards.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Dealer Button', () => {
    it('should show dealer button when isDealer is true', () => {
      const player = createMockPlayer();
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={true}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.getByTestId('dealer-button')).toBeInTheDocument();
      expect(screen.getByText('D')).toBeInTheDocument();
    });

    it('should not show dealer button when isDealer is false', () => {
      const player = createMockPlayer();
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.queryByTestId('dealer-button')).not.toBeInTheDocument();
    });
  });

  describe('Active Player Highlighting', () => {
    it('should apply highlight border when isActive is true', () => {
      const player = createMockPlayer();
      render(
        <PlayerPosition
          player={player}
          isActive={true}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      const container = screen.getByTestId('player-position');
      expect(container.className).toContain('ring-2');
      expect(container.className).toContain('ring-yellow-400');
    });

    it('should not apply highlight border when isActive is false', () => {
      const player = createMockPlayer();
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      const container = screen.getByTestId('player-position');
      expect(container.className).not.toContain('ring-4');
    });
  });

  describe('Folded Player Styling', () => {
    it('should gray out position when player.isActive is false', () => {
      const player = createMockPlayer({ isActive: false });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      const container = screen.getByTestId('player-position');
      expect(container.className).toContain('opacity-40');
      expect(container.className).toContain('grayscale');
    });

    it('should not gray out position when player.isActive is true', () => {
      const player = createMockPlayer({ isActive: true });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      const container = screen.getByTestId('player-position');
      expect(container.className).not.toContain('opacity-40');
      expect(container.className).not.toContain('grayscale');
    });
  });

  describe('All-In Badge', () => {
    it('should show all-in badge when player.isAllIn is true', () => {
      const player = createMockPlayer({ isAllIn: true });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.getByTestId('all-in-badge')).toBeInTheDocument();
      expect(screen.getByText('ALL-IN')).toBeInTheDocument();
    });

    it('should not show all-in badge when player.isAllIn is false', () => {
      const player = createMockPlayer({ isAllIn: false });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.queryByTestId('all-in-badge')).not.toBeInTheDocument();
    });
  });

  describe('Last Action Indicator', () => {
    it('should display fold action', () => {
      const player = createMockPlayer({
        lastAction: { type: 'FOLD' as ActionType, playerId: 'player-1' },
      });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.getByTestId('action-indicator')).toBeInTheDocument();
      expect(screen.getByText('Fold')).toBeInTheDocument();
    });

    it('should display check action', () => {
      const player = createMockPlayer({
        lastAction: { type: 'CHECK' as ActionType, playerId: 'player-1' },
      });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.getByText('Check')).toBeInTheDocument();
    });

    it('should display call action with amount', () => {
      const player = createMockPlayer({
        lastAction: {
          type: 'CALL' as ActionType,
          playerId: 'player-1',
          amount: 100,
        },
      });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.getByText('Call $100')).toBeInTheDocument();
    });

    it('should display bet action with amount', () => {
      const player = createMockPlayer({
        lastAction: {
          type: 'BET' as ActionType,
          playerId: 'player-1',
          amount: 250,
        },
      });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.getByText('Bet $250')).toBeInTheDocument();
    });

    it('should display raise action with amount', () => {
      const player = createMockPlayer({
        lastAction: {
          type: 'RAISE' as ActionType,
          playerId: 'player-1',
          amount: 500,
        },
      });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.getByText('Raise $500')).toBeInTheDocument();
    });

    it('should not display action indicator when lastAction is null', () => {
      const player = createMockPlayer({ lastAction: null });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.queryByTestId('action-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Card Visibility', () => {
    it('should render cards face-down for AI players (isHuman=false)', () => {
      const player = createMockPlayer({ isHuman: false });
      const { container } = render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      // Face-down cards have the blue gradient background
      const faceDownCards = container.querySelectorAll('.from-blue-600');
      expect(faceDownCards.length).toBe(2);
    });

    it('should render cards face-up for human player (isHuman=true)', () => {
      const player = createMockPlayer({ isHuman: true });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="bottom"
          isHuman={true}
        />
      );

      // Face-up cards show the rank and suit
      const cards = screen.getAllByTestId('playing-card');
      expect(cards.length).toBe(2);
    });

    it('should render empty card slots when player has no cards', () => {
      const player = createMockPlayer({ holeCards: [] });
      const { container } = render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      // Empty slots have dashed border
      const emptySlots = container.querySelectorAll('.border-dashed');
      expect(emptySlots.length).toBe(2);
    });
  });

  describe('Position Data Attribute', () => {
    it('should set correct position data attribute', () => {
      const player = createMockPlayer();
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top-left"
          isHuman={false}
        />
      );

      const container = screen.getByTestId('player-position');
      expect(container.getAttribute('data-position')).toBe('top-left');
    });
  });

  describe('Large Chip Amounts', () => {
    it('should format large chip amounts with commas', () => {
      const player = createMockPlayer({ chipStack: 123456 });
      render(
        <PlayerPosition
          player={player}
          isActive={false}
          isDealer={false}
          position="top"
          isHuman={false}
        />
      );

      expect(screen.getByText('$123,456')).toBeInTheDocument();
    });
  });
});
