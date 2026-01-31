import { ethers } from 'ethers';

/**
 * Sponsored transaction configuration
 */
export interface SponsoredTransaction {
  to: string;
  value: string;
  data: string;
}

/**
 * Paymaster spending limits
 */
export interface SpendingLimit {
  dailyLimit: bigint;
  remainingToday: bigint;
  perTransactionLimit: bigint;
}

/**
 * Paymaster service result
 */
export interface PaymasterResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasSponsored?: boolean;
}

/**
 * Paymaster configuration
 */
export interface PaymasterConfig {
  serviceUrl: string;
  dailyLimit?: bigint;
  perTransactionLimit?: bigint;
}

/**
 * Paymaster service for sponsoring gas fees on Base blockchain
 * Integrates with Base Account SDK to provide gasless transactions
 * Following Base documentation: https://docs.base.org/base-account/improve-ux/sponsor-gas/paymasters
 */
export class PaymasterService {
  private provider: any; // Base Account provider
  private config: PaymasterConfig;
  private transactionLog: Array<{
    txHash: string;
    timestamp: number;
    gasSponsored: bigint;
  }> = [];

  constructor(provider: any, config: PaymasterConfig) {
    this.provider = provider;
    this.config = {
      serviceUrl: config.serviceUrl,
      dailyLimit: config.dailyLimit || ethers.parseEther('0.1'), // 0.1 ETH default
      perTransactionLimit:
        config.perTransactionLimit || ethers.parseEther('0.01'), // 0.01 ETH default
    };
  }

  /**
   * Send a sponsored transaction using wallet_sendCalls
   * Following Base Account documentation for transaction sponsorship
   * @param fromAddress User's address
   * @param calls Array of transaction calls to sponsor
   * @param chainId Chain ID (Base mainnet = 8453)
   * @returns Promise<PaymasterResult> Transaction result
   */
  async sponsorTransaction(
    fromAddress: string,
    calls: SponsoredTransaction[],
    chainId: number = 8453 // Base mainnet
  ): Promise<PaymasterResult> {
    try {
      // Check if transaction is eligible for sponsorship
      if (!this.isTransactionEligible(calls)) {
        return {
          success: false,
          error: 'Transaction exceeds spending limits',
          gasSponsored: false,
        };
      }

      // Send transaction with paymaster capabilities
      const result = await this.provider.request({
        method: 'wallet_sendCalls',
        params: [
          {
            version: '1.0',
            chainId: `0x${chainId.toString(16)}`,
            from: fromAddress,
            calls: calls,
            capabilities: {
              paymasterService: {
                url: this.config.serviceUrl,
              },
            },
          },
        ],
      });

      // Log the sponsored transaction
      this.logTransaction(result, BigInt(0)); // Gas amount would come from receipt

      return {
        success: true,
        txHash: result,
        gasSponsored: true,
      };
    } catch (error: any) {
      // Check if error is due to Paymaster unavailability
      if (this.isPaymasterError(error)) {
        return {
          success: false,
          error: 'Paymaster service unavailable. Please try again or pay gas manually.',
          gasSponsored: false,
        };
      }

      return {
        success: false,
        error: error.message || 'Transaction failed',
        gasSponsored: false,
      };
    }
  }

  /**
   * Check if a transaction is eligible for gas sponsorship
   * @param calls Transaction calls
   * @returns boolean True if eligible
   */
  isTransactionEligible(calls: SponsoredTransaction[]): boolean {
    // Estimate total value (simplified - in production, estimate gas too)
    let totalValue = BigInt(0);

    for (const call of calls) {
      try {
        totalValue += BigInt(call.value || '0');
      } catch {
        return false;
      }
    }

    // Check per-transaction limit
    if (
      this.config.perTransactionLimit &&
      totalValue > this.config.perTransactionLimit
    ) {
      return false;
    }

    // Check daily limit
    const todaySpent = this.getTodaySpending();
    if (
      this.config.dailyLimit &&
      todaySpent + totalValue > this.config.dailyLimit
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get spending limit information
   * @returns Promise<SpendingLimit> Spending limits
   */
  async getSpendingLimit(): Promise<SpendingLimit> {
    const todaySpent = this.getTodaySpending();

    return {
      dailyLimit: this.config.dailyLimit || BigInt(0),
      remainingToday:
        (this.config.dailyLimit || BigInt(0)) - todaySpent > BigInt(0)
          ? (this.config.dailyLimit || BigInt(0)) - todaySpent
          : BigInt(0),
      perTransactionLimit: this.config.perTransactionLimit || BigInt(0),
    };
  }

  /**
   * Get total spending for today
   * @returns bigint Total spent today
   */
  private getTodaySpending(): bigint {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return this.transactionLog
      .filter((log) => log.timestamp >= todayTimestamp)
      .reduce((sum, log) => sum + log.gasSponsored, BigInt(0));
  }

  /**
   * Log a sponsored transaction
   * @param txHash Transaction hash
   * @param gasSponsored Amount of gas sponsored
   */
  private logTransaction(txHash: string, gasSponsored: bigint): void {
    this.transactionLog.push({
      txHash,
      timestamp: Date.now(),
      gasSponsored,
    });

    // Keep only last 1000 transactions
    if (this.transactionLog.length > 1000) {
      this.transactionLog = this.transactionLog.slice(-1000);
    }
  }

  /**
   * Check if an error is related to Paymaster service
   * @param error Error object
   * @returns boolean True if Paymaster error
   */
  private isPaymasterError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    return (
      errorMessage.includes('paymaster') ||
      errorMessage.includes('gas sponsor') ||
      errorMessage.includes('service unavailable')
    );
  }

  /**
   * Get transaction logs for monitoring
   * @param limit Number of recent transactions to return
   * @returns Array of transaction logs
   */
  getTransactionLogs(limit: number = 100): Array<{
    txHash: string;
    timestamp: number;
    gasSponsored: bigint;
  }> {
    return this.transactionLog.slice(-limit);
  }

  /**
   * Clear transaction logs (useful for testing)
   */
  clearLogs(): void {
    this.transactionLog = [];
  }

  /**
   * Update Paymaster configuration
   * @param config New configuration
   */
  updateConfig(config: Partial<PaymasterConfig>): void {
    if (config.serviceUrl) {
      this.config.serviceUrl = config.serviceUrl;
    }
    if (config.dailyLimit !== undefined) {
      this.config.dailyLimit = config.dailyLimit;
    }
    if (config.perTransactionLimit !== undefined) {
      this.config.perTransactionLimit = config.perTransactionLimit;
    }
  }

  /**
   * Get current configuration
   * @returns PaymasterConfig Current configuration
   */
  getConfig(): PaymasterConfig {
    return { ...this.config };
  }
}
