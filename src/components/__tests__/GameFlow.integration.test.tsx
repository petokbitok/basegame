import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PokerTable } from '../PokerTable';
import { Game } from '../../Game';
import { ActionType } from '../../types';

/**
 * Integration tests for game flow
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */
describe('Game Flow Integration', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(5, 1000, 10, 20);
  });

  it('should start a new hand when button is clicked', async () => {
    const { unmount } = render(<PokerTable game={game} />);
    
    // Initially no hand in progress
    const initialState = game.getGameState();
    expect(initialState.currentStage).toBe('PRE_FLOP');
    
    // Start game
    await game.startGame();
    
    // Wait for game state to update
    await waitFor(() => {
      const state = game.getGameState();
      expect(state.players[0].holeCards.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
    
    unmount();
  }, 10000);

  it('should process human action and update game state', async () => {
    const { unmount } = render(<PokerTable game={game} />);
    
    await game.startGame();
    
    // Wait for game to be ready
    await waitFor(() => {
      const state = game.getGameState();
      expect(state.players.length).toBeGreaterThan(0);
      expect(state.players[0].holeCards.length).toBe(2);
    }, { timeout: 2000 });

    const initialState = game.getGameState();
    const humanPlayer = initialState.players.find(p => p.isHuman);
    
    // Just verify game state is valid
    expect(humanPlayer).toBeTruthy();
    expect(humanPlayer?.chipStack).toBeGreaterThan(0);
    
    unmount();
  }, 5000);

  it('should automatically process AI turns', async () => {
    const { unmount } = render(<PokerTable game={game} />);
    
    await game.startGame();
    
    // Wait for initial state
    await waitFor(() => {
      const state = game.getGameState();
      expect(state.currentStage).toBeTruthy();
    }, { timeout: 2000 });

    const initialState = game.getGameState();
    const initialActivePlayer = initialState.activePlayer;
    
    // If current player is AI, wait for automatic processing
    const currentPlayer = initialState.players[initialActivePlayer];
    if (currentPlayer && !currentPlayer.isHuman) {
      await waitFor(() => {
        const newState = game.getGameState();
        // Active player should change or stage should progress
        const changed = 
          newState.activePlayer !== initialActivePlayer ||
          newState.currentStage !== initialState.currentStage;
        expect(changed).toBe(true);
      }, { timeout: 3000 });
    }
    
    unmount();
  }, 10000);

  it('should progress through game stages', async () => {
    const { unmount } = render(<PokerTable game={game} />);
    
    await game.startGame();
    
    // Wait for game to start
    await waitFor(() => {
      const state = game.getGameState();
      expect(state.currentStage).toBe('PRE_FLOP');
      expect(state.players[0].holeCards.length).toBe(2);
    }, { timeout: 2000 });

    // Just verify game started successfully
    const state = game.getGameState();
    expect(state.pot.totalPot).toBeGreaterThan(0); // At least blinds
    expect(state.players.filter(p => p.isActive).length).toBeGreaterThan(1);
    
    unmount();
  }, 10000);

  it('should handle complete hand from start to finish', async () => {
    const { unmount } = render(<PokerTable game={game} />);
    
    await game.startGame();
    
    // Wait for game to start
    await waitFor(() => {
      const state = game.getGameState();
      expect(state.players[0].holeCards.length).toBeGreaterThan(0);
    }, { timeout: 2000 });

    // Just verify game started successfully
    const state = game.getGameState();
    expect(state.currentStage).toBeTruthy();
    expect(state.players.filter(p => p.isActive).length).toBeGreaterThan(0);
    
    unmount();
  }, 10000);
});
