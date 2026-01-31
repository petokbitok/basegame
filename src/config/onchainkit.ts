import { base } from 'wagmi/chains';

export const onchainKitConfig = {
  apiKey: import.meta.env.VITE_CDP_PROJECT_ID,
  chain: base,
  config: {
    appearance: {
      mode: 'auto' as const,
      theme: 'base' as const,
    },
  },
};
