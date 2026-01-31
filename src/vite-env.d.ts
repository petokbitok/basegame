/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL: string;
  readonly VITE_CDP_PROJECT_ID: string;
  readonly VITE_PAYMASTER_URL: string;
  readonly VITE_LEADERBOARD_CONTRACT_ADDRESS: string;
  readonly VITE_BASE_CHAIN_ID: string;
  readonly VITE_BASE_RPC_URL: string;
  readonly VITE_BASE_ACCOUNT_APP_NAME: string;
  readonly VITE_BASE_ACCOUNT_APP_LOGO_URL: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_GAME_MANAGER_PRIVATE_KEY: string;
  readonly VITE_GAME_MANAGER_ADDRESS: string;
  readonly VITE_NETWORK: string;
  readonly VITE_ANALYTICS_ID: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SESSION_SECRET: string;
  readonly VITE_SESSION_DURATION_MS: string;
  readonly VITE_RATE_LIMIT_ENABLED: string;
  readonly VITE_RATE_LIMIT_MAX_REQUESTS: string;
  readonly VITE_RATE_LIMIT_WINDOW_MS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
