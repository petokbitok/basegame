import type { PotState } from '../types';
import { formatChipAmount } from '../utils/format';

interface PotDisplayProps {
  pot: PotState;
}

export function PotDisplay({ pot }: PotDisplayProps) {
  return (
    <div className="flex items-center gap-2 bg-poker-green-dark/80 px-3 py-1.5 rounded-lg border border-yellow-500/50 shadow-md">
      <span className="text-lg">🪙</span>
      <span className="text-xs font-semibold text-yellow-400 uppercase">Pot</span>
      <div className="text-xl font-bold text-white">
        ${formatChipAmount(pot.totalPot)}
      </div>
    </div>
  );
}
