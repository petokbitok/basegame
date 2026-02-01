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
    <div className="flex flex-col items-center gap-2 bg-poker-green-dark/80 px-6 py-3 rounded-xl border-2 border-blue-500/50 shadow-lg">
      <div className="text-xl md:text-2xl font-bold text-white">
        {STAGE_NAMES[stage]}
      </div>
      {currentBet > 0 && (
        <div className="flex items-center gap-2 text-sm text-blue-300">
          <span>Current Bet:</span>
          <span className="font-semibold text-white">
            ${formatChipAmount(currentBet)}
          </span>
        </div>
      )}
    </div>
  );
}
