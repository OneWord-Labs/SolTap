import { Logger } from '../../utils/Logger';
import { SavedGameState, StorageResult } from '../types';
import { GameStateStorage } from '../services/GameStateStorage';

export enum StateErrorType {
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  EXPIRED_STATE = 'EXPIRED_STATE',
  INVALID_STATE = 'INVALID_STATE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export interface StateError {
  type: StateErrorType;
  message: string;
  recoverable: boolean;
  suggestions: string[];
  originalError?: Error;
}

export class StateErrorHandler {
  private logger: Logger;
  private gameStateStorage: GameStateStorage;

  constructor(gameStateStorage: GameStateStorage) {
    this.logger = new Logger('StateErrorHandler');
    this.gameStateStorage = gameStateStorage;
  }

  /**
   * Analyze and handle different types of storage errors
   */
  handleStorageError(error: any): StateError {
    const errorMessage = error?.message || String(error);
    this.logger.error('Storage error occurred:', errorMessage);

    // Check for storage unavailable
    if (this.isStorageUnavailable()) {
      return {
        type: StateErrorType.STORAGE_UNAVAILABLE,
        message: 'Local storage is not available in this browser',
        recoverable: false,
        suggestions: [
          'Try using a different browser',
          'Enable local storage in browser settings',
          'Check if in private/incognito mode'
        ],
        originalError: error
      };
    }

    // Check for quota exceeded
    if (errorMessage.includes('QuotaExceededError') || errorMessage.includes('quota')) {
      return {
        type: StateErrorType.QUOTA_EXCEEDED,
        message: 'Browser storage quota exceeded',
        recoverable: true,
        suggestions: [
          'Clear browser data for this site',
          'Free up storage space',
          'Try again after clearing cache'
        ],
        originalError: error
      };
    }

    // Check for permission denied
    if (errorMessage.includes('SecurityError') || errorMessage.includes('permission')) {
      return {
        type: StateErrorType.PERMISSION_DENIED,
        message: 'Permission denied to access storage',
        recoverable: false,
        suggestions: [
          'Check browser security settings',
          'Disable strict privacy mode',
          'Allow storage for this site'
        ],
        originalError: error
      };
    }

    // Generic network/connectivity error
    if (errorMessage.includes('NetworkError') || errorMessage.includes('network')) {
      return {
        type: StateErrorType.NETWORK_ERROR,
        message: 'Network connectivity issue',
        recoverable: true,
        suggestions: [
          'Check internet connection',
          'Try again in a moment',
          'Refresh the page'
        ],
        originalError: error
      };
    }

    // Default unknown error
    return {
      type: StateErrorType.INVALID_STATE,
      message: `Unknown storage error: ${errorMessage}`,
      recoverable: true,
      suggestions: [
        'Try refreshing the page',
        'Clear browser cache',
        'Contact support if problem persists'
      ],
      originalError: error
    };
  }

  /**
   * Handle data corruption errors
   */
  handleDataCorruption(corruptedData: string): StateError {
    this.logger.warn('Data corruption detected, clearing corrupted state');

    // Attempt to clear corrupted data
    try {
      this.gameStateStorage.clearSavedGame();
    } catch (clearError) {
      this.logger.error('Failed to clear corrupted data:', clearError);
    }

    return {
      type: StateErrorType.DATA_CORRUPTION,
      message: 'Saved game data is corrupted and has been cleared',
      recoverable: true,
      suggestions: [
        'Start a new game',
        'Your progress has been reset for safety',
        'This usually happens after browser updates'
      ]
    };
  }

  /**
   * Handle version mismatch errors
   */
  handleVersionMismatch(savedVersion: string, currentVersion: string): StateError {
    this.logger.warn('Version mismatch detected', { savedVersion, currentVersion });

    return {
      type: StateErrorType.VERSION_MISMATCH,
      message: `Saved game is from an older version (${savedVersion}) and cannot be loaded`,
      recoverable: false,
      suggestions: [
        'Start a new game with the updated version',
        'Your saved progress is incompatible',
        'Future saves will work with this version'
      ]
    };
  }

  /**
   * Handle expired state errors
   */
  handleExpiredState(age: number): StateError {
    const ageInHours = Math.round(age / 1000 / 60 / 60);

    return {
      type: StateErrorType.EXPIRED_STATE,
      message: `Saved game is too old (${ageInHours} hours) and has expired`,
      recoverable: false,
      suggestions: [
        'Start a new game',
        'Saved games expire after 24 hours for security',
        'Save progress more frequently during gameplay'
      ]
    };
  }

