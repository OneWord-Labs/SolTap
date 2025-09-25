import { SavedGameState, StorageResult, GameStateStorageInterface } from '../types';
import { Logger } from '../../utils/Logger';
import { StateErrorHandler, StateError } from '../utils/StateErrorHandler';

export class GameStateStorage implements GameStateStorageInterface {
  private static readonly STORAGE_KEY = 'soltap_game_state';
  private static readonly VERSION = '1.0.0';
  private static readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  private logger: Logger;
  private errorHandler: StateErrorHandler;

  constructor() {
    this.logger = new Logger('GameStateStorage');
    this.errorHandler = new StateErrorHandler(this);
  }

  /**
   * Save current game state to localStorage
   */
  async saveGame(state: SavedGameState): Promise<StorageResult<void>> {
    try {
      // Add metadata
      const stateWithMetadata: SavedGameState = {
        ...state,
        savedAt: Date.now(),
        version: GameStateStorage.VERSION
      };

      // Validate state before saving
      if (!this.validateSavedGame(stateWithMetadata)) {
        return {
          success: false,
          error: 'Invalid game state data'
        };
      }

      const serialized = JSON.stringify(stateWithMetadata);
      localStorage.setItem(GameStateStorage.STORAGE_KEY, serialized);

      this.logger.log('Game state saved successfully', {
        level: stateWithMetadata.currentLevel,
        score: stateWithMetadata.score
      });

      return { success: true };
    } catch (error) {
      const stateError = this.errorHandler.handleStorageError(error);

      // Attempt automatic recovery for recoverable errors
      if (stateError.recoverable) {
        // Attempt automatic recovery for recoverable errors
        if (this.attemptSyncRecovery(stateError)) {
          // Retry the save operation once after recovery
          try {
            // Retry save with original state
            localStorage.setItem(GameStateStorage.STORAGE_KEY, JSON.stringify(state));
            return { success: true };
          } catch (retryError) {
            // Recovery attempt failed, return original error
          }
        }
      }

      return {
        success: false,
        error: stateError.message,
        stateError: stateError
      };
    }
  }

  /**
   * Load saved game state from localStorage
   */
  async loadGame(): Promise<StorageResult<SavedGameState>> {
    try {
      const serialized = localStorage.getItem(GameStateStorage.STORAGE_KEY);

      if (!serialized) {
        return {
          success: false,
          error: 'No saved game found'
        };
      }

      const state: SavedGameState = JSON.parse(serialized);

      // Validate loaded state
      if (!this.validateSavedGame(state)) {
        const corruptionError = this.errorHandler.handleDataCorruption(serialized);
        return {
          success: false,
          error: corruptionError.message,
          stateError: corruptionError
        };
      }

      // Check if save is too old
      const age = Date.now() - state.savedAt;
      if (age > GameStateStorage.MAX_AGE_MS) {
        const expirationError = this.errorHandler.handleExpiredState(age);
        this.clearSavedGame(); // Clear expired state
        return {
          success: false,
          error: expirationError.message,
          stateError: expirationError
        };
      }

      // Check version compatibility
      if (state.version !== GameStateStorage.VERSION) {
        const versionError = this.errorHandler.handleVersionMismatch(state.version, GameStateStorage.VERSION);
        this.clearSavedGame(); // Clear incompatible version
        return {
          success: false,
          error: versionError.message,
          stateError: versionError
        };
      }

      this.logger.log('Game state loaded successfully', {
        level: state.currentLevel,
        score: state.score,
        age: Math.round(age / 1000 / 60) // age in minutes
      });

      return {
        success: true,
        data: state
      };
    } catch (error) {
      const stateError = this.errorHandler.handleStorageError(error);

      // Clear corrupted data for most errors
      if (stateError.type !== 'NETWORK_ERROR' && stateError.type !== 'PERMISSION_DENIED') {
        this.clearSavedGame();
      }

      // Attempt automatic recovery for recoverable errors
      if (stateError.recoverable) {
        // Attempt automatic recovery for recoverable errors
        if (this.attemptSyncRecovery(stateError)) {
          // Don't retry load automatically to avoid loops
          this.logger.log('Storage error recovered, user should retry loading');
        }
      }

      return {
        success: false,
        error: stateError.message,
        stateError: stateError
      };
    }
  }

  /**
   * Check if a saved game exists and is valid
   */
  hasSavedGame(): boolean {
    try {
      const serialized = localStorage.getItem(GameStateStorage.STORAGE_KEY);
      if (!serialized) {
        return false;
      }

      const state: SavedGameState = JSON.parse(serialized);

      // Quick validation
      if (!this.validateSavedGame(state)) {
        return false;
      }

      // Check age
      const age = Date.now() - state.savedAt;
      if (age > GameStateStorage.MAX_AGE_MS) {
        return false;
      }

      // Check version
      if (state.version !== GameStateStorage.VERSION) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.warn('Error checking for saved game:', error);
      return false;
    }
  }

