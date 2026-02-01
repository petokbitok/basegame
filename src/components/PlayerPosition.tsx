import { Card } from './Card';
import { formatChipAmount } from '../utils/format';
import type { Player, ActionType } from '../types';

interface PlayerPositionProps {
  player: Player;
  isActive: boolean;
  isDealer: boolean;
  position: 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom';
  isHuman: boolean;
}

const ACTION_LABELS: Record<ActionType, string> = {
  FOLD: 'Fold',
  CHECK: 'Check',
  CALL: 'Call',
  BET: 'Bet',
  RAISE: 'Raise',
};

export function PlayerPosition({
  player,
  isActive,
  isDealer,
  position,
  isHuman,
}: PlayerPositionProps) {
  // Determine if player is folded (not active but still in the hand)
  const isFolded = !player.isActive;

  return (
    <div
      className={`
        flex flex-col items-center gap-2 p-3 rounded-lg transition-all duration-200
        ${isActive ? 'ring-4 ring-yellow-400 ring-opacity-75 shadow-lg' : ''}
        ${isFolded ? 'opacity-40 grayscale' : ''}
        bg-gray-800 bg-opacity-80
      `}
      data-testid="player-position"
      data-position={position}
      data-player-id={player.id}
    >
      {/* Player Name and Dealer Button */}
      <div className="flex items-center gap-2">
        <span className="text-white font-semibold text-sm md:text-base">
          {player.name}
        </span>
        {isDealer && (
          <span
            className="bg-yellow-500 text-black font-bold text-xs px-2 py-1 rounded-full"
            data-testid="dealer-button"
          >
            D
          </span>
        )}
      </div>

      {/* Chip Stack */}
      <div className="text-green-400 font-bold text-sm md:text-base">
        ${formatChipAmount(player.chipStack)}
      </div>

      {/* Hole Cards */}
      <div className="flex gap-1">
        {player.holeCards.length > 0 ? (
          <>
            <Card card={player.holeCards[0]} faceDown={!isHuman} />
            <Card card={player.holeCards[1]} faceDown={!isHuman} />
          </>
        ) : (
          <>
            <Card card={null} />
            <Card card={null} />
          </>
        )}
      </div>

      {/* Last Action Indicator */}
      {player.lastAction && (
        <div
          className="text-xs md:text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded"
          data-testid="action-indicator"
        >
          {ACTION_LABELS[player.lastAction.type]}
          {player.lastAction.amount && player.lastAction.amount > 0
            ? ` $${formatChipAmount(player.lastAction.amount)}`
            : ''}
        </div>
      )}

      {/* All-In Badge */}
      {player.isAllIn && (
        <div
          className="bg-red-600 text-white font-bold text-xs px-3 py-1 rounded-full animate-pulse"
          data-testid="all-in-badge"
        >
          ALL-IN
        </div>
      )}
    </div>
  );
}
