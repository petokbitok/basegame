/**
 * Environment configuration for Vite
 * All environment variables with validation and defaults
 */
export const config = {
  // Application
  app: {
    url: import.meta.env.VITE_APP_URL || window.location.origin,
    name: import.meta.env.VITE_BASE_ACCOUNT_APP_NAME || 'Poker AI Game',
    logoUrl: import.meta.env.VITE_BASE_ACCOUNT_APP_LOGO_URL || '/logo.svg',
  },

  // Base Blockchain Configuration
  base: {
    chainId: parseInt(import.meta.env.VITE_BASE_CHAIN_ID || '8453', 10),
    rpcUrl: import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org',
  },

  // Smart Contract Addresses
  contracts: {
    leaderboard: import.meta.env.VITE_LEADERBOARD_CONTRACT_ADDRESS || '',
  },

  // Coinbase Developer Platform
  cdp: {
    projectId: import.meta.env.VITE_CDP_PROJECT_ID || '',
  },

  // Paymaster Service (Optional)
  paymaster: {
    url: import.meta.env.VITE_PAYMASTER_URL || '',
    enabled: !!import.meta.env.VITE_PAYMASTER_URL,
  },

  // WalletConnect
  walletConnect: {
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '',
  },

  // Game Manager Configuration
  gameManager: {
    privateKey: import.meta.env.VITE_GAME_MANAGER_PRIVATE_KEY || '',
    address: import.meta.env.VITE_GAME_MANAGER_ADDRESS || '',
  },

  // Environment
  env: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,

  // Optional Features
  analytics: {
    enabled: !!import.meta.env.VITE_ANALYTICS_ID,
    id: import.meta.env.VITE_ANALYTICS_ID || '',
  },

  sentry: {
    enabled: !!import.meta.env.VITE_SENTRY_DSN,
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
  },

  // Rate Limiting
  rateLimit: {
    enabled: import.meta.env.VITE_RATE_LIMIT_ENABLED !== 'false',
    maxRequests: parseInt(import.meta.env.VITE_RATE_LIMIT_MAX_REQUESTS || '100', 10),
    windowMs: parseInt(import.meta.env.VITE_RATE_LIMIT_WINDOW_MS || '60000', 10),
  },

  // Session Configuration
  session: {
    secret: import.meta.env.VITE_SESSION_SECRET || 'default-secret-change-in-production',
    durationMs: parseInt(import.meta.env.VITE_SESSION_DURATION_MS || '86400000', 10),
  },

  // Network
  network: import.meta.env.VITE_NETWORK || 'mainnet',
};

/**
 * Validate required environment variables
 * Throws error if critical variables are missing
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // Check critical variables
  if (!config.contracts.leaderboard) {
    errors.push('VITE_LEADERBOARD_CONTRACT_ADDRESS is required');
  }

  if (!config.cdp.projectId) {
    errors.push('VITE_CDP_PROJECT_ID is required');
  }

  if (config.isProduction) {
    if (config.session.secret === 'default-secret-change-in-production') {
      errors.push('VITE_SESSION_SECRET must be changed in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }
}

/**
 * Get configuration summary for logging
 * Excludes sensitive information
 */
export function getConfigSummary(): Record<string, any> {
  return {
    environment: config.env,
    chainId: config.base.chainId,
    network: config.network,
    contractAddress: config.contracts.leaderboard
      ? `${config.contracts.leaderboard.slice(0, 6)}...${config.contracts.leaderboard.slice(-4)}`
      : 'not set',
    paymasterEnabled: config.paymaster.enabled,
    analyticsEnabled: config.analytics.enabled,
    rateLimitEnabled: config.rateLimit.enabled,
  };
}

// Validate configuration on import (only in production)
if (config.isProduction) {
  try {
    validateConfig();
  } catch (error) {
    console.error('Configuration Error:', error);
  }
}
