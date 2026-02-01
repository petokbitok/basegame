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
  const [gameStarted, setGameStarted] = useState(false);

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
      
      // Don't start the game automatically - wait for user to click button
      setGame(newGame);
    } catch (error) {
      console.error('Failed to initialize game:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStartGame = async () => {
    if (!game) return;
    
    try {
      await game.startGame();
      setGameStarted(true);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setGame(null);
    setGameStarted(false);
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
    <div className="min-h-screen bg-gradient-to-br from-poker-green to-poker-green-dark flex flex-col">
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Poker AI" className="w-8 h-8" />
            <h1 className="text-lg font-bold text-white">Poker AI</h1>
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

      <main className="flex-1 container mx-auto px-2 py-4 flex items-center justify-center">
        {game && gameStarted ? (
          <PokerTable game={game} />
        ) : game && !gameStarted ? (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="mb-6">
                <div className="text-5xl mb-3">🎰</div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Ready to Play?
                </h2>
                <p className="text-lg text-white/80 mb-1">
                  Texas Hold'em Poker
                </p>
                <p className="text-sm text-white/60">
                  5 AI opponents • Starting chips: 1,000 • Blinds: 10/20
                </p>
              </div>
              <button
                onClick={handleStartGame}
                className="px-10 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xl font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-2xl"
              >
                🎮 Join Table & Start Game
              </button>
            </div>
          </div>
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