  /**
   * Attempt synchronous recovery for recoverable errors
   */
  private attemptSyncRecovery(error: any): boolean {
    try {
      if (error.recoverable && (error.type === 'QUOTA_EXCEEDED' || error.type === 'DATA_CORRUPTION')) {
        this.clearSavedGame();
        return true;
      }
      return false;
    } catch (recoveryError) {
      this.logger.error('Sync recovery failed:', recoveryError);
      return false;
    }
  }

  /**
   * Clear saved game state
   */
  clearSavedGame(): StorageResult<void> {
    try {
      localStorage.removeItem(GameStateStorage.STORAGE_KEY);
      this.logger.log('Saved game state cleared');

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to clear saved game state:', errorMessage);

      return {
        success: false,
        error: `Failed to clear saved game state: ${errorMessage}`
      };
    }
  }

  /**
   * Validate saved game state structure and data integrity
   */
  validateSavedGame(state: SavedGameState): boolean {
    try {
      // Check required fields exist
      if (
        typeof state.currentLevel !== 'number' ||
        typeof state.score !== 'number' ||
        typeof state.coins !== 'number' ||
        typeof state.difficulty !== 'string' ||
        typeof state.gameMode !== 'string' ||
        !Array.isArray(state.patterns) ||
        !Array.isArray(state.playerPattern) ||
        typeof state.patternIndex !== 'number' ||
        typeof state.canInput !== 'boolean' ||
        typeof state.isShowingPattern !== 'boolean' ||
        typeof state.userName !== 'string' ||
        typeof state.savedAt !== 'number' ||
        typeof state.version !== 'string'
      ) {
        this.logger.warn('Saved game state missing required fields or wrong types');
        return false;
      }

      // Validate ranges
      if (
        state.currentLevel < 1 ||
        state.score < 0 ||
        state.coins < 0 ||
        state.patternIndex < 0 ||
        state.savedAt < 0
      ) {
        this.logger.warn('Saved game state has invalid values');
        return false;
      }

      // Validate enums
      if (!['novice', 'expert'].includes(state.difficulty)) {
        this.logger.warn('Invalid difficulty mode in saved state');
        return false;
      }

      if (state.gameMode !== 'normal') {
        this.logger.warn('Invalid game mode in saved state');
        return false;
      }

      // Validate pattern structure
      for (const pattern of state.patterns) {
        if (
          typeof pattern.index !== 'number' ||
          typeof pattern.type !== 'string' ||
          !['tap', 'hold', 'rapid'].includes(pattern.type)
        ) {
          this.logger.warn('Invalid pattern structure in saved state');
          return false;
        }
      }

      for (const pattern of state.playerPattern) {
        if (
          typeof pattern.index !== 'number' ||
          typeof pattern.type !== 'string' ||
          !['tap', 'hold', 'rapid'].includes(pattern.type)
        ) {
          this.logger.warn('Invalid player pattern structure in saved state');
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Error validating saved game state:', error);
      return false;
    }
  }

  /**
   * Get storage information for debugging
   */
  getStorageInfo(): {
    hasStorage: boolean;
    hasGame: boolean;
    storageUsed: number;
    storageAvailable: boolean;
  } {
    const hasStorage = typeof localStorage !== 'undefined';
    const hasGame = this.hasSavedGame();

    let storageUsed = 0;
    let storageAvailable = true;

    if (hasStorage) {
      try {
        const data = localStorage.getItem(GameStateStorage.STORAGE_KEY);
        storageUsed = data ? new Blob([data]).size : 0;

        // Test storage availability
        const testKey = '__soltap_storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
      } catch (error) {
        storageAvailable = false;
      }
    }

    return {
      hasStorage,
      hasGame,
      storageUsed,
      storageAvailable
    };
  }

  /**
   * Check storage health and get detailed error information
   */
  checkStorageHealth() {
    return this.errorHandler.checkStorageHealth();
  }

  /**
   * Get user-friendly error message for display
   */
  getUserFriendlyError(result: StorageResult<any>): string {
    if (result.stateError) {
      return this.errorHandler.getUserFriendlyMessage(result.stateError);
    }
    return result.error || 'An unknown error occurred';
  }

  /**
   * Get the StateErrorHandler instance for direct access
   */
  getErrorHandler(): StateErrorHandler {
    return this.errorHandler;
  }
}