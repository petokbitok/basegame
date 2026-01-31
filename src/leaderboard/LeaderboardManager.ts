import { ContractService, LeaderboardEntry } from '../blockchain';

/**
 * Local player statistics (using numbers for local storage)
 */
export interface LocalPlayerStats {
  address: string;
  points: number;
  gamesWon: number;
  handsWon: number;
  biggestPot: number;
  lastActive: number;
}

/**
 * Game result for leaderboard update
 */
export interface GameResult {
  playerId: string;
  playerAddress: string;
  gameWon: boolean;
  handsWon: number;
  biggestPot: number;
}

/**
 * Save result from blockchain
 */
export interface SaveResult {
  success: boolean;
  timestamp: number;
  txHash?: string;
  error?: string;
}

/**
 * Leaderboard manager for tracking player statistics and blockchain saves
 * Manages local statistics and manual saves to blockchain
 */
export class LeaderboardManager {
  private contractService: ContractService;
  private localStats: Map<string, LocalPlayerStats>;
  private lastSaveTimestamps: Map<string, number>;
  private leaderboardCache: LeaderboardEntry[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly SAVE_THROTTLE = 30 * 1000; // 30 seconds

  constructor(contractService: ContractService) {
    this.contractService = contractService;
    this.localStats = new Map();
    this.lastSaveTimestamps = new Map();
  }

  /**
   * Update player statistics after a game
   * @param gameResult Game result
   */
  async updatePlayerStats(gameResult: GameResult): Promise<void> {
    const { playerAddress, gameWon, handsWon, biggestPot } = gameResult;

    // Get current stats or create new
    let stats = this.localStats.get(playerAddress);

    if (!stats) {
      stats = {
        address: playerAddress,
        points: 0,
        gamesWon: 0,
        handsWon: 0,
        biggestPot: 0,
        lastActive: Date.now(),
      };
    }

    // Update stats
    if (gameWon) {
      stats.gamesWon++;
      stats.points++; // 1 point per game won
    }
    stats.handsWon += handsWon;
    stats.biggestPot = Math.max(stats.biggestPot, biggestPot);
    stats.lastActive = Date.now();

    this.localStats.set(playerAddress, stats);

    // Invalidate cache
    this.leaderboardCache = null;
  }

  /**
   * Sync local stats with blockchain on startup
   * Loads blockchain stats and merges with local stats
   * @param playerAddress Player's Ethereum address
   * @returns Promise<boolean> True if sync successful
   */
  async syncWithBlockchain(playerAddress: string): Promise<boolean> {
    try {
      // Get stats from blockchain
      const result = await this.contractService.getPlayerStats(playerAddress);

      if (!result.success || !result.data) {
        // No blockchain data, keep local stats
        return false;
      }

      const blockchainStats = result.data;
      const localStats = this.localStats.get(playerAddress);

      // Convert bigint to number
      const blockchainData = {
        address: playerAddress,
        points: Number(blockchainStats.points),
        gamesWon: Number(blockchainStats.gamesWon),
        handsWon: Number(blockchainStats.handsWon),
        biggestPot: Number(blockchainStats.biggestPot),
        lastActive: Date.now(),
      };

      if (!localStats) {
        // No local stats, use blockchain data
        this.localStats.set(playerAddress, blockchainData);
        return true;
      }

      // Merge: use higher values (blockchain is source of truth for saved data)
      const mergedStats = {
        address: playerAddress,
        points: Math.max(localStats.points, blockchainData.points),
        gamesWon: Math.max(localStats.gamesWon, blockchainData.gamesWon),
        handsWon: Math.max(localStats.handsWon, blockchainData.handsWon),
        biggestPot: Math.max(localStats.biggestPot, blockchainData.biggestPot),
        lastActive: Date.now(),
      };

      this.localStats.set(playerAddress, mergedStats);
      return true;
    } catch (error) {
      console.error('Failed to sync with blockchain:', error);
      return false;
    }
  }

  /**
   * Check if local stats have unsaved progress
   * @param playerAddress Player's Ethereum address
   * @returns Promise<boolean> True if there is unsaved progress
   */
  async hasUnsavedProgress(playerAddress: string): Promise<boolean> {
    try {
      const localStats = this.localStats.get(playerAddress);
      if (!localStats) {
        return false;
      }

      // Get blockchain stats
      const result = await this.contractService.getPlayerStats(playerAddress);
      if (!result.success || !result.data) {
        // No blockchain data, so local stats are unsaved
        return localStats.points > 0 || localStats.gamesWon > 0 || localStats.handsWon > 0 || localStats.biggestPot > 0;
      }

      const blockchainStats = result.data;

      // Check if local stats are higher than blockchain
      return (
        localStats.points > Number(blockchainStats.points) ||
        localStats.gamesWon > Number(blockchainStats.gamesWon) ||
        localStats.handsWon > Number(blockchainStats.handsWon) ||
        localStats.biggestPot > Number(blockchainStats.biggestPot)
      );
    } catch (error) {
      console.error('Failed to check unsaved progress:', error);
      return false;
    }
  }

  /**
   * Get unsaved progress details
   * @param playerAddress Player's Ethereum address
   * @returns Promise<object | null> Unsaved progress details or null
   */
  async getUnsavedProgress(playerAddress: string): Promise<{
    pointsDiff: number;
    gamesWonDiff: number;
    handsWonDiff: number;
    biggestPotDiff: number;
  } | null> {
    try {
      const localStats = this.localStats.get(playerAddress);
      if (!localStats) {
        return null;
      }

      const result = await this.contractService.getPlayerStats(playerAddress);
      if (!result.success || !result.data) {
        return {
          pointsDiff: localStats.points,
          gamesWonDiff: localStats.gamesWon,
          handsWonDiff: localStats.handsWon,
          biggestPotDiff: localStats.biggestPot,
        };
      }

      const blockchainStats = result.data;

      return {
        pointsDiff: Math.max(0, localStats.points - Number(blockchainStats.points)),
        gamesWonDiff: Math.max(0, localStats.gamesWon - Number(blockchainStats.gamesWon)),
        handsWonDiff: Math.max(0, localStats.handsWon - Number(blockchainStats.handsWon)),
        biggestPotDiff: Math.max(0, localStats.biggestPot - Number(blockchainStats.biggestPot)),
      };
    } catch (error) {
      console.error('Failed to get unsaved progress:', error);
      return null;
    }
  }

  /**
   * Manually save player statistics to blockchain
   * @param playerAddress Player's Ethereum address
   * @returns Promise<SaveResult> Save result
   */
  async saveToBlockchain(playerAddress: string): Promise<SaveResult> {
    // Check throttle
    const lastSave = this.lastSaveTimestamps.get(playerAddress) || 0;
    const timeSinceLastSave = Date.now() - lastSave;

    if (timeSinceLastSave < this.SAVE_THROTTLE) {
      return {
        success: false,
        timestamp: Date.now(),
        error: `Please wait ${Math.ceil((this.SAVE_THROTTLE - timeSinceLastSave) / 1000)} seconds before saving again`,
      };
    }

    // Get local stats
    const stats = this.localStats.get(playerAddress);

    if (!stats) {
      return {
        success: false,
        timestamp: Date.now(),
        error: 'No statistics found for player',
      };
    }

    // Save to blockchain
    const result = await this.contractService.updateStats(
      playerAddress,
      stats.points,
      stats.gamesWon,
      stats.handsWon,
      stats.biggestPot
    );

    if (result.success) {
      this.lastSaveTimestamps.set(playerAddress, Date.now());
      this.leaderboardCache = null; // Invalidate cache

      return {
        success: true,
        timestamp: Date.now(),
        txHash: result.txHash,
      };
    } else {
      return {
        success: false,
        timestamp: Date.now(),
        error: result.error,
      };
    }
  }

  /**
   * Get top players from leaderboard (with caching)
   * @param count Number of players to retrieve
   * @returns Promise<LeaderboardEntry[]> Top players
   */
  async getTopPlayers(count: number = 10): Promise<LeaderboardEntry[]> {
    // Check cache
    if (
      this.leaderboardCache &&
      Date.now() - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return this.leaderboardCache.slice(0, count);
    }

    // Fetch from blockchain
    const result = await this.contractService.getTopPlayers(count);

    if (result.success && result.data) {
      this.leaderboardCache = result.data;
      this.cacheTimestamp = Date.now();
      return result.data;
    }

    return [];
  }

  /**
   * Get player ranking
   * @param playerAddress Player's Ethereum address
   * @returns Promise<number | null> Player's rank or null
   */
  async getPlayerRanking(playerAddress: string): Promise<number | null> {
    const topPlayers = await this.getTopPlayers(100);
    const playerEntry = topPlayers.find(
      (entry) => entry.player.toLowerCase() === playerAddress.toLowerCase()
    );

    return playerEntry ? Number(playerEntry.rank) : null;
  }

  /**
   * Refresh leaderboard cache
   */
  async refreshLeaderboard(): Promise<void> {
    this.leaderboardCache = null;
    await this.getTopPlayers();
  }

  /**
   * Get last save timestamp for a player
   * @param playerAddress Player's Ethereum address
   * @returns number Timestamp or 0
   */
  getLastSaveTimestamp(playerAddress: string): number {
    return this.lastSaveTimestamps.get(playerAddress) || 0;
  }

  /**
   * Check if player can save (not throttled)
   * @param playerAddress Player's Ethereum address
   * @returns boolean True if can save
   */
  canSave(playerAddress: string): boolean {
    const lastSave = this.lastSaveTimestamps.get(playerAddress) || 0;
    return Date.now() - lastSave >= this.SAVE_THROTTLE;
  }

  /**
   * Get time until player can save again
   * @param playerAddress Player's Ethereum address
   * @returns number Seconds until can save
   */
  getTimeUntilCanSave(playerAddress: string): number {
    if (this.canSave(playerAddress)) {
      return 0;
    }

    const lastSave = this.lastSaveTimestamps.get(playerAddress) || 0;
    const timeSinceLastSave = Date.now() - lastSave;
    return Math.ceil((this.SAVE_THROTTLE - timeSinceLastSave) / 1000);
  }

  /**
   * Get local statistics for a player
   * @param playerAddress Player's Ethereum address
   * @returns LocalPlayerStats | null Local stats or null
   */
  getLocalStats(playerAddress: string): LocalPlayerStats | null {
    return this.localStats.get(playerAddress) || null;
  }
}
