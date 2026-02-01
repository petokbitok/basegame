import { useState, useEffect } from 'react';
import { LeaderboardManager } from '../leaderboard/LeaderboardManager';
import { LeaderboardEntry } from '../blockchain/ContractService';
import { formatAddressOrBasename } from '../utils/basename';

interface LeaderboardProps {
  leaderboardManager: LeaderboardManager;
  currentPlayerAddress?: string;
  onClose: () => void;
}

export function Leaderboard({ leaderboardManager, currentPlayerAddress, onClose }: LeaderboardProps) {
  const [topPlayers, setTopPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const players = await leaderboardManager.getTopPlayers(10);
      setTopPlayers(players);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-base-blue to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">🏆 Leaderboard</h2>
              <p className="text-sm text-blue-100 mt-1">Top Players on Base</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-base-blue border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading leaderboard...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadLeaderboard}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && topPlayers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <p className="text-gray-600 text-lg">No players yet</p>
              <p className="text-gray-500 text-sm mt-2">Be the first to win a game!</p>
            </div>
          )}

          {!loading && !error && topPlayers.length > 0 && (
            <div className="space-y-2">
              {topPlayers.map((entry, index) => {
                const isCurrentPlayer = currentPlayerAddress && 
                  entry.player.toLowerCase() === currentPlayerAddress.toLowerCase();
                const rank = Number(entry.rank);
                
                return (
                  <div
                    key={entry.player}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      isCurrentPlayer
                        ? 'bg-blue-50 border-2 border-base-blue'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                      {rank === 1 && <span className="text-3xl">🥇</span>}
                      {rank === 2 && <span className="text-3xl">🥈</span>}
                      {rank === 3 && <span className="text-3xl">🥉</span>}
                      {rank > 3 && (
                        <span className="text-xl font-bold text-gray-600">#{rank}</span>
                      )}
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate font-mono text-sm">
                          {formatAddressOrBasename(entry.player)}
                        </p>
                        {isCurrentPlayer && (
                          <span className="bg-base-blue text-white text-xs px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-600">
                        <span>🎯 {Number(entry.points)} pts</span>
                        <span>🏆 {Number(entry.gamesWon)} wins</span>
                        <span>🃏 {Number(entry.handsWon)} hands</span>
                      </div>
                    </div>

                    {/* Points Badge */}
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-center">
                        <div className="text-lg">{Number(entry.points)}</div>
                        <div className="text-xs opacity-90">points</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Updated every 5 minutes</span>
            <button
              onClick={loadLeaderboard}
              className="text-base-blue hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
