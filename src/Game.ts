import { GameEngine } from './engine/GameEngine';
import { GameFlowManager } from './engine/GameFlowManager';
import { AIPlayer } from './ai/AIPlayer';
import { BaseAccountAuth } from './auth/BaseAccountAuth';
import { ContractService } from './blockchain/ContractService';
import { PaymasterService } from './blockchain/PaymasterService';
import { LeaderboardManager } from './leaderboard/LeaderboardManager';
import { GamePersistence } from './persistence/GamePersistence';
import { MiniAppContext } from './miniapp/MiniAppContext';
import { Player, Position, ActionType } from './types';

/**
 * Main Game class that coordinates all systems
 * Integrates game engine, AI, blockchain, authentication, and persistence
 */
export class Game {
  private engine: GameEngine;
  private flowManager: GameFlowManager;
  private aiPlayers: Map<string, AIPlayer>;
  private auth: BaseAccountAuth;
  private contractService?: ContractService;
  private paymasterService?: PaymasterService;
  private leaderboardManager?: LeaderboardManager;
  private persistence: GamePersistence;
  private miniAppContext: MiniAppContext;
  private isRunning: boolean = false;

  constructor(
    numAIPlayers: number = 3,
    startingChips: number = 1000,
    smallBlind: number = 10,
    bigBlind: number = 20
  ) {
    // Initialize players
    const players: Player[] = [];

    // Human player
    players.push({
      id: 'human',
      name: 'You',
      chipStack: startingChips,
      holeCards: [],
      currentBet: 0,
      position: Position.DEALER,
      isActive: true,
      isAllIn: false,
      lastAction: null,
      isHuman: true,
    });

    // AI players
    for (let i = 0; i < numAIPlayers; i++) {
      players.push({
        id: `ai${i}`,
        name: `AI Player ${i + 1}`,
        chipStack: startingChips,
        holeCards: [],
        currentBet: 0,
        position: Position.EARLY,
        isActive: true,
        isAllIn: false,
        lastAction: null,
        isHuman: false,
      });
    }

    // Initialize core systems
    this.engine = new GameEngine(players, smallBlind, bigBlind);
    this.flowManager = new GameFlowManager(this.engine);
    this.aiPlayers = new Map();

    // Initialize AI players
    for (let i = 0; i < numAIPlayers; i++) {
      this.aiPlayers.set(`ai${i}`, new AIPlayer(`ai${i}`));
    }

    // Initialize auth and context
    this.auth = new BaseAccountAuth();
    this.miniAppContext = new MiniAppContext();
    this.persistence = new GamePersistence();
  }

  /**
   * Initialize blockchain services
   * @param contractAddress Smart contract address
   * @param provider Ethereum provider or signer
   * @param paymasterUrl Paymaster service URL
   */
  async initializeBlockchain(
    contractAddress: string,
    provider: any,
    paymasterUrl?: string
  ): Promise<void> {
    this.contractService = new ContractService(contractAddress, provider);
    this.leaderboardManager = new LeaderboardManager(this.contractService);

    if (paymasterUrl) {
      this.paymasterService = new PaymasterService(
        this.auth.getProvider(),
        { serviceUrl: paymasterUrl }
      );
    }

    // Auto-sync with blockchain on initialization
    const user = this.auth.getAuthenticatedUser();
    if (user && user.address) {
      await this.syncPlayerData(user.address);
    }
  }

  /**
   * Sync player data with blockchain
   * @param playerAddress Player's Ethereum address
   */
  async syncPlayerData(playerAddress: string): Promise<void> {
    if (!this.leaderboardManager) {
      return;
    }

    // Sync stats from blockchain
    await this.leaderboardManager.syncWithBlockchain(playerAddress);

    // Check for unsaved progress
    const hasUnsaved = await this.leaderboardManager.hasUnsavedProgress(playerAddress);
    
    if (hasUnsaved) {
      const progress = await this.leaderboardManager.getUnsavedProgress(playerAddress);
      console.log('Unsaved progress detected:', progress);
      // Trigger UI notification (can be handled by event listener)
      this.onUnsavedProgressDetected?.(progress);
    }
  }

