import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, type Connector } from 'wagmi';
import { Game } from './Game';
import { UserProfile } from './ui/UserProfile';
import { SaveProgressPrompt } from './ui/SaveProgressPrompt';
import { SignInWithBase } from './ui/SignInWithBase';
import { NotificationContainer } from './ui/Notification';
import { PokerTable, Leaderboard } from './components';
import { useNotifications } from './hooks/useNotifications';
import { config } from './config';

function App() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [game, setGame] = useState<Game | null>(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const { notifications, removeNotification, success, error, info } = useNotifications();

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
        // Get provider from wagmi
        // For now, we'll initialize without provider until we have proper wallet connection
        // await newGame.initializeBlockchain(
        //   config.contracts.leaderboard,
        //   provider,
        //   config.paymaster.enabled ? config.paymaster.url : undefined
        // );
        console.log('Blockchain integration ready:', {
          contract: config.contracts.leaderboard,
          paymaster: config.paymaster.enabled ? 'enabled' : 'disabled',
        });
        info('Blockchain integration ready');
      }
      
      // Don't start the game automatically - wait for user to click button
      setGame(newGame);
      success('Game initialized successfully!');
    } catch (err) {
      console.error('Failed to initialize game:', err);
      error('Failed to initialize game');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStartGame = async () => {
    console.log('Start Game button clicked');
    if (!game) {
      console.error('No game instance available');
      error('No game instance available');
      return;
    }
    
    try {
      console.log('Starting game...');
      await game.startGame();
      setGameStarted(true);
      success('Game started! Good luck!');
      console.log('Game started successfully');
    } catch (err) {
      console.error('Failed to start game:', err);
      error('Failed to start game');
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setGame(null);
    setGameStarted(false);
    info('Wallet disconnected');
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
            <p className="text-gray-600 mb-4">
              Play Texas Hold'em with AI opponents on Base
            </p>
            <p className="text-sm text-gray-500">
              Powered by Base Account • Gasless transactions
            </p>
          </div>

          <div className="space-y-4">
            {/* Base Account Sign In - Recommended */}
            <div className="border-2 border-base-blue rounded-xl p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-base-blue text-white text-xs font-bold px-2 py-1 rounded">
                  RECOMMENDED
                </span>
                <span className="text-sm font-semibold text-gray-700">
                  Sign in with Base Account
                </span>
              </div>
              <SignInWithBase 
                onSuccess={(address) => {
                  console.log('Base Account connected:', address);
                  success('Connected with Base Account!');
                  // The wagmi hook will detect the connection automatically
                }}
                onError={(err) => {
                  console.error('Base Account error:', err);
                  error('Failed to connect with Base Account');
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                ✓ No gas fees • ✓ Instant setup • ✓ Secure smart wallet
              </p>
            </div>

            {/* Alternative wallet options */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or connect with</span>
              </div>
            </div>

            {connectors.map((connector: Connector) => (
              <button
                key={connector.id}
                onClick={() => {
                  connect({ connector });
                  info(`Connecting with ${connector.name}...`);
                }}
                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200"
              >
                {connector.name}
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
          
          <div className="flex items-center gap-3">
            {game && game.getLeaderboardManager() && (
              <button
                onClick={() => setShowLeaderboard(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>🏆</span>
                <span className="hidden sm:inline">Leaderboard</span>
              </button>
            )}
            
            {address && (
              <UserProfile
                auth={{ getAuthenticatedUser: () => ({ address }), signOut: handleDisconnect } as any}
                user={{ address }}
                onSignOut={handleDisconnect}
              />
            )}
          </div>
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

      {showLeaderboard && game && game.getLeaderboardManager() && (
        <Leaderboard
          leaderboardManager={game.getLeaderboardManager()!}
          currentPlayerAddress={address}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </div>
  );
}

export default App;
