import { useState } from 'react';
import { SignInWithBaseButton } from '@base-org/account-ui/react';
import { createBaseAccountSDK } from '@base-org/account';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';

interface SignInWithBaseProps {
  onSuccess: (address: string) => void;
  onError?: (error: Error) => void;
}

export function SignInWithBase({ onSuccess, onError }: SignInWithBaseProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sdk = createBaseAccountSDK({
    appName: 'Poker AI Game',
    appLogoUrl: `${window.location.origin}/logo.svg`,
    appChainIds: [base.id],
  });

  const handleSignIn = async () => {
    console.log('Sign In With Base button clicked');
    setLoading(true);
    setError(null);

    try {
      // Get the provider and create wallet client
      const provider = sdk.getProvider();
      const client = createWalletClient({
        chain: base,
        transport: custom(provider)
      });

      // Get account address
      const [account] = await client.getAddresses();
      console.log('Base Account connected:', account);

      // Sign authentication message
      const message = `Sign in to Poker AI Game at ${Date.now()}`;
      const signature = await client.signMessage({ 
        account,
        message,
      });

      console.log('Message signed successfully');

      // Call success callback
      onSuccess(account);
    } catch (err) {
      console.error('Base Account authentication failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!loading ? (
        <SignInWithBaseButton 
          align="center"
          variant="solid"
          colorScheme="light"
          onClick={handleSignIn}
        />
      ) : (
        <div className="w-full py-3 px-6 bg-gray-300 text-gray-600 font-semibold rounded-xl text-center cursor-not-allowed">
          Connecting...
        </div>
      )}
      
      {loading && (
        <div className="text-white text-sm animate-pulse">
          Connecting to Base Account...
        </div>
      )}
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-100 text-sm max-w-md">
          <p className="font-semibold">Authentication failed</p>
          <p className="text-xs mt-1">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
