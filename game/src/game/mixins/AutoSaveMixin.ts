import { SavedGameState } from '../types';
import { GameStateStorage } from '../services/GameStateStorage';
import { Logger } from '../../utils/Logger';

/**
 * Auto-save functionality mixin for MainScene
 */
export class AutoSaveMixin {
    private gameStateStorage: GameStateStorage;
    private logger: Logger;
    private lastAutoSave: number = 0;
    private readonly AUTO_SAVE_INTERVAL = 5000; // Auto-save every 5 seconds during gameplay

    // These properties should be defined in the MainScene class
    protected currentLevel!: number;
    protected score!: number;
    protected coins!: number;
    protected difficulty!: any;
    protected gameMode!: any;
    protected patterns!: any[];
    protected playerPattern!: any[];
    protected canInput!: boolean;
    protected isShowingPattern!: boolean;
    protected userName!: string;
    protected userId?: number;

    constructor(gameStateStorage: GameStateStorage, logger: Logger) {
        this.gameStateStorage = gameStateStorage;
        this.logger = logger;
        this.setupAutoSave();
    }

    /**
     * Save current game state to local storage
     */
    protected async saveGameState(): Promise<void> {
        try {
            const gameState: SavedGameState = {
                currentLevel: this.currentLevel,
                score: this.score,
                coins: this.coins,
                difficulty: this.difficulty,
                gameMode: this.gameMode,
                patterns: this.patterns,
                playerPattern: this.playerPattern,
                patternIndex: this.playerPattern.length,
                canInput: this.canInput,
                isShowingPattern: this.isShowingPattern,
                userName: this.userName,
                userId: this.userId,
                savedAt: Date.now(),
                version: '1.0.0'
            };

            const result = await this.gameStateStorage.saveGame(gameState);
            if (result.success) {
                this.lastAutoSave = Date.now();
                this.logger.log('Game state saved', { level: this.currentLevel, score: this.score });
            } else {
                this.logger.warn('Failed to save game state:', result.error);
                // Handle specific errors if needed
                if (result.stateError) {
                    this.logger.error('Storage error details:', result.stateError);
                }
            }
        } catch (error) {
            this.logger.error('Error saving game state:', error);
        }
    }

    /**
     * Clear saved game state
     */
    protected clearSavedGame(): void {
        const result = this.gameStateStorage.clearSavedGame();
        if (!result.success) {
            this.logger.warn('Failed to clear saved game:', result.error);
        }
    }

    /**
     * Auto-save game state at regular intervals during gameplay
     */
    protected checkAutoSave(): void {
        const now = Date.now();
        const shouldSave = (now - this.lastAutoSave) >= this.AUTO_SAVE_INTERVAL;

        if (shouldSave && this.currentLevel > 1 && this.patterns.length > 0) {
            this.saveGameState().catch(error => {
                this.logger.error('Failed to auto-save game state:', error);
            });
        }
    }

    /**
     * Handle browser/app interruption (page visibility change)
     */
    private handleVisibilityChange(): void {
        if (document.hidden) {
            // Page is becoming hidden - save immediately
            this.logger.log('Page becoming hidden, saving game state');
            this.saveGameState().catch(error => {
                this.logger.error('Failed to save on visibility change:', error);
            });
        }
    }

    /**
     * Handle beforeunload event (browser close/refresh)
     */
    private handleBeforeUnload(): void {
        // Save immediately when user is about to leave
        // Note: beforeunload is synchronous, so we can't await here
        // This is a best-effort save
        this.logger.log('Page unloading, saving game state');
        this.saveGameState().catch(error => {
            this.logger.error('Failed to save on before unload:', error);
        });
    }

    private setupAutoSave(): void {
        // Set up auto-save event listeners
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        window.addEventListener('beforeunload', () => this.handleBeforeUnload());

        // Telegram WebApp specific events
        if (window.Telegram?.WebApp) {
            // Save when WebApp is being closed
            const originalClose = window.Telegram.WebApp.close;
            window.Telegram.WebApp.close = () => {
                this.logger.log('Telegram WebApp closing, saving game state');
                this.saveGameState().catch(error => {
                    this.logger.error('Failed to save on Telegram WebApp close:', error);
                }).finally(() => {
                    originalClose.call(window.Telegram.WebApp);
                });
            };
        }
    }
}