import { Pattern } from '../types';
import { Logger } from '../../utils/Logger';

/**
 * Progress Tracker Manager
 * Handles state management and logic for tracking pattern progress
 */
export class ProgressTracker {
  private logger: Logger;
  private currentPatterns: Pattern[] = [];
  private playerProgress: Pattern[] = [];
  private currentStep = 0;
  private totalSteps = 0;
  private isActive = false;
  private startTime = 0;
  private stepTimings: number[] = [];

  // Event callbacks
  private onProgressUpdate?: (current: number, total: number, isCorrect: boolean) => void;
  private onProgressComplete?: (success: boolean, totalTime: number, stepTimings: number[]) => void;
  private onProgressReset?: () => void;

  constructor() {
    this.logger = new Logger('ProgressTracker');
  }

  /**
   * Initialize progress tracking for a new pattern sequence
   */
  startTracking(patterns: Pattern[]): void {
    this.logger.info('Starting progress tracking for patterns:', patterns);

    this.currentPatterns = [...patterns];
    this.playerProgress = [];
    this.currentStep = 0;
    this.totalSteps = patterns.length;
    this.isActive = true;
    this.startTime = Date.now();
    this.stepTimings = [];

    this.onProgressUpdate?.(this.currentStep, this.totalSteps, true);
  }

  /**
   * Record a player input and check if it matches the expected pattern
   */
  recordPlayerInput(playerPattern: Pattern): boolean {
    if (!this.isActive || this.currentStep >= this.totalSteps) {
      this.logger.warn('Attempting to record input when tracking is not active');
      return false;
    }

    const expectedPattern = this.currentPatterns[this.currentStep];
    const isCorrect = this.validatePattern(playerPattern, expectedPattern);

    // Record timing
    const stepTime = Date.now() - this.startTime;
    this.stepTimings.push(stepTime);

    this.logger.info(`Step ${this.currentStep + 1}: ${isCorrect ? 'Correct' : 'Incorrect'}`, {
      expected: expectedPattern,
      actual: playerPattern,
      timing: stepTime
    });

    if (isCorrect) {
      this.playerProgress.push(playerPattern);
      this.currentStep++;

      // Check if pattern sequence is complete
      if (this.currentStep >= this.totalSteps) {
        this.completeProgress(true);
      } else {
        this.onProgressUpdate?.(this.currentStep, this.totalSteps, true);
      }

      return true;
    } else {
      this.completeProgress(false);
      return false;
    }
  }

  /**
   * Validate if player pattern matches expected pattern
   */
  private validatePattern(playerPattern: Pattern, expectedPattern: Pattern): boolean {
    // Basic validation - check if indices match
    if (playerPattern.index !== expectedPattern.index) {
      return false;
    }

    // Type-specific validation
    if (playerPattern.type !== expectedPattern.type) {
      return false;
    }

    // For hold patterns, validate duration (with some tolerance)
    if (expectedPattern.type === 'hold' && expectedPattern.duration) {
      const tolerance = 200; // 200ms tolerance
      const actualDuration = playerPattern.duration || 0;
      const expectedDuration = expectedPattern.duration;

      if (Math.abs(actualDuration - expectedDuration) > tolerance) {
        this.logger.warn('Hold duration mismatch', {
          expected: expectedDuration,
          actual: actualDuration,
          tolerance
        });
        return false;
      }
    }

    // For rapid patterns, validate count
    if (expectedPattern.type === 'rapid' && expectedPattern.count) {
      if (playerPattern.count !== expectedPattern.count) {
        this.logger.warn('Rapid count mismatch', {
          expected: expectedPattern.count,
          actual: playerPattern.count
        });
        return false;
      }
    }

    return true;
  }

  /**
   * Complete the current progress tracking session
   */
  private completeProgress(success: boolean): void {
    if (!this.isActive) return;

    const totalTime = Date.now() - this.startTime;
    this.isActive = false;

    this.logger.info(`Progress tracking completed: ${success ? 'Success' : 'Failure'}`, {
      totalTime,
      stepTimings: this.stepTimings,
      completedSteps: this.currentStep,
      totalSteps: this.totalSteps
    });

    this.onProgressComplete?.(success, totalTime, this.stepTimings);
  }

  /**
   * Reset progress tracking state
   */
  reset(): void {
    this.logger.info('Resetting progress tracking');

    this.currentPatterns = [];
    this.playerProgress = [];
    this.currentStep = 0;
    this.totalSteps = 0;
    this.isActive = false;
    this.startTime = 0;
    this.stepTimings = [];

    this.onProgressReset?.();
  }

  /**
   * Force complete the current progress (for external completion)
   */
  forceComplete(): void {
    if (this.isActive) {
      this.currentStep = this.totalSteps;
      this.completeProgress(true);
    }
  }

  /**
   * Get current progress information
   */
  getProgress(): {
    current: number;
    total: number;
    isActive: boolean;
    accuracy: number;
    averageStepTime: number;
  } {
    const averageStepTime = this.stepTimings.length > 0
      ? this.stepTimings.reduce((a, b) => a + b, 0) / this.stepTimings.length
      : 0;

    return {
      current: this.currentStep,
      total: this.totalSteps,
      isActive: this.isActive,
      accuracy: this.totalSteps > 0 ? (this.currentStep / this.totalSteps) * 100 : 0,
      averageStepTime
    };
  }

  /**
   * Get detailed progress statistics
   */
  getProgressStats(): {
    patterns: Pattern[];
    playerProgress: Pattern[];
    stepTimings: number[];
    totalTime: number;
    isComplete: boolean;
    success: boolean;
  } {
    return {
      patterns: [...this.currentPatterns],
      playerProgress: [...this.playerProgress],
      stepTimings: [...this.stepTimings],
      totalTime: this.isActive ? Date.now() - this.startTime : 0,
      isComplete: this.currentStep >= this.totalSteps,
      success: this.currentStep >= this.totalSteps && this.isActive === false
    };
  }

  /**
   * Set event callback for progress updates
   */
  setOnProgressUpdate(callback: (current: number, total: number, isCorrect: boolean) => void): void {
    this.onProgressUpdate = callback;
  }

  /**
   * Set event callback for progress completion
   */
  setOnProgressComplete(callback: (success: boolean, totalTime: number, stepTimings: number[]) => void): void {
    this.onProgressComplete = callback;
  }

  /**
   * Set event callback for progress reset
   */
  setOnProgressReset(callback: () => void): void {
    this.onProgressReset = callback;
  }

  /**
   * Check if progress tracking is currently active
   */
  isTracking(): boolean {
    return this.isActive;
  }

  /**
   * Get the current expected pattern (next pattern player should input)
   */
  getCurrentExpectedPattern(): Pattern | null {
    if (!this.isActive || this.currentStep >= this.totalSteps) {
      return null;
    }
    return this.currentPatterns[this.currentStep];
  }

  /**
   * Get progress percentage as a number between 0 and 1
   */
  getProgressPercentage(): number {
    return this.totalSteps > 0 ? this.currentStep / this.totalSteps : 0;
  }
}