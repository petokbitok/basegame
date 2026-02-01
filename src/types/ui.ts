/**
 * UI-specific type definitions
 */

export interface WinnerInfo {
  playerId: string;
  playerName: string;
  handRanking: string;
  potAmount: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  points: number;
  gamesWon: number;
  isCurrentPlayer: boolean;
}

export interface AnimationState {
  type: 'card-deal' | 'chip-move' | 'winner-reveal';
  target: string;
  duration: number;
}

export interface PlayerAction {
  type: 'fold' | 'check' | 'call' | 'bet' | 'raise';
  playerId: string;
  amount?: number;
}
