import React from 'react';
import { BaseAccountAuth, UserIdentity } from '../auth';

interface UserProfileProps {
  auth: BaseAccountAuth;
  user: UserIdentity;
  onSignOut?: () => void;
}

/**
 * User profile display component showing authenticated user info
 */
export const UserProfile: React.FC<UserProfileProps> = ({
  auth,
  user,
  onSignOut,
}) => {
  const handleSignOut = () => {
    auth.signOut();
    onSignOut?.();
  };

  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="user-profile">
      <div className="user-info">
        <div className="user-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#0052ff" opacity="0.1"/>
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#0052ff"/>
          </svg>
        </div>
        <span className="user-address">{formatAddress(user.address)}</span>
      </div>
      <button onClick={handleSignOut} className="sign-out-button">
        Sign Out
      </button>

      <style jsx>{`
        .user-profile {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 16px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 100%;
          margin: 0 auto;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .user-avatar {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f4ff;
          border-radius: 50%;
        }

        .user-address {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          font-family: 'Monaco', 'Courier New', monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sign-out-button {
          padding: 10px 20px;
          background: #f0f0f0;
          color: #333;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
          font-family: inherit;
        }

        .sign-out-button:hover {
          background: #e0e0e0;
          transform: translateY(-1px);
        }

        .sign-out-button:active {
          transform: translateY(0);
        }

        @media (max-width: 480px) {
          .user-profile {
            padding: 10px 12px;
            gap: 12px;
          }

          .user-avatar {
            width: 36px;
            height: 36px;
          }

          .user-avatar svg {
            width: 20px;
            height: 20px;
          }

          .user-address {
            font-size: 14px;
          }

          .sign-out-button {
            padding: 8px 16px;
            font-size: 13px;
          }
        }

        @media (max-width: 360px) {
          .user-profile {
            flex-direction: column;
            align-items: stretch;
          }

          .user-info {
            justify-content: center;
          }

          .sign-out-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
