import { ethers } from 'ethers';

/**
 * Player statistics from smart contract
 */
export interface PlayerStats {
  points: bigint;
  gamesWon: bigint;
  handsWon: bigint;
  biggestPot: bigint;
  lastUpdated: bigint;
}

/**
 * Leaderboard entry from smart contract
 */
export interface LeaderboardEntry {
  player: string;
  points: bigint;
  gamesWon: bigint;
  handsWon: bigint;
  rank: bigint;
}

/**
 * Contract interaction result
 */
export interface ContractResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  txHash?: string;
}

/**
 * Smart contract interaction service for PokerLeaderboardContract
 * Handles read and write operations to the leaderboard contract on Base mainnet
 */
export class ContractService {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private signer?: ethers.Signer;
  private contractAddress: string;

  // Contract ABI - only the functions we need
  private static readonly ABI = [
    'function updateStats(address player, uint256 points, uint256 gamesWon, uint256 handsWon, uint256 biggestPot) external',
    'function batchUpdateStats(address[] calldata playerAddresses, uint256[] calldata pointsArray, uint256[] calldata gamesWonArray, uint256[] calldata handsWonArray, uint256[] calldata biggestPotArray) external',
    'function getPlayerStats(address player) external view returns (tuple(uint256 points, uint256 gamesWon, uint256 handsWon, uint256 biggestPot, uint256 lastUpdated))',
    'function getTopPlayers(uint256 count) external view returns (tuple(address player, uint256 points, uint256 gamesWon, uint256 handsWon, uint256 rank)[])',
    'function pause() external',
    'function unpause() external',
    'event StatsUpdated(address indexed player, uint256 points, uint256 gamesWon, uint256 handsWon, uint256 biggestPot)',
  ];

  constructor(
    contractAddress: string,
    providerOrSigner: ethers.Provider | ethers.Signer
  ) {
    this.contractAddress = contractAddress;

    if ('provider' in providerOrSigner && providerOrSigner.provider) {
      // It's a signer
      this.signer = providerOrSigner as ethers.Signer;
      this.provider = providerOrSigner.provider!;
      this.contract = new ethers.Contract(
        contractAddress,
        ContractService.ABI,
        this.signer
      );
    } else {
      // It's a provider
      this.provider = providerOrSigner as ethers.Provider;
      this.contract = new ethers.Contract(
        contractAddress,
        ContractService.ABI,
        this.provider
      );
    }
  }

  /**
   * Get player statistics from the contract
   * @param playerAddress Player's Ethereum address
   * @returns Promise<ContractResult<PlayerStats>> Player statistics
   */
  async getPlayerStats(
    playerAddress: string
  ): Promise<ContractResult<PlayerStats>> {
    try {
      const stats = await this.contract.getPlayerStats(playerAddress);

      return {
        success: true,
        data: {
          points: stats.points,
          gamesWon: stats.gamesWon,
          handsWon: stats.handsWon,
          biggestPot: stats.biggestPot,
          lastUpdated: stats.lastUpdated,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get player stats',
      };
    }
  }

  /**
   * Get top players from the leaderboard
   * @param count Number of top players to retrieve
   * @returns Promise<ContractResult<LeaderboardEntry[]>> Top players
   */
  async getTopPlayers(
    count: number = 10
  ): Promise<ContractResult<LeaderboardEntry[]>> {
    try {
      const entries = await this.contract.getTopPlayers(count);

      const leaderboard: LeaderboardEntry[] = entries.map((entry: any) => ({
        player: entry.player,
        points: entry.points,
        gamesWon: entry.gamesWon,
        handsWon: entry.handsWon,
        rank: entry.rank,
      }));

      return {
        success: true,
        data: leaderboard,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get top players',
      };
    }
  }

  /**
   * Update player statistics on the contract
   * Requires GAME_MANAGER_ROLE
   * @param playerAddress Player's Ethereum address
   * @param points Total points (1 point per game won)
   * @param gamesWon Total games won
   * @param handsWon Total hands won
   * @param biggestPot Biggest pot won
   * @param retries Number of retry attempts on failure
   * @returns Promise<ContractResult<void>> Transaction result
   */
  async updateStats(
    playerAddress: string,
    points: number,
    gamesWon: number,
    handsWon: number,
    biggestPot: number,
    retries: number = 3
  ): Promise<ContractResult<void>> {
    if (!this.signer) {
      return {
        success: false,
        error: 'Signer required for write operations',
      };
    }

    let lastError: any;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const tx = await this.contract.updateStats(
          playerAddress,
          points,
          gamesWon,
          handsWon,
          biggestPot
        );

        const receipt = await tx.wait();

        return {
          success: true,
          txHash: receipt.hash,
        };
      } catch (error: any) {
        lastError = error;

        // If it's a revert or access control error, don't retry
        if (
          error.message?.includes('revert') ||
          error.message?.includes('AccessControl')
        ) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed to update stats',
    };
  }

  /**
   * Batch update statistics for multiple players
   * More gas-efficient than multiple individual updates
   * @param updates Array of player updates
   * @param retries Number of retry attempts on failure
   * @returns Promise<ContractResult<void>> Transaction result
   */
  async batchUpdateStats(
    updates: Array<{
      playerAddress: string;
      points: number;
      gamesWon: number;
      handsWon: number;
      biggestPot: number;
    }>,
    retries: number = 3
  ): Promise<ContractResult<void>> {
    if (!this.signer) {
      return {
        success: false,
        error: 'Signer required for write operations',
      };
    }

    const playerAddresses = updates.map((u) => u.playerAddress);
    const pointsArray = updates.map((u) => u.points);
    const gamesWonArray = updates.map((u) => u.gamesWon);
    const handsWonArray = updates.map((u) => u.handsWon);
    const biggestPotArray = updates.map((u) => u.biggestPot);

    let lastError: any;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const tx = await this.contract.batchUpdateStats(
          playerAddresses,
          pointsArray,
          gamesWonArray,
          handsWonArray,
          biggestPotArray
        );

        const receipt = await tx.wait();

        return {
          success: true,
          txHash: receipt.hash,
        };
      } catch (error: any) {
        lastError = error;

        // If it's a revert or access control error, don't retry
        if (
          error.message?.includes('revert') ||
          error.message?.includes('AccessControl')
        ) {
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < retries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed to batch update stats',
    };
  }

  /**
   * Listen for StatsUpdated events
   * @param callback Function to call when event is emitted
   * @returns Function to stop listening
   */
  onStatsUpdated(
    callback: (
      player: string,
      points: bigint,
      gamesWon: bigint,
      handsWon: bigint,
      biggestPot: bigint
    ) => void
  ): () => void {
    const filter = this.contract.filters.StatsUpdated();

    const listener = (
      player: string,
      points: bigint,
      gamesWon: bigint,
      handsWon: bigint,
      biggestPot: bigint
    ) => {
      callback(player, points, gamesWon, handsWon, biggestPot);
    };

    this.contract.on(filter, listener);

    // Return cleanup function
    return () => {
      this.contract.off(filter, listener);
    };
  }

  /**
   * Get the contract address
   * @returns string Contract address
   */
  getContractAddress(): string {
    return this.contractAddress;
  }

  /**
   * Get the provider instance
   * @returns ethers.Provider Provider instance
   */
  getProvider(): ethers.Provider {
    return this.provider;
  }

  /**
   * Check if the service has a signer (can perform write operations)
   * @returns boolean True if signer is available
   */
  hasSigner(): boolean {
    return this.signer !== undefined;
  }
}
