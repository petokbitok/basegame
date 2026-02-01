import React, { useState, useEffect } from 'react';
import { BaseAccountAuth, UserIdentity } from '../auth';
import { getBasename, formatAddressOrBasename, getBasenameAvatar } from '../utils/basename';

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
  const [basename, setBasename] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBasename = async () => {
      if (!user.address) return;
      
      setLoading(true);
      try {
        const name = await getBasename(user.address);
        setBasename(name);
        
        if (name) {
          const avatarUrl = await getBasenameAvatar(name);
          setAvatar(avatarUrl);
        }
      } catch (error) {
        console.error('Error fetching Basename:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBasename();
  }, [user.address]);

  const handleSignOut = () => {
    auth.signOut();
    onSignOut?.();
  };

  const displayName = formatAddressOrBasename(user.address, basename);

  return (
    <div className="user-profile">
      <div className="user-info">
        <div className="user-avatar">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="avatar-image" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#0052ff" opacity="0.1"/>
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#0052ff"/>
            </svg>
          )}
        </div>
        <div className="user-details">
          <span className="user-name">
            {loading ? '...' : displayName}
          </span>
          {basename && (
            <span className="basename-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              Basename
            </span>
          )}
        </div>
      </div>
      <button onClick={handleSignOut} className="sign-out-button">
        Sign Out
      </button>

      <style>{`
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
          overflow: hidden;
        }

        .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          font-family: 'Monaco', 'Courier New', monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .basename-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #0052ff;
          background: #e6f0ff;
          padding: 2px 8px;
          border-radius: 12px;
          width: fit-content;
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

          .user-name {
            font-size: 14px;
          }

          .basename-badge {
            font-size: 10px;
            padding: 2px 6px;
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