  /**
   * Attempt automatic recovery for recoverable errors
   */
  async attemptRecovery(error: StateError): Promise<boolean> {
    this.logger.log('Attempting automatic recovery for error:', error.type);

    switch (error.type) {
      case StateErrorType.QUOTA_EXCEEDED:
        return this.attemptQuotaRecovery();

      case StateErrorType.DATA_CORRUPTION:
        return this.attemptCorruptionRecovery();

      case StateErrorType.NETWORK_ERROR:
        return this.attemptNetworkRecovery();

      default:
        return false;
    }
  }

  /**
   * Attempt recovery from quota exceeded error
   */
  private async attemptQuotaRecovery(): Promise<boolean> {
    try {
      // Clear our saved game to free up space
      const result = this.gameStateStorage.clearSavedGame();

      if (result.success) {
        this.logger.log('Quota recovery successful - cleared saved game');
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Quota recovery failed:', error);
      return false;
    }
  }

  /**
   * Attempt recovery from data corruption
   */
  private async attemptCorruptionRecovery(): Promise<boolean> {
    try {
      // Clear corrupted data
      const result = this.gameStateStorage.clearSavedGame();

      if (result.success) {
        this.logger.log('Corruption recovery successful - cleared corrupted data');
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Corruption recovery failed:', error);
      return false;
    }
  }

  /**
   * Attempt recovery from network errors
   */
  private async attemptNetworkRecovery(): Promise<boolean> {
    // For network errors, just wait a moment and indicate recovery is possible
    return new Promise(resolve => {
      setTimeout(() => {
        this.logger.log('Network recovery attempt completed');
        resolve(true);
      }, 1000);
    });
  }

  /**
   * Check if local storage is available
   */
  private isStorageUnavailable(): boolean {
    try {
      const testKey = '__soltap_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return false;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get user-friendly error message for display
   */
  getUserFriendlyMessage(error: StateError): string {
    switch (error.type) {
      case StateErrorType.STORAGE_UNAVAILABLE:
        return 'Game saving is not available in this browser. You can still play, but progress won\'t be saved.';

      case StateErrorType.QUOTA_EXCEEDED:
        return 'Not enough storage space to save your game. Try clearing some browser data.';

      case StateErrorType.DATA_CORRUPTION:
        return 'Your saved game was corrupted and has been reset. You can start a new game.';

      case StateErrorType.VERSION_MISMATCH:
        return 'Your saved game is from an older version and cannot be loaded. Please start a new game.';

      case StateErrorType.EXPIRED_STATE:
        return 'Your saved game has expired. Please start a new game.';

      case StateErrorType.PERMISSION_DENIED:
        return 'Cannot access browser storage due to privacy settings. Game saving is disabled.';

      case StateErrorType.NETWORK_ERROR:
        return 'Connection issue detected. Your game progress may not be saved properly.';

      default:
        return 'An unexpected error occurred with game saving. You can still play normally.';
    }
  }

  /**
   * Check storage health and report issues
   */
  checkStorageHealth(): {
    healthy: boolean;
    issues: StateError[];
    recommendations: string[];
  } {
    const issues: StateError[] = [];
    const recommendations: string[] = [];

    // Check if storage is available
    if (this.isStorageUnavailable()) {
      issues.push({
        type: StateErrorType.STORAGE_UNAVAILABLE,
        message: 'Local storage unavailable',
        recoverable: false,
        suggestions: ['Enable local storage', 'Use a different browser']
      });
      recommendations.push('Game progress cannot be saved in this browser');
    }

    // Check storage quota
    try {
      const info = this.gameStateStorage.getStorageInfo();
      if (!info.storageAvailable) {
        issues.push({
          type: StateErrorType.QUOTA_EXCEEDED,
          message: 'Storage quota exceeded',
          recoverable: true,
          suggestions: ['Clear browser data', 'Free up storage space']
        });
        recommendations.push('Storage space is limited - clear browser data if needed');
      }
    } catch (error) {
      // Storage info not available
    }

    const healthy = issues.length === 0;

    if (healthy) {
      recommendations.push('Game saving is working properly');
    }

    return {
      healthy,
      issues,
      recommendations
    };
  }
}