import { useState, useEffect } from 'react';
import { Game } from '../Game';
import { useGameState } from '../hooks/useGameState';
import { PlayerPosition } from './PlayerPosition';
import { CommunityCards } from './CommunityCards';
import { PotDisplay } from './PotDisplay';
import { GameStageIndicator } from './GameStageIndicator';
import { WinnerModal, type WinnerResult } from './WinnerModal';
import { formatChipAmount } from '../utils/format';
import type { ActionType } from '../types';

interface PokerTableProps {
  game: Game;
  onAction?: (action: ActionType, amount?: number) => void;
}

type PlayerPositionType = 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom';

export function PokerTable({ game, onAction }: PokerTableProps) {
  const { gameState, isPlayerTurn } = useGameState(game);
  const [betAmount, setBetAmount] = useState(0);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<WinnerResult[]>([]);

  // Process AI turns automatically
  useEffect(() => {
    if (!gameState) return;
    
    const currentPlayer = gameState.players[gameState.activePlayer];
    
    // If it's an AI player's turn, the game loop will handle it automatically
    // The useGameState hook will detect the state change and update the UI
    if (currentPlayer && !currentPlayer.isHuman && currentPlayer.isActive) {
      // AI turn is processed by Game.runGameLoop()
      // UI will update via polling in useGameState
    }
  }, [gameState]);

  // Detect showdown and display winner
  useEffect(() => {
    if (!gameState) return;

    if (gameState.currentStage === 'SHOWDOWN') {
      // Determine winner(s)
      const activePlayers = gameState.players.filter(p => p.isActive);
      
      if (activePlayers.length > 0) {
        // For now, simple winner detection (can be enhanced with HandEvaluator)
        // Find player with most chips (winner gets the pot)
        const sortedPlayers = [...activePlayers].sort((a, b) => b.chipStack - a.chipStack);
        const maxChips = sortedPlayers[0].chipStack;
        const winners = sortedPlayers.filter(p => p.chipStack === maxChips);
        
        const winnerResults: WinnerResult[] = winners.map(winner => ({
          playerId: winner.id,
          playerName: winner.name,
          handRanking: 'High Card', // TODO: Get from HandEvaluator
          potAmount: gameState.pot.totalPot / winners.length,
        }));

        setWinnerInfo(winnerResults);
        setShowWinner(true);
      }
    }
  }, [gameState]);

  const handleCloseWinner = () => {
    setShowWinner(false);
    setWinnerInfo([]);
  };

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    );
  }

  const handleStartHand = () => {
    game.startNewHand();
  };

  const handleAction = async (action: string, amount?: number) => {
    if (!isPlayerTurn) return;
    
    const humanPlayer = gameState.players.find(p => p.isHuman);
    if (!humanPlayer) return;

    try {
      // Process action through game engine
      await game.processHumanAction(action as any, amount);
      
      // Call optional onAction callback
      if (onAction) {
        onAction(action as ActionType, amount);
      }
    } catch (error) {
      console.error('Failed to process action:', error);
      // Error will be handled by error boundary
    }
  };

  const currentBet = Math.max(...gameState.players.map(p => p.currentBet || 0));
  const humanPlayer = gameState.players.find(p => p.isHuman);
  const callAmount = humanPlayer ? currentBet - (humanPlayer.currentBet || 0) : 0;

  // Define player positions around the oval table
  // Position 0: Human player (bottom center)
  // Positions 1-5: AI players distributed around the table
  const playerPositions: PlayerPositionType[] = [
    'bottom',        // Human (bottom center)
    'bottom-left',   // AI 1 (bottom left)
    'top-left',      // AI 2 (top left)
    'top',           // AI 3 (top center)
    'top-right',     // AI 4 (top right)
    'bottom-right',  // AI 5 (bottom right)
  ];

  // CSS Grid positioning classes for each position
  const positionClasses: Record<PlayerPositionType, string> = {
    'bottom': 'absolute bottom-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'absolute bottom-1/4 left-4 md:left-8',
    'top-left': 'absolute top-1/3 left-4 md:left-8',
    'top': 'absolute top-4 left-1/2 -translate-x-1/2',
    'top-right': 'absolute top-1/3 right-4 md:right-8',
    'bottom-right': 'absolute bottom-1/4 right-4 md:right-8',
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto px-4" data-testid="poker-table">
      {/* Game Stage Indicator at top */}
      <div className="flex justify-center mb-4">
        <GameStageIndicator stage={gameState.currentStage} currentBet={currentBet} />
      </div>

      {/* Poker Table - Oval layout with CSS Grid */}
      <div 
        className="relative bg-poker-felt rounded-[50%] border-4 md:border-8 border-amber-900 shadow-2xl p-4 md:p-8 lg:p-16"
        style={{ aspectRatio: '16/10', minHeight: '400px' }}
        data-testid="table-felt"
      >
        {/* Center area with Community Cards and Pot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
          <CommunityCards cards={gameState.communityCards} stage={gameState.currentStage} />
          <PotDisplay pot={gameState.pot} />
        </div>

        {/* Player Positions - 6 positions around the table */}
        {gameState.players.map((player, index) => {
          const isActive = index === gameState.activePlayer;
          const isDealer = index === gameState.dealerPosition;
          const position = playerPositions[index];
          const positionClass = positionClasses[position];

          return (
            <div
              key={player.id}
              className={positionClass}
              data-testid={`player-position-${index}`}
              data-player-type={player.isHuman ? 'human' : 'ai'}
            >
              <PlayerPosition
                player={player}
                isActive={isActive}
                isDealer={isDealer}
                position={position}
                isHuman={player.isHuman}
              />
            </div>
          );
        })}
      </div>

      {/* Betting Controls */}
      {isPlayerTurn && humanPlayer && (
        <div className="mt-4 md:mt-8 bg-gray-900 rounded-xl p-4 md:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center items-center">
            <button
              onClick={() => handleAction('fold')}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all"
            >
              Fold
            </button>
            
            {callAmount === 0 ? (
              <button
                onClick={() => handleAction('check')}
                className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all"
              >
                Check
              </button>
            ) : (
              <button
                onClick={() => handleAction('call', callAmount)}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
              >
                Call {formatChipAmount(callAmount)}
              </button>
            )}

            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3 md:gap-4">
              <div className="w-full sm:w-48 flex flex-col gap-2">
                <input
                  type="range"
                  min={currentBet + 20}
                  max={humanPlayer.chipStack}
                  step={20}
                  value={betAmount || currentBet + 20}
                  onChange={(e) => setBetAmount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-white text-sm text-center">
                  {formatChipAmount(betAmount || currentBet + 20)}
                </div>
              </div>
              <button
                onClick={() => handleAction(currentBet === 0 ? 'bet' : 'raise', betAmount || currentBet + 20)}
                className="w-full sm:w-auto px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-xl transition-all"
              >
                {currentBet === 0 ? 'Bet' : 'Raise'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Hand Button */}
      {gameState.currentStage === 'SHOWDOWN' && (
        <div className="mt-4 md:mt-8 text-center">
          <button
            onClick={handleStartHand}
            className="w-full sm:w-auto px-8 py-4 bg-base-blue hover:bg-base-blue-dark text-white text-xl font-bold rounded-xl transition-all transform hover:scale-105"
          >
            Start New Hand
          </button>
        </div>
      )}

      {/* Winner Modal */}
      {showWinner && winnerInfo.length > 0 && (
        <WinnerModal winners={winnerInfo} onClose={handleCloseWinner} />
      )}
    </div>
  );
}
