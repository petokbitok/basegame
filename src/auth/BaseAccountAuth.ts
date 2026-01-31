import { createBaseAccountSDK } from '@base-org/account';
import { SessionManager } from './SessionManager';

/**
 * User identity information from Base Account
 */
export interface UserIdentity {
  address: string;
  message?: string;
  signature?: string;
}

/**
 * Authentication result containing token and user data
 */
export interface AuthResult {
  user: UserIdentity;
  success: boolean;
  error?: string;
}

/**
 * Base Account authentication service
 * Handles sign-in, sign-out, and session management using Base Account SDK
 */
export class BaseAccountAuth {
  private provider: any;
  private sessionManager: SessionManager;
  private appName: string;
  private appLogoUrl: string;

  constructor(appName: string = 'Poker AI Game', appLogoUrl: string = 'https://base.org/logo.png') {
    this.appName = appName;
    this.appLogoUrl = appLogoUrl;
    this.sessionManager = new SessionManager();
    this.initializeProvider();
  }

  /**
   * Initialize the Base Account SDK provider
   */
  private initializeProvider(): void {
    const sdk = createBaseAccountSDK({
      appName: this.appName,
      appLogoUrl: this.appLogoUrl,
    });
    this.provider = sdk.getProvider();
  }

  /**
   * Generate a cryptographically secure nonce for authentication
   */
  generateSessionId(): string {
    if (typeof window !== 'undefined' && window.crypto) {
      return window.crypto.randomUUID().replace(/-/g, '');
    }
    // Fallback for Node.js environment
    try {
      const crypto = require('crypto');
      return crypto.randomBytes(16).toString('hex');
    } catch {
      // Final fallback - use timestamp and random
      return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
  }

  /**
   * Sign in with Base Account using wallet_connect method
   * Following Base Account documentation: https://docs.base.org/base-account/quickstart/web
   * @returns Promise<AuthResult> Authentication result with user data
   */
  async signIn(): Promise<AuthResult> {
    try {
      // Generate a fresh nonce for authentication
      const nonce = this.generateSessionId();

      // Connect and authenticate using wallet_connect method
      // Base mainnet chain ID: 8453 (0x2105 in hex)
      const { accounts } = await this.provider.request({
        method: 'wallet_connect',
        params: [
          {
            version: '1',
            capabilities: {
              signInWithEthereum: {
                nonce,
                chainId: '0x2105', // Base Mainnet - 8453
              },
            },
          },
        ],
      });

      const { address } = accounts[0];
      const { message, signature } = accounts[0].capabilities.signInWithEthereum;

      const user: UserIdentity = {
        address,
        message,
        signature,
      };

      // Create session for authenticated user
      this.sessionManager.createSession(user);

      return {
        user,
        success: true,
      };
    } catch (error: any) {
      return {
        user: { address: '' },
        success: false,
        error: error.message || 'Sign-in failed',
      };
    }
  }

  /**
   * Sign out and clear the current session
   */
  signOut(): void {
    this.sessionManager.clearSession();
  }

  /**
   * Get the currently authenticated user
   * @returns UserIdentity | null Current user or null if not authenticated
   */
  getAuthenticatedUser(): UserIdentity | null {
    return this.sessionManager.getAuthenticatedUser();
  }

  /**
   * Check if a user is currently authenticated
   * @returns boolean True if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return this.sessionManager.hasActiveSession();
  }

  /**
   * Get the session manager instance
   * @returns SessionManager Session manager
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Get the provider instance for direct access
   * @returns Provider instance
   */
  getProvider(): any {
    return this.provider;
  }
}
