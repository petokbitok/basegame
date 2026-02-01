import type { PotState } from '../types';
import { formatChipAmount } from '../utils/format';

interface PotDisplayProps {
  pot: PotState;
}

export function PotDisplay({ pot }: PotDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-2 bg-poker-green-dark/80 px-6 py-3 rounded-xl border-2 border-yellow-500/50 shadow-lg">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🪙</span>
        <span className="text-sm font-semibold text-yellow-400 uppercase tracking-wide">
          Pot
        </span>
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white">
        ${formatChipAmount(pot.totalPot)}
      </div>
    </div>
  );
}
