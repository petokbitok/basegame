import { useState, useEffect } from 'react';
import { Game } from '../Game';
import type { GameState } from '../types';

/**
 * Hook for polling game state from Game class
 * Updates UI every 100ms during active gameplay
 */
export function useGameState(game: Game | null) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);

  useEffect(() => {
    if (!game) {
      setGameState(null);
      setIsPlayerTurn(false);
      return;
    }

    // Initial state
    const initialState = game.getGameState();
    setGameState(initialState);

    // Poll game state every 100ms during active gameplay
    const interval = setInterval(() => {
      const newState = game.getGameState();
      setGameState(newState);
      
      // Check if it's the human player's turn
      if (newState && newState.players.length > 0) {
        const currentPlayer = newState.players[newState.activePlayer];
        setIsPlayerTurn(currentPlayer?.isHuman && currentPlayer?.isActive);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [game]);

  return { gameState, isPlayerTurn };
}
