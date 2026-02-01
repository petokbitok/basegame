import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import './index.css';
import App from './App';
import { wagmiConfig } from './config/wagmi';
import { onchainKitConfig } from './config/onchainkit';
import { config, getConfigSummary } from './config';

// Log configuration summary in development
if (config.isDevelopment) {
  console.log('🎮 Poker AI Game - Configuration:', getConfigSummary());
}

// Create a client for React Query with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={onchainKitConfig.apiKey}
          chain={onchainKitConfig.chain}
          config={onchainKitConfig.config}
        >
          <App />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
