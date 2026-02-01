import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, type Connector } from 'wagmi';
import { Game } from './Game';
import { UserProfile } from './ui/UserProfile';
import { SaveProgressPrompt } from './ui/SaveProgressPrompt';
import { PokerTable } from './components/PokerTable';
import { config } from './config';

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [game, setGame] = useState<Game | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize game when wallet connects
  useEffect(() => {
    if (isConnected && address && !game && !isInitializing) {
      initializeGame();
    }
  }, [isConnected, address]);

  const initializeGame = async () => {
    if (!address) return;
    
    setIsInitializing(true);
    try {
      const newGame = new Game(5, 1000, 10, 20);
      
      // Initialize blockchain if contract address is configured
      if (config.contracts.leaderboard) {
        // TODO: Get provider from wagmi
        // await newGame.initializeBlockchain(
        //   config.contracts.leaderboard,
        //   provider,
        //   config.paymaster.url
        // );
      }
      
      // Start the game automatically
      await newGame.startGame();
      
      setGame(newGame);
    } catch (error) {
      console.error('Failed to initialize game:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setGame(null);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-blue to-base-blue-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mb-4">
              <img src="/logo.svg" alt="Poker AI" className="w-24 h-24 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎮 Poker AI Game
            </h1>
            <p className="text-gray-600">
              Play Texas Hold'em with AI opponents on Base
            </p>
          </div>

          <div className="space-y-4">
            {connectors.map((connector: Connector) => (
              <button
                key={connector.id}
                onClick={() => connect({ connector })}
                className="w-full py-3 px-4 bg-base-blue hover:bg-base-blue-dark text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Connect with {connector.name}
              </button>
            ))}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Powered by Base • Chain ID: {config.base.chainId}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-poker-green to-poker-green-dark flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin-slow w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl">Initializing game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-poker-green to-poker-green-dark">
      <header className="bg-black bg-opacity-30 backdrop-blur-sm border-b border-white border-opacity-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Poker AI" className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-white">Poker AI</h1>
          </div>
          
          {address && (
            <UserProfile
              auth={{ getAuthenticatedUser: () => ({ address }), signOut: handleDisconnect } as any}
              user={{ address }}
              onSignOut={handleDisconnect}
            />
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {game ? (
          <PokerTable game={game} />
        ) : (
          <div className="text-center text-white">
            <p className="text-xl">Loading game...</p>
          </div>
        )}
      </main>

      {showSavePrompt && game && (
        <SaveProgressPrompt
          game={game}
          onClose={() => setShowSavePrompt(false)}
        />
      )}
    </div>
  );
}

export default App;
