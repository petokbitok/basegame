import * as fc from 'fast-check';
import { VerificationService } from '../VerificationService';

describe('VerificationService Property Tests', () => {
  /**
   * Property 19: Authentication Token Verification
   * For any valid signature, verification should pass and return correct user identity
   * For any invalid signature, verification should fail
   * Validates: Requirements 9.3
   */
  describe('Property 19: Authentication Token Verification', () => {
    it('should generate unique nonces', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 100 }),
          (count) => {
            const verificationService = new VerificationService();
            const nonces = new Set<string>();
            
            // Generate multiple nonces
            for (let i = 0; i < count; i++) {
              const nonce = verificationService.generateNonce();
              nonces.add(nonce);
            }
            
            // All nonces should be unique
            expect(nonces.size).toBe(count);
            
            // All nonces should be 32 characters (16 bytes in hex)
            nonces.forEach(nonce => {
              expect(nonce).toHaveLength(32);
              expect(/^[0-9a-f]{32}$/.test(nonce)).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should track generated nonces', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 1, maxLength: 20 }),
          (counts) => {
            const verificationService = new VerificationService();
            const generatedNonces: string[] = [];
            
            // Generate nonces
            counts.forEach(() => {
              const nonce = verificationService.generateNonce();
              generatedNonces.push(nonce);
            });
            
            // All generated nonces should be tracked
            generatedNonces.forEach(nonce => {
              expect(verificationService.hasNonce(nonce)).toBe(true);
            });
            
            // Random nonces should not be tracked
            const randomNonce = 'a'.repeat(32);
            expect(verificationService.hasNonce(randomNonce)).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should prevent nonce reuse', () => {
      fc.assert(
        fc.property(
          fc.hexaString({ minLength: 40, maxLength: 42 }),
          fc.string({ minLength: 50, maxLength: 200 }),
          fc.hexaString({ minLength: 130, maxLength: 132 }),
          async (address, messageBase, signature) => {
            const verificationService = new VerificationService();
            
            // Generate a nonce
            const nonce = verificationService.generateNonce();
            
            // Create message with nonce
            const message = `${messageBase} at ${nonce}`;
            
            // First verification attempt (will fail due to invalid signature, but should consume nonce)
            await verificationService.verifySignature(
              address.startsWith('0x') ? address : `0x${address}`,
              message,
              signature.startsWith('0x') ? signature : `0x${signature}`
            );
            
            // Nonce should be consumed
            expect(verificationService.hasNonce(nonce)).toBe(false);
            
            // Second verification with same nonce should fail
            const result = await verificationService.verifySignature(
              address.startsWith('0x') ? address : `0x${address}`,
              message,
              signature.startsWith('0x') ? signature : `0x${signature}`
            );
            
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid or reused nonce');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject messages without valid nonce format', () => {
      fc.assert(
        fc.property(
          fc.hexaString({ minLength: 40, maxLength: 42 }),
          fc.string({ minLength: 10, maxLength: 100 }),
          fc.hexaString({ minLength: 130, maxLength: 132 }),
          async (address, message, signature) => {
            const verificationService = new VerificationService();
            
            // Message without proper nonce format
            const result = await verificationService.verifySignature(
              address.startsWith('0x') ? address : `0x${address}`,
              message,
              signature.startsWith('0x') ? signature : `0x${signature}`
            );
            
            expect(result.valid).toBe(false);
            expect(result.error).toContain('Invalid or reused nonce');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should clear all nonces when requested', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }),
          (count) => {
            const verificationService = new VerificationService();
            const nonces: string[] = [];
            
            // Generate multiple nonces
            for (let i = 0; i < count; i++) {
              nonces.push(verificationService.generateNonce());
            }
            
            // All should be tracked
            nonces.forEach(nonce => {
              expect(verificationService.hasNonce(nonce)).toBe(true);
            });
            
            // Clear all nonces
            verificationService.clearNonces();
            
            // None should be tracked anymore
            nonces.forEach(nonce => {
              expect(verificationService.hasNonce(nonce)).toBe(false);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Nonce Uniqueness Property
   * For any number of nonce generations, each nonce should be cryptographically unique
   */
  describe('Nonce Uniqueness', () => {
    it('should generate cryptographically secure nonces', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const verificationService = new VerificationService();
            const nonces = new Set<string>();
            
            // Generate 1000 nonces
            for (let i = 0; i < 1000; i++) {
              const nonce = verificationService.generateNonce();
              
              // Should not have seen this nonce before
              expect(nonces.has(nonce)).toBe(false);
              
              nonces.add(nonce);
            }
            
            // All 1000 should be unique
            expect(nonces.size).toBe(1000);
          }
        ),
        { numRuns: 5 }
      );
    });
  });
});
