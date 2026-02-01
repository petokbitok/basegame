import React, { useEffect } from 'react';
import { formatChipAmount } from '../utils/format';

export interface WinnerResult {
  playerId: string;
  playerName: string;
  handRanking: string;
  potAmount: number;
}

interface WinnerModalProps {
  winners: WinnerResult[];
  onClose: () => void;
}

/**
 * WinnerModal component
 * Displays winner announcement at end of hand
 */
export function WinnerModal({ winners, onClose }: WinnerModalProps) {
  // Auto-close after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const isSplitPot = winners.length > 1;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      data-testid="winner-modal"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-2xl p-8 max-w-md w-full transform animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-700 hover:text-gray-900 text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        {/* Winner announcement */}
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {isSplitPot ? 'Split Pot!' : 'Winner!'}
          </h2>

          {winners.map((winner, index) => (
            <div key={winner.playerId} className="mb-6">
              {/* Winner name */}
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {winner.playerName}
              </div>

              {/* Hand ranking */}
              <div className="text-lg text-gray-700 mb-2">
                {winner.handRanking}
              </div>

              {/* Pot amount */}
              <div className="text-3xl font-bold text-green-700">
                {isSplitPot ? '½ ' : ''}
                {formatChipAmount(winner.potAmount)}
              </div>

              {index < winners.length - 1 && (
                <div className="border-t border-gray-400 my-4"></div>
              )}
            </div>
          ))}

          {/* Confetti effect for human player wins */}
          {winners.some(w => w.playerId === 'human') && (
            <div className="confetti-container">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    backgroundColor: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0'][Math.floor(Math.random() * 5)],
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: confetti-fall 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
