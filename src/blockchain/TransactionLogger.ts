/**
 * Transaction log entry
 */
export interface TransactionLog {
  txHash: string;
  timestamp: number;
  type: TransactionType;
  playerAddress: string;
  gasSponsored: boolean;
  gasAmount?: bigint;
  status: TransactionStatus;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Transaction type
 */
export enum TransactionType {
  UPDATE_STATS = 'UPDATE_STATS',
  BATCH_UPDATE_STATS = 'BATCH_UPDATE_STATS',
  OTHER = 'OTHER',
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
}

/**
 * Transaction analytics data
 */
export interface TransactionAnalytics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalGasSponsored: bigint;
  averageGasPerTransaction: bigint;
  transactionsByType: Record<TransactionType, number>;
}

/**
 * Transaction logger for monitoring and analytics
 * Logs all blockchain transactions for the poker game
 */
export class TransactionLogger {
  private logs: TransactionLog[] = [];
  private maxLogs: number;

  constructor(maxLogs: number = 10000) {
    this.maxLogs = maxLogs;
  }

  /**
   * Log a new transaction
   * @param log Transaction log entry
   */
  logTransaction(log: Omit<TransactionLog, 'timestamp'>): void {
    const entry: TransactionLog = {
      ...log,
      timestamp: Date.now(),
    };

    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Update transaction status
   * @param txHash Transaction hash
   * @param status New status
   * @param error Optional error message
   */
  updateTransactionStatus(
    txHash: string,
    status: TransactionStatus,
    error?: string
  ): void {
    const log = this.logs.find((l) => l.txHash === txHash);
    if (log) {
      log.status = status;
      if (error) {
        log.error = error;
      }
    }
  }

  /**
   * Get all transaction logs
   * @param limit Optional limit on number of logs to return
   * @returns Array of transaction logs
   */
  getLogs(limit?: number): TransactionLog[] {
    if (limit) {
      return this.logs.slice(-limit);
    }
    return [...this.logs];
  }

  /**
   * Get logs for a specific player
   * @param playerAddress Player's Ethereum address
   * @param limit Optional limit on number of logs
   * @returns Array of transaction logs for the player
   */
  getPlayerLogs(playerAddress: string, limit?: number): TransactionLog[] {
    const playerLogs = this.logs.filter(
      (log) => log.playerAddress.toLowerCase() === playerAddress.toLowerCase()
    );

    if (limit) {
      return playerLogs.slice(-limit);
    }
    return playerLogs;
  }

  /**
   * Get logs by transaction type
   * @param type Transaction type
   * @param limit Optional limit on number of logs
   * @returns Array of transaction logs of the specified type
   */
  getLogsByType(type: TransactionType, limit?: number): TransactionLog[] {
    const typeLogs = this.logs.filter((log) => log.type === type);

    if (limit) {
      return typeLogs.slice(-limit);
    }
    return typeLogs;
  }

  /**
   * Get logs by status
   * @param status Transaction status
   * @param limit Optional limit on number of logs
   * @returns Array of transaction logs with the specified status
   */
  getLogsByStatus(
    status: TransactionStatus,
    limit?: number
  ): TransactionLog[] {
    const statusLogs = this.logs.filter((log) => log.status === status);

    if (limit) {
      return statusLogs.slice(-limit);
    }
    return statusLogs;
  }

  /**
   * Get logs within a time range
   * @param startTime Start timestamp (milliseconds)
   * @param endTime End timestamp (milliseconds)
   * @returns Array of transaction logs within the time range
   */
  getLogsByTimeRange(startTime: number, endTime: number): TransactionLog[] {
    return this.logs.filter(
      (log) => log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  /**
   * Get transaction analytics
   * @param timeRange Optional time range in milliseconds (e.g., last 24 hours)
   * @returns TransactionAnalytics Analytics data
   */
  getAnalytics(timeRange?: number): TransactionAnalytics {
    let logsToAnalyze = this.logs;

    if (timeRange) {
      const cutoffTime = Date.now() - timeRange;
      logsToAnalyze = this.logs.filter((log) => log.timestamp >= cutoffTime);
    }

    const totalTransactions = logsToAnalyze.length;
    const successfulTransactions = logsToAnalyze.filter(
      (log) => log.status === TransactionStatus.CONFIRMED
    ).length;
    const failedTransactions = logsToAnalyze.filter(
      (log) => log.status === TransactionStatus.FAILED
    ).length;

    let totalGasSponsored = BigInt(0);
    let gasTransactionCount = 0;

    const transactionsByType: Record<TransactionType, number> = {
      [TransactionType.UPDATE_STATS]: 0,
      [TransactionType.BATCH_UPDATE_STATS]: 0,
      [TransactionType.OTHER]: 0,
    };

    for (const log of logsToAnalyze) {
      if (log.gasSponsored && log.gasAmount) {
        totalGasSponsored += log.gasAmount;
        gasTransactionCount++;
      }

      transactionsByType[log.type]++;
    }

    const averageGasPerTransaction =
      gasTransactionCount > 0
        ? totalGasSponsored / BigInt(gasTransactionCount)
        : BigInt(0);

    return {
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      totalGasSponsored,
      averageGasPerTransaction,
      transactionsByType,
    };
  }

  /**
   * Get sponsored transactions count
   * @param timeRange Optional time range in milliseconds
   * @returns number Number of sponsored transactions
   */
  getSponsoredTransactionsCount(timeRange?: number): number {
    let logsToCheck = this.logs;

    if (timeRange) {
      const cutoffTime = Date.now() - timeRange;
      logsToCheck = this.logs.filter((log) => log.timestamp >= cutoffTime);
    }

    return logsToCheck.filter((log) => log.gasSponsored).length;
  }

  /**
   * Clear all logs (useful for testing)
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs to JSON
   * @returns string JSON string of all logs
   */
  exportToJSON(): string {
    return JSON.stringify(this.logs, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  }

  /**
   * Import logs from JSON
   * @param json JSON string of logs
   */
  importFromJSON(json: string): void {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) {
        this.logs = parsed.map((log) => ({
          ...log,
          gasAmount: log.gasAmount ? BigInt(log.gasAmount) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to import logs from JSON:', error);
    }
  }

  /**
   * Get the number of logs currently stored
   * @returns number Number of logs
   */
  getLogCount(): number {
    return this.logs.length;
  }

  /**
   * Get the maximum number of logs that can be stored
   * @returns number Maximum log count
   */
  getMaxLogs(): number {
    return this.maxLogs;
  }

  /**
   * Set the maximum number of logs to store
   * @param maxLogs New maximum
   */
  setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;

    // Trim if necessary
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
    }
  }
}
