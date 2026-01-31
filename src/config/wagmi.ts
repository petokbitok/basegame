import { http, createConfig, cookieStorage, createStorage } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';

// Get environment variables
const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
const baseRpcUrl = import.meta.env.VITE_BASE_RPC_URL;

// Use only Base Mainnet
const chains = [base] as const;

// Create wagmi configuration with multiple wallet options
export const wagmiConfig = createConfig({
  chains,
  connectors: [
    // Coinbase Wallet with Smart Wallet (Base Account) - RECOMMENDED
    coinbaseWallet({
      appName: 'Poker AI Game',
      appLogoUrl: `${appUrl}/logo.svg`,
      preference: 'smartWalletOnly', // Force Smart Wallet creation
      version: '4', // Use latest SDK version
    }),
    // Injected wallets (MetaMask, Brave Wallet, etc.)
    injected({
      target: 'metaMask',
    }),
    // WalletConnect for mobile wallets and other options
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: 'Poker AI Game',
        description: 'Texas Hold\'em Poker with AI on Base Blockchain',
        url: appUrl,
        icons: [`${appUrl}/logo.svg`],
      },
      showQrModal: true,
    }),
  ],
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: false,
  transports: {
    [base.id]: http(baseRpcUrl || undefined),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}
