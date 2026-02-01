import { useState, useEffect } from 'react';
import { formatChipAmount } from '../utils/format';
import type { Player, GameState, PlayerAction, ActionType } from '../types';

interface BettingControlsProps {
  player: Player;
  gameState: GameState;
  onAction: (action: PlayerAction) => void;
  disabled: boolean;
}

export function BettingControls({
  player,
  gameState,
  onAction,
  disabled,
}: BettingControlsProps) {
  // Calculate current bet and call amount
  const currentBet = Math.max(...gameState.players.map((p) => p.currentBet));
  const callAmount = currentBet - player.currentBet;

  // Calculate min and max bet amounts
  const bigBlind = 20; // TODO: Get from game config
  const minBet = currentBet === 0 ? bigBlind : currentBet + bigBlind;
  const maxBet = player.chipStack + player.currentBet;

  // State for bet amount
  const [betAmount, setBetAmount] = useState(minBet);

  // Update betAmount when minBet changes
  useEffect(() => {
    setBetAmount(Math.min(Math.max(betAmount, minBet), maxBet));
  }, [minBet, maxBet]);

  // Determine which buttons to show
  const showCheck = callAmount === 0;
  const showCall = callAmount > 0;
  const showBet = currentBet === 0;
  const showRaise = currentBet > 0;

  // Handler functions
  const handleFold = () => {
    onAction({
      type: 'FOLD' as ActionType,
      playerId: player.id,
    });
  };

  const handleCheck = () => {
    onAction({
      type: 'CHECK' as ActionType,
      playerId: player.id,
    });
  };

  const handleCall = () => {
    onAction({
      type: 'CALL' as ActionType,
      amount: callAmount,
      playerId: player.id,
    });
  };

  const handleBet = () => {
    onAction({
      type: 'BET' as ActionType,
      amount: betAmount,
      playerId: player.id,
    });
  };

  const handleRaise = () => {
    onAction({
      type: 'RAISE' as ActionType,
      amount: betAmount,
      playerId: player.id,
    });
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBetAmount(Number(e.target.value));
  };

  return (
    <div
      className="flex flex-col gap-4 p-4 bg-gray-800 bg-opacity-90 rounded-lg shadow-lg"
      data-testid="betting-controls"
    >
      {/* Bet Slider */}
      {(showBet || showRaise) && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-sm text-gray-300">
            <span>Min: ${formatChipAmount(minBet)}</span>
            <span className="text-yellow-400 font-bold">
              ${formatChipAmount(betAmount)}
            </span>
            <span>Max: ${formatChipAmount(maxBet)}</span>
          </div>
          <input
            type="range"
            min={minBet}
            max={maxBet}
            step={bigBlind}
            value={betAmount}
            onChange={handleSliderChange}
            disabled={disabled}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            data-testid="bet-slider"
          />
        </div>
      )}

      {/* Call Amount Display */}
      {showCall && (
        <div className="text-center text-sm text-gray-300">
          Call Amount: <span className="text-green-400 font-bold">${formatChipAmount(callAmount)}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {/* Fold Button - Always available */}
        <button
          onClick={handleFold}
          disabled={disabled}
          className="bet-button bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
          data-testid="fold-button"
        >
          Fold
        </button>

        {/* Check Button */}
        {showCheck && (
          <button
            onClick={handleCheck}
            disabled={disabled}
            className="bet-button bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            data-testid="check-button"
          >
            Check
          </button>
        )}

        {/* Call Button */}
        {showCall && (
          <button
            onClick={handleCall}
            disabled={disabled}
            className="bet-button bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
            data-testid="call-button"
          >
            Call ${formatChipAmount(callAmount)}
          </button>
        )}

        {/* Bet Button */}
        {showBet && (
          <button
            onClick={handleBet}
            disabled={disabled}
            className="bet-button bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600"
            data-testid="bet-button"
          >
            Bet ${formatChipAmount(betAmount)}
          </button>
        )}

        {/* Raise Button */}
        {showRaise && (
          <button
            onClick={handleRaise}
            disabled={disabled}
            className="bet-button bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
            data-testid="raise-button"
          >
            Raise to ${formatChipAmount(betAmount)}
          </button>
        )}
      </div>
    </div>
  );
}
