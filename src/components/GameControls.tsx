import React from 'react';
import { Game } from '../Game';

interface GameControlsProps {
  game: Game;
  isHandInProgress: boolean;
}

/**
 * GameControls component
 * Provides controls for starting new hands
 */
export function GameControls({ game, isHandInProgress }: GameControlsProps) {
  const handleStartNewHand = () => {
    game.startNewHand();
  };

  if (isHandInProgress) {
    return null;
  }

  return (
    <div className="flex justify-center items-center py-8">
      <button
        onClick={handleStartNewHand}
        className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-xl rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
        data-testid="start-new-hand-button"
      >
        🎴 Start New Hand
      </button>
    </div>
  );
}
