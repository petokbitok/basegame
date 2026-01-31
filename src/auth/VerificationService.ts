import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import crypto from 'crypto';

/**
 * Verification result from backend
 */
export interface VerificationResult {
  valid: boolean;
  address?: string;
  error?: string;
}

/**
 * Backend JWT verification service for Base Account authentication
 * Verifies SIWE (Sign-In with Ethereum) signatures
 */
export class VerificationService {
  private client: any;
  private nonces: Set<string>;

  constructor() {
    // Create viem public client for Base mainnet
    this.client = createPublicClient({
      chain: base,
      transport: http(),
    });
    
    // In-memory nonce store (use Redis or database in production)
    this.nonces = new Set<string>();
  }

  /**
   * Generate a cryptographically secure nonce for authentication
   * @returns string Hex-encoded nonce
   */
  generateNonce(): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    this.nonces.add(nonce);
    return nonce;
  }

  /**
   * Verify a SIWE signature from Base Account
   * @param address User's Ethereum address
   * @param message Signed message
   * @param signature Signature from user's wallet
   * @returns Promise<VerificationResult> Verification result
   */
  async verifySignature(
    address: string,
    message: string,
    signature: string
  ): Promise<VerificationResult> {
    try {
      // 1. Extract and validate nonce from message
      const nonceMatch = message.match(/at (\w{32})$/);
      const nonce = nonceMatch?.[1];

      if (!nonce || !this.nonces.has(nonce)) {
        return {
          valid: false,
          error: 'Invalid or reused nonce',
        };
      }

      // 2. Remove nonce to prevent reuse
      this.nonces.delete(nonce);

      // 3. Verify signature using viem
      const valid = await this.client.verifyMessage({
        address,
        message,
        signature,
      });

      if (!valid) {
        return {
          valid: false,
          error: 'Invalid signature',
        };
      }

      // 4. Return success with user address
      return {
        valid: true,
        address,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Verification failed',
      };
    }
  }

  /**
   * Check if a nonce exists and is valid
   * @param nonce Nonce to check
   * @returns boolean True if nonce is valid
   */
  hasNonce(nonce: string): boolean {
    return this.nonces.has(nonce);
  }

  /**
   * Clear all stored nonces (useful for testing)
   */
  clearNonces(): void {
    this.nonces.clear();
  }
}
