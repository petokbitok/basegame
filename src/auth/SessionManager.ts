import { UserIdentity } from './BaseAccountAuth';

/**
 * Session data stored in memory
 */
export interface Session {
  user: UserIdentity;
  createdAt: number;
  expiresAt: number;
  isActive: boolean;
}

/**
 * Session manager for handling user authentication sessions
 * Manages session creation, validation, expiration, and cleanup
 */
export class SessionManager {
  private session: Session | null = null;
  private readonly SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Create a new session for an authenticated user
   * @param user User identity from authentication
   * @returns Session Created session
   */
  createSession(user: UserIdentity): Session {
    const now = Date.now();
    this.session = {
      user,
      createdAt: now,
      expiresAt: now + this.SESSION_DURATION,
      isActive: true,
    };
    return this.session;
  }

  /**
   * Get the current active session
   * @returns Session | null Current session or null if no active session
   */
  getSession(): Session | null {
    if (!this.session) {
      return null;
    }

    // Check if session has expired
    if (this.isSessionExpired()) {
      this.clearSession();
      return null;
    }

    return this.session;
  }

  /**
   * Check if the current session is expired
   * @returns boolean True if session is expired
   */
  isSessionExpired(): boolean {
    if (!this.session) {
      return true;
    }

    return Date.now() > this.session.expiresAt;
  }

  /**
   * Check if there is an active session
   * @returns boolean True if session is active and not expired
   */
  hasActiveSession(): boolean {
    const session = this.getSession();
    return session !== null && session.isActive;
  }

  /**
   * Refresh the current session, extending its expiration time
   * @returns boolean True if session was refreshed, false if no active session
   */
  refreshSession(): boolean {
    const session = this.getSession();
    if (!session) {
      return false;
    }

    session.expiresAt = Date.now() + this.SESSION_DURATION;
    return true;
  }

  /**
   * Clear the current session (sign out)
   */
  clearSession(): void {
    if (this.session) {
      this.session.isActive = false;
    }
    this.session = null;
  }

  /**
   * Get the authenticated user from the current session
   * @returns UserIdentity | null User identity or null if no active session
   */
  getAuthenticatedUser(): UserIdentity | null {
    const session = this.getSession();
    return session ? session.user : null;
  }

  /**
   * Get time remaining until session expires (in milliseconds)
   * @returns number Time remaining or 0 if no active session
   */
  getTimeRemaining(): number {
    const session = this.getSession();
    if (!session) {
      return 0;
    }

    const remaining = session.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Check if session will expire soon (within 5 minutes)
   * @returns boolean True if session expires soon
   */
  isExpiringSoon(): boolean {
    const timeRemaining = this.getTimeRemaining();
    const fiveMinutes = 5 * 60 * 1000;
    return timeRemaining > 0 && timeRemaining < fiveMinutes;
  }
}
