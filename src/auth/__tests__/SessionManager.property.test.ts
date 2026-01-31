import * as fc from 'fast-check';
import { SessionManager } from '../SessionManager';
import { UserIdentity } from '../BaseAccountAuth';

describe('SessionManager Property Tests', () => {
  /**
   * Property 22: Session Cleanup
   * For any authenticated session, when sign-out occurs, all session data should be cleared
   * and the user should return to unauthenticated state
   * Validates: Requirements 9.6
   */
  describe('Property 22: Session Cleanup', () => {
    it('should clear all session data on sign-out', () => {
      fc.assert(
        fc.property(
          fc.record({
            address: fc.hexaString({ minLength: 40, maxLength: 42 }),
            message: fc.string({ minLength: 10, maxLength: 200 }),
            signature: fc.hexaString({ minLength: 130, maxLength: 132 }),
          }),
          (userData) => {
            const sessionManager = new SessionManager();
            
            // Create a session
            const user: UserIdentity = {
              address: userData.address.startsWith('0x') ? userData.address : `0x${userData.address}`,
              message: userData.message,
              signature: userData.signature.startsWith('0x') ? userData.signature : `0x${userData.signature}`,
            };
            
            sessionManager.createSession(user);
            
            // Verify session exists
            expect(sessionManager.hasActiveSession()).toBe(true);
            expect(sessionManager.getAuthenticatedUser()).not.toBeNull();
            
            // Clear session
            sessionManager.clearSession();
            
            // Verify session is cleared
            expect(sessionManager.hasActiveSession()).toBe(false);
            expect(sessionManager.getAuthenticatedUser()).toBeNull();
            expect(sessionManager.getSession()).toBeNull();
            expect(sessionManager.getTimeRemaining()).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple sign-out calls gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            address: fc.hexaString({ minLength: 40, maxLength: 42 }),
          }),
          (userData) => {
            const sessionManager = new SessionManager();
            
            const user: UserIdentity = {
              address: userData.address.startsWith('0x') ? userData.address : `0x${userData.address}`,
            };
            
            sessionManager.createSession(user);
            
            // Clear session multiple times
            sessionManager.clearSession();
            sessionManager.clearSession();
            sessionManager.clearSession();
            
            // Should still be in cleared state
            expect(sessionManager.hasActiveSession()).toBe(false);
            expect(sessionManager.getAuthenticatedUser()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Session Persistence Property
   * For any authenticated session, the session should remain valid until explicit sign-out
   * or token expiration
   * Validates: Requirements 9.5
   */
  describe('Session Persistence', () => {
    it('should maintain session data until expiration or sign-out', () => {
      fc.assert(
        fc.property(
          fc.record({
            address: fc.hexaString({ minLength: 40, maxLength: 42 }),
            message: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          (userData) => {
            const sessionManager = new SessionManager();
            
            const user: UserIdentity = {
              address: userData.address.startsWith('0x') ? userData.address : `0x${userData.address}`,
              message: userData.message,
            };
            
            sessionManager.createSession(user);
            
            // Session should be active
            expect(sessionManager.hasActiveSession()).toBe(true);
            
            // User data should be retrievable
            const retrievedUser = sessionManager.getAuthenticatedUser();
            expect(retrievedUser).not.toBeNull();
            expect(retrievedUser?.address).toBe(user.address);
            expect(retrievedUser?.message).toBe(user.message);
            
            // Session should have time remaining
            expect(sessionManager.getTimeRemaining()).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should refresh session and extend expiration time', () => {
      fc.assert(
        fc.property(
          fc.record({
            address: fc.hexaString({ minLength: 40, maxLength: 42 }),
          }),
          (userData) => {
            const sessionManager = new SessionManager();
            
            const user: UserIdentity = {
              address: userData.address.startsWith('0x') ? userData.address : `0x${userData.address}`,
            };
            
            sessionManager.createSession(user);
            
            const initialTimeRemaining = sessionManager.getTimeRemaining();
            
            // Wait a tiny bit (simulated)
            const session = sessionManager.getSession();
            if (session) {
              session.expiresAt -= 1000; // Reduce expiration by 1 second
            }
            
            const reducedTimeRemaining = sessionManager.getTimeRemaining();
            expect(reducedTimeRemaining).toBeLessThan(initialTimeRemaining);
            
            // Refresh session
            const refreshed = sessionManager.refreshSession();
            expect(refreshed).toBe(true);
            
            // Time remaining should be extended
            const newTimeRemaining = sessionManager.getTimeRemaining();
            expect(newTimeRemaining).toBeGreaterThan(reducedTimeRemaining);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Session Expiration Property
   * For any session, when the expiration time is reached, the session should be
   * automatically invalidated
   */
  describe('Session Expiration', () => {
    it('should invalidate expired sessions', () => {
      fc.assert(
        fc.property(
          fc.record({
            address: fc.hexaString({ minLength: 40, maxLength: 42 }),
          }),
          (userData) => {
            const sessionManager = new SessionManager();
            
            const user: UserIdentity = {
              address: userData.address.startsWith('0x') ? userData.address : `0x${userData.address}`,
            };
            
            sessionManager.createSession(user);
            
            // Manually expire the session
            const session = sessionManager.getSession();
            if (session) {
              session.expiresAt = Date.now() - 1000; // Expire 1 second ago
            }
            
            // Session should be expired
            expect(sessionManager.isSessionExpired()).toBe(true);
            expect(sessionManager.hasActiveSession()).toBe(false);
            expect(sessionManager.getAuthenticatedUser()).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect sessions expiring soon', () => {
      fc.assert(
        fc.property(
          fc.record({
            address: fc.hexaString({ minLength: 40, maxLength: 42 }),
          }),
          (userData) => {
            const sessionManager = new SessionManager();
            
            const user: UserIdentity = {
              address: userData.address.startsWith('0x') ? userData.address : `0x${userData.address}`,
            };
            
            sessionManager.createSession(user);
            
            // Set expiration to 3 minutes from now
            const session = sessionManager.getSession();
            if (session) {
              session.expiresAt = Date.now() + (3 * 60 * 1000);
            }
            
            // Should detect expiring soon
            expect(sessionManager.isExpiringSoon()).toBe(true);
            
            // Set expiration to 10 minutes from now
            if (session) {
              session.expiresAt = Date.now() + (10 * 60 * 1000);
            }
            
            // Should not detect expiring soon
            expect(sessionManager.isExpiringSoon()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
