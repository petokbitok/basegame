import React, { useState, useEffect } from 'react';
import { Game } from '../Game';

interface SaveProgressPromptProps {
  game: Game;
  onClose: () => void;
}

interface UnsavedProgress {
  pointsDiff: number;
  gamesWonDiff: number;
  handsWonDiff: number;
  biggestPotDiff: number;
}

/**
 * Component to prompt user to save unsaved progress to blockchain
 */
export const SaveProgressPrompt: React.FC<SaveProgressPromptProps> = ({ game, onClose }) => {
  const [progress, setProgress] = useState<UnsavedProgress | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkProgress();
  }, []);

  const checkProgress = async () => {
    const auth = game.getAuth();
    const leaderboard = game.getLeaderboardManager();
    const user = auth.getAuthenticatedUser();

    if (!leaderboard || !user) {
      return;
    }

    const unsavedProgress = await leaderboard.getUnsavedProgress(user.address);
    setProgress(unsavedProgress);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const auth = game.getAuth();
    const leaderboard = game.getLeaderboardManager();
    const user = auth.getAuthenticatedUser();

    if (!leaderboard || !user) {
      setError('Not authenticated');
      setSaving(false);
      return;
    }

    const result = await leaderboard.saveToBlockchain(user.address);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Failed to save');
    }

    setSaving(false);
  };

  if (!progress) {
    return null;
  }

  const hasProgress = 
    progress.pointsDiff > 0 ||
    progress.gamesWonDiff > 0 || 
    progress.handsWonDiff > 0 || 
    progress.biggestPotDiff > 0;

  if (!hasProgress) {
    return null;
  }

  return (
    <div className="save-progress-prompt">
      <div className="prompt-overlay" onClick={onClose} />
      <div className="prompt-content">
        <h2>🔔 Unsaved Progress Detected</h2>
        <p>You have progress that hasn't been saved to the blockchain:</p>
        
        <div className="progress-details">
          {progress.pointsDiff > 0 && (
            <div className="progress-item">
              <span className="label">Points:</span>
              <span className="value">+{progress.pointsDiff}</span>
            </div>
          )}
          {progress.gamesWonDiff > 0 && (
            <div className="progress-item">
              <span className="label">Games Won:</span>
              <span className="value">+{progress.gamesWonDiff}</span>
            </div>
          )}
          {progress.handsWonDiff > 0 && (
            <div className="progress-item">
              <span className="label">Hands Won:</span>
              <span className="value">+{progress.handsWonDiff}</span>
            </div>
          )}
          {progress.biggestPotDiff > 0 && (
            <div className="progress-item">
              <span className="label">Biggest Pot:</span>
              <span className="value">+{progress.biggestPotDiff}</span>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="prompt-actions">
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="save-button"
          >
            {saving ? 'Saving...' : 'Save to Blockchain'}
          </button>
          <button 
            onClick={onClose} 
            disabled={saving}
            className="cancel-button"
          >
            Later
          </button>
        </div>

        <p className="note">
          Note: Saving requires a blockchain transaction and may cost gas fees.
        </p>
      </div>

      <style jsx>{`
        .save-progress-prompt {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .prompt-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
        }

        .prompt-content {
          position: relative;
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 420px;
          width: 100%;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          max-height: 90vh;
          overflow-y: auto;
        }

        h2 {
          margin: 0 0 12px 0;
          font-size: 22px;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.3;
        }

        p {
          margin: 0 0 20px 0;
          color: #666;
          font-size: 15px;
          line-height: 1.5;
        }

        .progress-details {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          border: 1px solid #e8e8e8;
        }

        .progress-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 8px 0;
        }

        .progress-item:last-child {
          margin-bottom: 0;
        }

        .label {
          color: #666;
          font-size: 14px;
          font-weight: 500;
        }

        .value {
          color: #0052ff;
          font-weight: 700;
          font-size: 16px;
        }

        .error-message {
          background: #fff0f0;
          color: #d32f2f;
          padding: 14px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          border: 1px solid #ffcdd2;
        }

        .prompt-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        button {
          width: 100%;
          padding: 14px 20px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .save-button {
          background: #0052ff;
          color: white;
          box-shadow: 0 2px 8px rgba(0, 82, 255, 0.2);
        }

        .save-button:hover:not(:disabled) {
          background: #0041cc;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 82, 255, 0.3);
        }

        .save-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .cancel-button {
          background: #f0f0f0;
          color: #333;
        }

        .cancel-button:hover:not(:disabled) {
          background: #e0e0e0;
        }

        .note {
          font-size: 13px;
          color: #999;
          margin: 0;
          text-align: center;
          line-height: 1.4;
        }

        @media (min-width: 640px) {
          .prompt-actions {
            flex-direction: row;
          }

          button {
            flex: 1;
          }
        }

        @media (max-width: 380px) {
          .prompt-content {
            padding: 20px;
          }

          h2 {
            font-size: 20px;
          }

          .progress-item {
            font-size: 13px;
          }

          button {
            padding: 12px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};
