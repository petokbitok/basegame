import { GameStage } from '../types';
import { formatChipAmount } from '../utils/format';

interface GameStageIndicatorProps {
  stage: GameStage;
  currentBet: number;
}

const STAGE_NAMES: Record<GameStage, string> = {
  [GameStage.PRE_FLOP]: 'Pre-Flop',
  [GameStage.FLOP]: 'Flop',
  [GameStage.TURN]: 'Turn',
  [GameStage.RIVER]: 'River',
  [GameStage.SHOWDOWN]: 'Showdown',
};

export function GameStageIndicator({ stage, currentBet }: GameStageIndicatorProps) {
  return (
    <div className="flex items-center gap-2 bg-poker-green-dark/80 px-3 py-1.5 rounded-lg border border-blue-500/50 shadow-md">
      <div className="text-sm font-bold text-white">
        {STAGE_NAMES[stage]}
      </div>
      {currentBet > 0 && (
        <div className="flex items-center gap-1 text-xs text-blue-300">
          <span>Bet:</span>
          <span className="font-semibold text-white">
            ${formatChipAmount(currentBet)}
          </span>
        </div>
      )}
    </div>
  );
}