  /**
   * Callback for unsaved progress detection
   */
  private onUnsavedProgressDetected?: (progress: any) => void;

  /**
   * Set callback for unsaved progress detection
   * @param callback Callback function
   */
  setUnsavedProgressCallback(callback: (progress: any) => void): void {
    this.onUnsavedProgressDetected = callback;
  }

  /**
   * Start a new game
   */
  async startGame(): Promise<void> {
    this.isRunning = true;
    this.flowManager.startNextHand();
    await this.runGameLoop();
  }

  /**
   * Start a new hand
   */
  startNewHand(): void {
    this.flowManager.startNextHand();
    this.runGameLoop();
  }

  /**
   * Main game loop
   */
  private async runGameLoop(): Promise<void> {
    while (this.isRunning && !this.flowManager.shouldGameEnd()) {
      const state = this.engine.getGameState();
      const currentPlayer = state.players[state.activePlayer];

      if (!currentPlayer.isHuman) {
        // AI player's turn
        const ai = this.aiPlayers.get(currentPlayer.id);
        if (ai) {
          const action = ai.makeDecision(state, currentPlayer);
          this.engine.processPlayerAction(currentPlayer.id, action);
          
          // Small delay to allow UI updates and tests to observe state changes
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } else {
        // Human player's turn - wait for input
        break;
      }
    }

    // Check for game end
    if (this.flowManager.shouldGameEnd()) {
      await this.endGame();
    }
  }

  /**
   * Process human player action
   * @param action Action type
   * @param amount Optional bet amount
   */
  async processHumanAction(
    action: ActionType,
    amount?: number
  ): Promise<void> {
    const result = this.engine.processPlayerAction('human', {
      type: action,
      amount,
      playerId: 'human',
    });

    if (result.success) {
      await this.runGameLoop();
    }
  }

  /**
   * End the current game
   */
  private async endGame(): Promise<void> {
    const winner = this.flowManager.getGameWinner();

    if (winner && this.leaderboardManager) {
      // Update leaderboard
      await this.leaderboardManager.updatePlayerStats({
        playerId: winner.id,
        playerAddress: winner.baseAddress || '',
        gameWon: true,
        handsWon: 1,
        biggestPot: this.engine.getGameState().pot.totalPot,
      });
    }

    this.isRunning = false;
  }

  /**
   * Save game state
   */
  async saveGame(filename?: string): Promise<boolean> {
    const state = this.engine.getGameState();
    const chipBalances = this.engine.getAllChipBalances();

    return await this.persistence.saveGame(
      state,
      [],
      chipBalances,
      filename
    );
  }

  /**
   * Load game state
   */
  async loadGame(filename?: string): Promise<boolean> {
    const saveData = await this.persistence.loadGame(filename);

    if (!saveData) {
      return false;
    }

    // Restore chip balances
    Object.entries(saveData.chipBalances).forEach(([playerId, balance]) => {
      this.engine.updateChipBalance(playerId, balance);
    });

    return true;
  }

  /**
   * Get current game state
   */
  getGameState() {
    return this.engine.getGameState();
  }

  /**
   * Get authentication service
   */
  getAuth() {
    return this.auth;
  }

  /**
   * Get leaderboard manager
   */
  getLeaderboardManager() {
    return this.leaderboardManager;
  }

  /**
   * Get paymaster service
   */
  getPaymasterService() {
    return this.paymasterService;
  }

  /**
   * Get mini app context
   */
  getMiniAppContext() {
    return this.miniAppContext;
  }

  /**
   * Check if game is running
   */
  isGameRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Stop the game
   */
  stopGame(): void {
    this.isRunning = false;
  }
}
