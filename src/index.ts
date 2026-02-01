// Load environment configuration
import { config, getConfigSummary } from './config';

// Export main Game class
export { Game } from './Game';

// Export all types
export * from './types';

// Export core systems
export { CardDeck } from './core/CardDeck';
export { HandEvaluator } from './core/HandEvaluator';
export { BettingSystem } from './core/BettingSystem';

// Export engine
export { GameEngine } from './engine/GameEngine';
export { GameFlowManager } from './engine/GameFlowManager';

// Export AI
export { AIPlayer } from './ai/AIPlayer';

// Export blockchain integration
export { ContractService } from './blockchain/ContractService';
export { PaymasterService } from './blockchain/PaymasterService';
export { TransactionLogger } from './blockchain/TransactionLogger';

// Export auth
export { BaseAccountAuth } from './auth/BaseAccountAuth';
export { SessionManager } from './auth/SessionManager';
export { VerificationService } from './auth/VerificationService';

// Export leaderboard
export { LeaderboardManager } from './leaderboard/LeaderboardManager';
export type { GameResult as LeaderboardGameResult, SaveResult, LocalPlayerStats } from './leaderboard/LeaderboardManager';

// Export utilities
export { GamePersistence } from './persistence/GamePersistence';
export { MiniAppContext } from './miniapp/MiniAppContext';

// Export configuration
export { config } from './config';

// Log configuration summary on startup
if (config.isDevelopment) {
  console.log('🎮 Poker AI Game - Configuration:', getConfigSummary());
}

import { Game } from './Game';

/**
 * Create and initialize a new poker game
 * @param gameConfig Game configuration
 * @returns Promise<Game> Game instance
 */
export async function createGame(gameConfig?: {
  numAIPlayers?: number;
  startingChips?: number;
  smallBlind?: number;
  bigBlind?: number;
  contractAddress?: string;
  provider?: any;
  paymasterUrl?: string;
}): Promise<Game> {
  const game = new Game(
    gameConfig?.numAIPlayers || 3,
    gameConfig?.startingChips || 1000,
    gameConfig?.smallBlind || 10,
    gameConfig?.bigBlind || 20
  );

  // Initialize blockchain with config or provided values
  const contractAddress = gameConfig?.contractAddress || config.contracts.leaderboard;
  const paymasterUrl = gameConfig?.paymasterUrl || config.paymaster.url;

  if (contractAddress && gameConfig?.provider) {
    await game.initializeBlockchain(
      contractAddress,
      gameConfig.provider,
      paymasterUrl
    );
  }

  return game;
}
