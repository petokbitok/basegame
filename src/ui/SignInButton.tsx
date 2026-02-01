import React, { useState } from 'react';
import { BaseAccountAuth, UserIdentity } from '../auth';

interface SignInButtonProps {
  auth: BaseAccountAuth;
  onSignInSuccess?: (user: UserIdentity) => void;
  onSignInError?: (error: string) => void;
}

/**
 * Sign-in button component for Base Account authentication
 */
export const SignInButton: React.FC<SignInButtonProps> = ({
  auth,
  onSignInSuccess,
  onSignInError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await auth.signIn();

      if (result.success && result.user) {
        onSignInSuccess?.(result.user);
      } else {
        const errorMsg = result.error || 'Sign-in failed';
        setError(errorMsg);
        onSignInError?.(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred';
      setError(errorMsg);
      onSignInError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sign-in-container">
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="sign-in-button"
      >
        {isLoading ? 'Connecting...' : 'Sign in with Base'}
      </button>
      {error && <div className="error-message">{error}</div>}

      <style>{`
        .sign-in-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
          padding: 16px;
        }

        .sign-in-button {
          width: 100%;
          padding: 16px 24px;
          background: #0052ff;
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 82, 255, 0.2);
          font-family: inherit;
        }

        .sign-in-button:hover:not(:disabled) {
          background: #0041cc;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 82, 255, 0.3);
        }

        .sign-in-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .sign-in-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          width: 100%;
          background: #fff0f0;
          color: #d32f2f;
          padding: 14px;
          border-radius: 8px;
          font-size: 14px;
          text-align: center;
          border: 1px solid #ffcdd2;
          line-height: 1.4;
        }

        @media (max-width: 480px) {
          .sign-in-container {
            padding: 12px;
          }

          .sign-in-button {
            padding: 14px 20px;
            font-size: 15px;
          }

          .error-message {
            font-size: 13px;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};
