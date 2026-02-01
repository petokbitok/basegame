import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BettingControls } from '../BettingControls';
import { GameStage, Position, ActionType } from '../../types';
import type { Player, GameState } from '../../types';

/**
 * Unit tests for BettingControls component
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.6, 4.7**
 * 
 * These tests verify specific examples and edge cases for betting controls:
 * - Button visibility with no bet
 * - Button visibility with existing bet
 * - Button click handlers
 * - Disabled state
 * - Slider constraints
 */
describe('BettingControls Component - Unit Tests', () => {
  const createMockPlayer = (overrides?: Partial<Player>): Player => ({
    id: 'human',
    name: 'You',
    chipStack: 1000,
    holeCards: [],
    currentBet: 0,
    position: Position.DEALER,
    isActive: true,
    isAllIn: false,
    lastAction: null,
    isHuman: true,
    ...overrides,
  });

  const createMockGameState = (overrides?: Partial<GameState>): GameState => ({
    players: [
      createMockPlayer(),
      createMockPlayer({ id: 'ai1', name: 'AI 1', isHuman: false }),
    ],
    communityCards: [],
    pot: { mainPot: 0, sidePots: [], totalPot: 0 },
    currentStage: GameStage.PRE_FLOP,
    dealerPosition: 0,
    activePlayer: 0,
    bettingRound: 0,
    handHistory: [],
    authenticatedUser: null,
    ...overrides,
  });

  describe('Button visibility with no bet', () => {
    it('should show Check and Bet buttons when no bet exists', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      // Should show Check button
      expect(screen.getByTestId('check-button')).toBeTruthy();
      expect(screen.getByText('Check')).toBeTruthy();

      // Should show Bet button
      expect(screen.getByTestId('bet-button')).toBeTruthy();
      expect(screen.getByText(/^Bet/)).toBeTruthy();

      // Should show Fold button (always available)
      expect(screen.getByTestId('fold-button')).toBeTruthy();
      expect(screen.getByText('Fold')).toBeTruthy();

      // Should NOT show Call or Raise buttons
      expect(screen.queryByTestId('call-button')).toBeFalsy();
      expect(screen.queryByTestId('raise-button')).toBeFalsy();
    });

    it('should show bet slider when no bet exists', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      // Should show bet slider
      expect(screen.getByTestId('bet-slider')).toBeTruthy();
    });
  });

  describe('Button visibility with existing bet', () => {
    it('should show Call and Raise buttons when bet exists', () => {
      const player = createMockPlayer({ currentBet: 0 });
      const gameState = createMockGameState({
        players: [
          createMockPlayer({ currentBet: 0 }),
          createMockPlayer({ id: 'ai1', name: 'AI 1', isHuman: false, currentBet: 100 }),
        ],
      });
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      // Should show Call button
      expect(screen.getByTestId('call-button')).toBeTruthy();
      const callButton = screen.getByTestId('call-button');
      expect(callButton.textContent).toContain('Call');

      // Should show Raise button
      expect(screen.getByTestId('raise-button')).toBeTruthy();
      const raiseButton = screen.getByTestId('raise-button');
      expect(raiseButton.textContent).toContain('Raise');

      // Should show Fold button (always available)
      expect(screen.getByTestId('fold-button')).toBeTruthy();

      // Should NOT show Check or Bet buttons
      expect(screen.queryByTestId('check-button')).toBeFalsy();
      expect(screen.queryByTestId('bet-button')).toBeFalsy();
    });

    it('should display call amount when bet exists', () => {
      const player = createMockPlayer({ currentBet: 0 });
      const gameState = createMockGameState({
        players: [
          createMockPlayer({ currentBet: 0 }),
          createMockPlayer({ id: 'ai1', name: 'AI 1', isHuman: false, currentBet: 100 }),
        ],
      });
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      // Should display call amount
      expect(screen.getByText(/Call Amount:/)).toBeTruthy();
      const callAmountDisplay = screen.getByText(/Call Amount:/).parentElement;
      expect(callAmountDisplay?.textContent).toContain('$100');
    });

    it('should show raise slider when bet exists', () => {
      const player = createMockPlayer({ currentBet: 0 });
      const gameState = createMockGameState({
        players: [
          createMockPlayer({ currentBet: 0 }),
          createMockPlayer({ id: 'ai1', name: 'AI 1', isHuman: false, currentBet: 100 }),
        ],
      });
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      // Should show bet slider for raise
      expect(screen.getByTestId('bet-slider')).toBeTruthy();
    });
  });

  describe('Button click handlers', () => {
    it('should call onAction with FOLD when Fold button is clicked', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      fireEvent.click(screen.getByTestId('fold-button'));

      expect(onAction).toHaveBeenCalledWith({
        type: ActionType.FOLD,
        playerId: 'human',
      });
    });

    it('should call onAction with CHECK when Check button is clicked', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      fireEvent.click(screen.getByTestId('check-button'));

      expect(onAction).toHaveBeenCalledWith({
        type: ActionType.CHECK,
        playerId: 'human',
      });
    });

    it('should call onAction with CALL and callAmount when Call button is clicked', () => {
      const player = createMockPlayer({ currentBet: 0 });
      const gameState = createMockGameState({
        players: [
          createMockPlayer({ currentBet: 0 }),
          createMockPlayer({ id: 'ai1', name: 'AI 1', isHuman: false, currentBet: 100 }),
        ],
      });
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      fireEvent.click(screen.getByTestId('call-button'));

      expect(onAction).toHaveBeenCalledWith({
        type: ActionType.CALL,
        amount: 100,
        playerId: 'human',
      });
    });

    it('should call onAction with BET and betAmount when Bet button is clicked', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      fireEvent.click(screen.getByTestId('bet-button'));

      expect(onAction).toHaveBeenCalledWith({
        type: ActionType.BET,
        amount: 20, // Default min bet (big blind)
        playerId: 'human',
      });
    });

    it('should call onAction with RAISE and betAmount when Raise button is clicked', () => {
      const player = createMockPlayer({ currentBet: 0 });
      const gameState = createMockGameState({
        players: [
          createMockPlayer({ currentBet: 0 }),
          createMockPlayer({ id: 'ai1', name: 'AI 1', isHuman: false, currentBet: 100 }),
        ],
      });
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      fireEvent.click(screen.getByTestId('raise-button'));

      expect(onAction).toHaveBeenCalledWith({
        type: ActionType.RAISE,
        amount: 120, // Current bet (100) + big blind (20)
        playerId: 'human',
      });
    });
  });

  describe('Disabled state', () => {
    it('should disable all buttons when disabled prop is true', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={true}
        />
      );

      const foldButton = screen.getByTestId('fold-button') as HTMLButtonElement;
      const checkButton = screen.getByTestId('check-button') as HTMLButtonElement;
      const betButton = screen.getByTestId('bet-button') as HTMLButtonElement;

      expect(foldButton.disabled).toBe(true);
      expect(checkButton.disabled).toBe(true);
      expect(betButton.disabled).toBe(true);
    });

    it('should disable slider when disabled prop is true', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={true}
        />
      );

      const slider = screen.getByTestId('bet-slider') as HTMLInputElement;
      expect(slider.disabled).toBe(true);
    });

    it('should not call onAction when disabled buttons are clicked', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={true}
        />
      );

      fireEvent.click(screen.getByTestId('fold-button'));
      fireEvent.click(screen.getByTestId('check-button'));

      // onAction should not be called when buttons are disabled
      // Note: In React, disabled buttons don't fire click events
      expect(onAction).not.toHaveBeenCalled();
    });
  });

  describe('Slider constraints', () => {
    it('should set slider min to big blind when no bet exists', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      const slider = screen.getByTestId('bet-slider') as HTMLInputElement;
      expect(slider.min).toBe('20'); // Big blind
    });

    it('should set slider max to player chip stack + current bet', () => {
      const player = createMockPlayer({ chipStack: 1000, currentBet: 0 });
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      const slider = screen.getByTestId('bet-slider') as HTMLInputElement;
      expect(slider.max).toBe('1000'); // Player chip stack
    });

    it('should update bet amount when slider is moved', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      const slider = screen.getByTestId('bet-slider') as HTMLInputElement;
      fireEvent.change(slider, { target: { value: '100' } });

      // Bet button should now show the new amount
      expect(screen.getByText(/Bet \$100/)).toBeTruthy();
    });

    it('should display min, max, and current bet amounts', () => {
      const player = createMockPlayer({ chipStack: 1000 });
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      // Should show min bet
      expect(screen.getByText(/Min: \$20/)).toBeTruthy();

      // Should show max bet
      expect(screen.getByText(/Max: \$1,000/)).toBeTruthy();

      // Should show current bet amount in the highlighted display
      const currentBetDisplay = screen.getByText(/Min: \$20/).parentElement;
      expect(currentBetDisplay?.textContent).toContain('$20');
    });
  });

  describe('Component rendering', () => {
    it('should render betting controls container', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      expect(screen.getByTestId('betting-controls')).toBeTruthy();
    });

    it('should always show Fold button regardless of game state', () => {
      const player = createMockPlayer();
      const gameState = createMockGameState();
      const onAction = vi.fn();

      render(
        <BettingControls
          player={player}
          gameState={gameState}
          onAction={onAction}
          disabled={false}
        />
      );

      expect(screen.getByTestId('fold-button')).toBeTruthy();
    });
  });
});
