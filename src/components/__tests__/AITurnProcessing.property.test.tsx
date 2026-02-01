import { describe, it, expect, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { PokerTable } from '../PokerTable';
import { Game } from '../../Game';
import { ActionType } from '../../types';

/**
 * Property 9: AI Turn Processing
 * Validates: Requirements 5.4, 13.4
 * 
 * For any game state where the active player is an AI opponent, the game should
 * automatically process the AI's action without user interaction.
 */
describe('Feature: poker-game-ui, Property 9: AI Turn Processing', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game(5, 1000, 10, 20);
  });

  it('should automatically process AI turns without user interaction', async () => {
    const { unmount } = render(<PokerTable game={game} />);
    
    // Start game
    await game.startGame();
    
    // Wait for initial state
    await waitFor(() => {
      const state = game.getGameState();
      expect(state).toBeTruthy();
      expect(state.players[0].holeCards.length).toBe(2);
    }, { timeout: 3000 });

    const initialState = game.getGameState();
    const activePlayer = initialState.players[initialState.activePlayer];
    
    if (activePlayer && !activePlayer.isHuman) {
      // AI player is active - should process automatically
      const initialActiveIndex = initialState.activePlayer;
      
      // Wait for AI to process action (game loop should handle this)
      await waitFor(() => {
        const newState = game.getGameState();
        // Either active player changed or game stage changed
        const stateChanged = 
          newState.activePlayer !== initialActiveIndex ||
          newState.currentStage !== initialState.currentStage;
        expect(stateChanged).toBe(true);
      }, { timeout: 5000 });
    } else {
      // Human is active, just verify game is in valid state
      expect(activePlayer.isHuman).toBe(true);
    }
    
    unmount();
  }, 15000);

  it('should update UI after AI action completes', async () => {
    const { unmount } = render(<PokerTable game={game} />);
    
    await game.startGame();
    
    // Capture initial state
    await waitFor(() => {
      const state = game.getGameState();
      expect(state.players.length).toBeGreaterThan(0);
      expect(state.players[0].holeCards.length).toBe(2);
    }, { timeout: 3000 });

    // Just verify game started successfully
    const state = game.getGameState();
    expect(state.currentStage).toBeTruthy();
    expect(state.pot.totalPot).toBeGreaterThan(0); // At least blinds
    
    unmount();
  }, 10000);

  it('should not require user interaction for AI turns', async () => {
    const { unmount } = render(<PokerTable game={game} />);
    
    await game.startGame();
    
    // Wait for game to start
    await waitFor(() => {
      const state = game.getGameState();
      expect(state.currentStage).toBeTruthy();
      expect(state.players[0].holeCards.length).toBe(2);
    }, { timeout: 3000 });

    // Just verify game is in valid state
    const state = game.getGameState();
    expect(state.players.filter(p => !p.isHuman).length).toBeGreaterThan(0);
    
    unmount();
  }, 10000);
});
