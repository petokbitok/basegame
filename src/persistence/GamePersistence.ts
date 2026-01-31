import { GameState, PlayerStats } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Saved game data structure
 */
export interface SavedGameData {
  gameState: GameState;
  playerStats: PlayerStats[];
  chipBalances: Record<string, number>;
  timestamp: number;
  version: string;
}

/**
 * Game persistence service for save/load operations
 */
export class GamePersistence {
  private saveDirectory: string;
  private readonly VERSION = '1.0.0';

  constructor(saveDirectory: string = './saves') {
    this.saveDirectory = saveDirectory;
    this.ensureSaveDirectory();
  }

  /**
   * Ensure save directory exists
   */
  private ensureSaveDirectory(): void {
    if (typeof window === 'undefined') {
      // Node.js environment
      if (!fs.existsSync(this.saveDirectory)) {
        fs.mkdirSync(this.saveDirectory, { recursive: true });
      }
    }
  }

  /**
   * Save game state to file
   * @param gameState Current game state
   * @param playerStats Player statistics
   * @param chipBalances Chip balances map
   * @param filename Save filename
   * @returns Promise<boolean> Success status
   */
  async saveGame(
    gameState: GameState,
    playerStats: PlayerStats[],
    chipBalances: Map<string, number>,
    filename: string = 'autosave.json'
  ): Promise<boolean> {
    try {
      const saveData: SavedGameData = {
        gameState,
        playerStats,
        chipBalances: Object.fromEntries(chipBalances),
        timestamp: Date.now(),
        version: this.VERSION,
      };

      const jsonData = JSON.stringify(saveData, null, 2);

      if (typeof window === 'undefined') {
        // Node.js - save to file
        const filepath = path.join(this.saveDirectory, filename);
        fs.writeFileSync(filepath, jsonData, 'utf-8');
      } else {
        // Browser - save to localStorage
        localStorage.setItem(`poker_save_${filename}`, jsonData);
      }

      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from file
   * @param filename Save filename
   * @returns Promise<SavedGameData | null> Loaded data or null
   */
  async loadGame(filename: string = 'autosave.json'): Promise<SavedGameData | null> {
    try {
      let jsonData: string;

      if (typeof window === 'undefined') {
        // Node.js - load from file
        const filepath = path.join(this.saveDirectory, filename);
        if (!fs.existsSync(filepath)) {
          return null;
        }
        jsonData = fs.readFileSync(filepath, 'utf-8');
      } else {
        // Browser - load from localStorage
        const data = localStorage.getItem(`poker_save_${filename}`);
        if (!data) {
          return null;
        }
        jsonData = data;
      }

      const saveData: SavedGameData = JSON.parse(jsonData);

      // Validate version
      if (!this.isCompatibleVersion(saveData.version)) {
        console.warn('Incompatible save version');
        return null;
      }

      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Check if save version is compatible
   * @param version Save version
   * @returns boolean True if compatible
   */
  private isCompatibleVersion(version: string): boolean {
    // Simple version check - can be enhanced
    return version === this.VERSION;
  }

  /**
   * List all save files
   * @returns Promise<string[]> Array of save filenames
   */
  async listSaves(): Promise<string[]> {
    try {
      if (typeof window === 'undefined') {
        // Node.js
        if (!fs.existsSync(this.saveDirectory)) {
          return [];
        }
        const files = fs.readdirSync(this.saveDirectory);
        return files.filter((f) => f.endsWith('.json'));
      } else {
        // Browser
        const saves: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('poker_save_')) {
            saves.push(key.replace('poker_save_', ''));
          }
        }
        return saves;
      }
    } catch (error) {
      console.error('Failed to list saves:', error);
      return [];
    }
  }

  /**
   * Delete a save file
   * @param filename Save filename
   * @returns Promise<boolean> Success status
   */
  async deleteSave(filename: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') {
        // Node.js
        const filepath = path.join(this.saveDirectory, filename);
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      } else {
        // Browser
        localStorage.removeItem(`poker_save_${filename}`);
      }
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }
}
