import * as fc from 'fast-check';
import {
  TransactionLogger,
  TransactionType,
  TransactionStatus,
} from '../TransactionLogger';

describe('TransactionLogger Property Tests', () => {
  /**
   * Property 25: Transaction Logging
   * For any sponsored transaction, a log entry should be created with transaction details
   * Validates: Requirements 10.5
   */
  describe('Property 25: Transaction Logging', () => {
    it('should log all transactions with complete details', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              txHash: fc.hexaString({ minLength: 64, maxLength: 66 }),
              type: fc.constantFrom(
                TransactionType.UPDATE_STATS,
                TransactionType.BATCH_UPDATE_STATS,
                TransactionType.OTHER
              ),
              playerAddress: fc.hexaString({ minLength: 40, maxLength: 42 }),
              gasSponsored: fc.boolean(),
              status: fc.constantFrom(
                TransactionStatus.PENDING,
                TransactionStatus.CONFIRMED,
                TransactionStatus.FAILED
              ),
            }),
            { minLength: 1, maxLength: 50 }
          ),
          (transactions) => {
            const logger = new TransactionLogger();

            // Log all transactions
            transactions.forEach((tx) => {
              logger.logTransaction({
                txHash: tx.txHash.startsWith('0x')
                  ? tx.txHash
                  : `0x${tx.txHash}`,
                type: tx.type,
                playerAddress: tx.playerAddress.startsWith('0x')
                  ? tx.playerAddress
                  : `0x${tx.playerAddress}`,
                gasSponsored: tx.gasSponsored,
                status: tx.status,
              });
            });

            // All transactions should be logged
            const logs = logger.getLogs();
            expect(logs.length).toBe(transactions.length);

            // Each log should have all required fields
            logs.forEach((log) => {
              expect(log.txHash).toBeDefined();
              expect(log.timestamp).toBeGreaterThan(0);
              expect(log.type).toBeDefined();
              expect(log.playerAddress).toBeDefined();
              expect(typeof log.gasSponsored).toBe('boolean');
              expect(log.status).toBeDefined();
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain log order (FIFO)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              txHash: fc.hexaString({ minLength: 64, maxLength: 66 }),
              playerAddress: fc.hexaString({ minLength: 40, maxLength: 42 }),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          (transactions) => {
            const logger = new TransactionLogger();

            // Log transactions in order
            transactions.forEach((tx) => {
              logger.logTransaction({
                txHash: tx.txHash.startsWith('0x')
                  ? tx.txHash
                  : `0x${tx.txHash}`,
                type: TransactionType.UPDATE_STATS,
                playerAddress: tx.playerAddress.startsWith('0x')
                  ? tx.playerAddress
                  : `0x${tx.playerAddress}`,
                gasSponsored: true,
                status: TransactionStatus.CONFIRMED,
              });
            });

            const logs = logger.getLogs();

            // Timestamps should be in ascending order
            for (let i = 1; i < logs.length; i++) {
              expect(logs[i].timestamp).toBeGreaterThanOrEqual(
                logs[i - 1].timestamp
              );
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Log Filtering Property
   * For any set of transactions, filtering by player, type, or status should return
   * only matching transactions
   */
  describe('Log Filtering', () => {
    it('should filter logs by player address correctly', () => {
      fc.assert(
        fc.property(
          fc.hexaString({ minLength: 40, maxLength: 42 }),
          fc.array(
            fc.record({
              txHash: fc.hexaString({ minLength: 64, maxLength: 66 }),
              playerAddress: fc.hexaString({ minLength: 40, maxLength: 42 }),
            }),
            { minLength: 10, maxLength: 30 }
          ),
          (targetPlayer, transactions) => {
            const logger = new TransactionLogger();

            // Add target player address to some transactions
            const modifiedTransactions = transactions.map((tx, i) => ({
              ...tx,
              playerAddress: i % 3 === 0 ? targetPlayer : tx.playerAddress,
            }));

            modifiedTransactions.forEach((tx) => {
              logger.logTransaction({
                txHash: tx.txHash.startsWith('0x')
                  ? tx.txHash
                  : `0x${tx.txHash}`,
                type: TransactionType.UPDATE_STATS,
                playerAddress: tx.playerAddress.startsWith('0x')
                  ? tx.playerAddress
                  : `0x${tx.playerAddress}`,
                gasSponsored: true,
                status: TransactionStatus.CONFIRMED,
              });
            });

            const playerLogs = logger.getPlayerLogs(
              targetPlayer.startsWith('0x') ? targetPlayer : `0x${targetPlayer}`
            );

            // All returned logs should be for the target player
            playerLogs.forEach((log) => {
              expect(log.playerAddress.toLowerCase()).toBe(
                (targetPlayer.startsWith('0x')
                  ? targetPlayer
                  : `0x${targetPlayer}`
                ).toLowerCase()
              );
            });
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should filter logs by transaction type correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              txHash: fc.hexaString({ minLength: 64, maxLength: 66 }),
              type: fc.constantFrom(
                TransactionType.UPDATE_STATS,
                TransactionType.BATCH_UPDATE_STATS,
                TransactionType.OTHER
              ),
            }),
            { minLength: 10, maxLength: 30 }
          ),
          (transactions) => {
            const logger = new TransactionLogger();

            transactions.forEach((tx) => {
              logger.logTransaction({
                txHash: tx.txHash.startsWith('0x')
                  ? tx.txHash
                  : `0x${tx.txHash}`,
                type: tx.type,
                playerAddress: '0x1234567890123456789012345678901234567890',
                gasSponsored: true,
                status: TransactionStatus.CONFIRMED,
              });
            });

            // Filter by each type
            Object.values(TransactionType).forEach((type) => {
              const typeLogs = logger.getLogsByType(type);

              // All returned logs should be of the specified type
              typeLogs.forEach((log) => {
                expect(log.type).toBe(type);
              });

              // Count should match
              const expectedCount = transactions.filter(
                (tx) => tx.type === type
              ).length;
              expect(typeLogs.length).toBe(expectedCount);
            });
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Analytics Accuracy Property
   * For any set of transactions, analytics should accurately reflect the data
   */
  describe('Analytics Accuracy', () => {
    it('should calculate analytics correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              txHash: fc.hexaString({ minLength: 64, maxLength: 66 }),
              gasSponsored: fc.boolean(),
              status: fc.constantFrom(
                TransactionStatus.CONFIRMED,
                TransactionStatus.FAILED
              ),
            }),
            { minLength: 10, maxLength: 50 }
          ),
          (transactions) => {
            const logger = new TransactionLogger();

            transactions.forEach((tx) => {
              logger.logTransaction({
                txHash: tx.txHash.startsWith('0x')
                  ? tx.txHash
                  : `0x${tx.txHash}`,
                type: TransactionType.UPDATE_STATS,
                playerAddress: '0x1234567890123456789012345678901234567890',
                gasSponsored: tx.gasSponsored,
                status: tx.status,
              });
            });

            const analytics = logger.getAnalytics();

            // Total transactions should match
            expect(analytics.totalTransactions).toBe(transactions.length);

            // Successful transactions count
            const expectedSuccessful = transactions.filter(
              (tx) => tx.status === TransactionStatus.CONFIRMED
            ).length;
            expect(analytics.successfulTransactions).toBe(expectedSuccessful);

            // Failed transactions count
            const expectedFailed = transactions.filter(
              (tx) => tx.status === TransactionStatus.FAILED
            ).length;
            expect(analytics.failedTransactions).toBe(expectedFailed);

            // Sponsored transactions count
            const sponsoredCount = logger.getSponsoredTransactionsCount();
            const expectedSponsored = transactions.filter(
              (tx) => tx.gasSponsored
            ).length;
            expect(sponsoredCount).toBe(expectedSponsored);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Log Capacity Property
   * For any number of transactions exceeding max capacity, only the most recent
   * transactions should be kept
   */
  describe('Log Capacity Management', () => {
    it('should maintain only maxLogs entries', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 50 }),
          fc.integer({ min: 60, max: 100 }),
          (maxLogs, totalTransactions) => {
            const logger = new TransactionLogger(maxLogs);

            // Log more transactions than max
            for (let i = 0; i < totalTransactions; i++) {
              logger.logTransaction({
                txHash: `0x${i.toString(16).padStart(64, '0')}`,
                type: TransactionType.UPDATE_STATS,
                playerAddress: '0x1234567890123456789012345678901234567890',
                gasSponsored: true,
                status: TransactionStatus.CONFIRMED,
              });
            }

            const logs = logger.getLogs();

            // Should not exceed max
            expect(logs.length).toBeLessThanOrEqual(maxLogs);

            // Should keep the most recent ones
            if (totalTransactions > maxLogs) {
              expect(logs.length).toBe(maxLogs);
            } else {
              expect(logs.length).toBe(totalTransactions);
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
