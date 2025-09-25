import Phaser from 'phaser';
import { DifficultyMode, Pattern, GameMode, SavedGameState } from '../types';
import { COLORS, GAME_CONFIG } from '../constants';
import { PatternGenerator } from '../utils/patternGenerator';
import { AudioManager } from '../utils/audioManager';
import { RewardSystem } from '../utils/rewardSystem';
import { CircleManager } from '../utils/circleManager';
import { TransitionManager } from '../utils/transitionManager';
import { BackgroundManager } from '../utils/BackgroundManager';
import { UIManager } from '../utils/UIManager';
import { PatternManager } from '../utils/PatternManager';
import { CountdownManager } from '../utils/CountdownManager';
import { PauseManager } from '../utils/PauseManager';
import { GameStateStorage } from '../services/GameStateStorage';
import { ComboManager } from '../managers/ComboManager';
import { TutorialManager } from '../managers/TutorialManager';
import { ProgressTracker } from '../managers/ProgressTracker';
// Practice Mode removed - out of scope
import {
  gameplayTutorialConfig,
  firstSuccessConfig,
  firstFailureConfig,
  shouldShowTutorial,
  markTutorialCompleted,
  updateTutorialPositions
} from '../config/tutorialConfig';
import { Logger } from '../../utils/Logger';
import { Circle } from '../components/Circle';
import '../utils/tutorialDebug';

declare global {
    interface Window {
        Telegram?: {
            WebApp: {
                ready(): void;
                close(): void;
                sendData(data: string): void;
                initData: string;
                initDataUnsafe: {
                    user?: {
                        id: number;
                        username?: string;
                        first_name: string;
                    };
                };
            };
        };
    }
}

export default class MainScene extends Phaser.Scene {
    private patterns: Pattern[] = [];
    private playerPattern: Pattern[] = [];
    private circles: Circle[] = [];
    private currentLevel = 1;
    private canInput = false;
    private difficulty: DifficultyMode = 'novice';
    private gameMode: GameMode = 'normal';
    // Practice Mode removed - out of scope
    private isShowingPattern = false;
    private score = 0;
    private coins = 0;
    private userName: string = '';
    private userId?: number;

    // Managers
    private audioManager!: AudioManager;
    private rewardSystem!: RewardSystem;
    private circleManager!: CircleManager;
    private transitionManager!: TransitionManager;
    private backgroundManager!: BackgroundManager;
    private uiManager!: UIManager;
    private patternManager!: PatternManager;
    private countdownManager!: CountdownManager;
    private pauseManager!: PauseManager;
    private gameStateStorage!: GameStateStorage;
    private comboManager!: ComboManager;
    private tutorialManager!: TutorialManager;
    private progressTracker!: ProgressTracker;
    // Practice Mode removed - out of scope
    private logger: Logger;

    // Auto-save tracking
    private lastAutoSave: number = 0;
    private readonly AUTO_SAVE_INTERVAL = 5000; // Auto-save every 5 seconds during gameplay

    constructor() {
        super({ key: 'MainScene' });
        this.logger = new Logger('MainScene');
        // Simulate Telegram WebApp for testing
        if (!window.Telegram?.WebApp) {
            window.Telegram = {
                WebApp: {
                    ready: () => {},
                    close: () => {},
                    sendData: (data: string) => { console.log('Sending data:', data); },
                    initData: '',
                    initDataUnsafe: {
                        user: {
                            id: 12345,
                            first_name: 'Test User',
                            username: 'testuser'
                        }
                    }
                }
            };
        }
        // Initialize Telegram WebApp
        window.Telegram.WebApp.ready();
        const { user } = window.Telegram.WebApp.initDataUnsafe;
        if (user) {
            this.userName = user.first_name;
            this.userId = user.id;
            this.logger.log('User info set:', { name: this.userName, id: this.userId });
        }
    }

    init(data: { difficulty?: DifficultyMode; gameMode?: GameMode; resumeGame?: boolean; savedState?: SavedGameState }) {
        // Initialize storage
        this.gameStateStorage = new GameStateStorage();

        if (data.resumeGame && data.savedState) {
            // Resume from saved state
            this.resumeFromSavedState(data.savedState);
        } else {
            // Start new game
            this.difficulty = data.difficulty || 'novice';
            this.gameMode = data.gameMode || 'normal';
            // Practice Mode removed - out of scope
            this.currentLevel = 1;
            this.patterns = [];
            this.playerPattern = [];
            this.isShowingPattern = false;
            this.canInput = false;
            this.score = 0;
            this.coins = 0;
        }

        // Get user name from Telegram if not already set
        if (!this.userName && window.Telegram?.WebApp) {
            const { user } = window.Telegram.WebApp.initDataUnsafe;
            if (user) {
                this.userName = user.first_name;
                this.userId = user.id;
            }
        }

        this.logger.log('Game initialized', {
            difficulty: this.difficulty,
            gameMode: this.gameMode,
            resumeGame: data.resumeGame,
            level: this.currentLevel
        });
    }

    /**
     * Resume game from saved state
     */
    private resumeFromSavedState(savedState: SavedGameState): void {
        this.difficulty = savedState.difficulty;
        this.gameMode = savedState.gameMode;
        // Practice Mode removed - out of scope
        this.currentLevel = savedState.currentLevel;
        this.score = savedState.score;
        this.coins = savedState.coins;
        this.patterns = savedState.patterns;
        this.playerPattern = savedState.playerPattern;
        this.canInput = savedState.canInput;
        this.isShowingPattern = savedState.isShowingPattern;
        this.userName = savedState.userName;
        this.userId = savedState.userId;

        this.logger.log('Game resumed from saved state', {
            level: this.currentLevel,
            score: this.score,
            patternProgress: `${this.playerPattern.length}/${this.patterns.length}`
        });
    }

    create() {
        this.setupManagers();
        this.setupEventListeners();
        this.setupAutoSave();
        this.startGame();
    }

    private setupManagers() {
        // Initialize all managers
        this.audioManager = new AudioManager();
        this.rewardSystem = new RewardSystem();
        this.backgroundManager = new BackgroundManager(this);
        this.circleManager = new CircleManager(this, this.difficulty === 'expert');
        this.transitionManager = new TransitionManager(this);
        this.uiManager = new UIManager(
            this,
            () => this.handleTryAgain(),
            () => this.returnToMenu(),
            () => this.handlePause()
        );
        this.countdownManager = new CountdownManager(this);

        // Initialize combo manager
        this.comboManager = new ComboManager();

        // Initialize pause manager
        this.pauseManager = new PauseManager(this, {
            onResume: () => this.handleResume(),
            onRestart: () => this.handleRestart(),
            onMenu: () => this.returnToMenu()
        });

        // Initialize UI values immediately
        this.uiManager.updateLevel(this.currentLevel);
        this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());
        if (this.userName) {
            this.uiManager.updateUserName(this.userName);
        }

        // Create circles
        this.circles = this.circleManager.createCircles(
            this.cameras.main.width,
            this.cameras.main.height
        );

        // Initialize pattern manager after circles are created
        this.patternManager = new PatternManager(
            this,
            this.circles,
            this.audioManager,
            this.difficulty,
            this.gameMode,
            'normal' // Practice Mode removed
        );

        // Initialize progress tracker
        this.progressTracker = new ProgressTracker();
        this.setupProgressTracking();

        // Initialize tutorial manager
        this.tutorialManager = new TutorialManager(this);

        // Practice Mode removed - out of scope
    }

    private setupProgressTracking() {
        // Set up progress tracker event callbacks
        this.progressTracker.setOnProgressUpdate((current: number, total: number, isCorrect: boolean) => {
            this.uiManager.updateProgress(current);
            this.logger.info(`Progress updated: ${current}/${total} (${isCorrect ? 'correct' : 'incorrect'})`);
        });

        this.progressTracker.setOnProgressComplete((success: boolean, totalTime: number, stepTimings: number[]) => {
            if (success) {
                this.uiManager.completeProgress();
                this.logger.info(`Pattern completed successfully in ${totalTime}ms`);
            } else {
                this.uiManager.showProgressError();
                // Reset after showing error animation
                this.scene.time.delayedCall(800, () => {
                    this.uiManager.resetProgress();
                });
                this.logger.info('Pattern failed, progress reset');
            }
        });

        this.progressTracker.setOnProgressReset(() => {
            this.uiManager.resetProgress();
            this.logger.info('Progress tracking reset');
        });
    }

    private setupEventListeners() {
        this.scale.on('resize', this.handleResize, this);

        // Practice Mode removed - out of scope
        
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (!this.canInput || this.isShowingPattern || this.pauseManager.getIsPaused()) return;

            // Don't allow input during tutorial
            if (this.tutorialManager && this.tutorialManager.isActiveTutorial()) return;
            
            let clickedCircleIndex = -1;
            for (let i = 0; i < this.circles.length; i++) {
                if (this.circles[i].isPointInside(pointer.x, pointer.y)) {
                    clickedCircleIndex = i;
                    break;
                }
            }
            
            if (clickedCircleIndex !== -1) {
                this.handleCircleClick(clickedCircleIndex);
            }
        });
    }

    private handleResize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.cameras.main.setViewport(0, 0, width, height);
        this.backgroundManager?.resize(width, height);
        this.circleManager?.resize(width, height);
        this.uiManager?.resize(width, height);
        this.countdownManager?.resize(width, height);
        this.pauseManager?.resize(width, height);

        // Resize tutorial if active
        if (this.tutorialManager) {
            this.tutorialManager.resize(width, height);
        }

        // Practice Mode removed - out of scope
    }

    private async startGame() {
        // Check if user should see gameplay tutorial
        if (shouldShowTutorial('gameplay')) {
            this.showGameplayTutorial();
        } else {
            // Start countdown after UI is ready
            await this.countdownManager.startCountdown();
            this.startNewLevel();

            // Practice Mode removed - out of scope
        }
    }

    private async startNewLevel() {
        this.patterns = PatternGenerator.generate(this.currentLevel, GAME_CONFIG.circleCount, this.difficulty);
        this.playerPattern = [];
        this.canInput = false;

        // Update UI immediately for new level
        this.uiManager.updateLevel(this.currentLevel);
        this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());

        // Start progress tracking for this level
        this.progressTracker.startTracking(this.patterns);
        this.uiManager.startProgress(this.patterns.length);

        await this.transitionManager.showLevelStart(this.currentLevel);
        await this.showPattern();
        this.canInput = true;
    }

    private async showPattern() {
        this.isShowingPattern = true;
        this.canInput = false;
        await this.patternManager.showPattern(this.patterns);
        this.isShowingPattern = false;
        this.canInput = true;
    }

    private async handleCircleClick(index: number) {
        if (!this.canInput) return;

        const circle = this.circles[index];
        const currentPattern = this.patterns[this.playerPattern.length];

        if (!currentPattern) return;

        const playerPattern: Pattern = {
            index,
            type: currentPattern.type
        };

        this.playerPattern.push(playerPattern);

        // Play animation and sound
        this.audioManager.playTapSound(index);
        await circle.playTapAnimation();

        // Record the player input in progress tracker
        const isCorrect = this.progressTracker.recordPlayerInput(playerPattern);

        // Check if the pattern is correct (redundant check but keeping for safety)
        if (playerPattern.index !== currentPattern.index || !isCorrect) {
            await this.handleFailure();
            return;
        }

        // If player completed the pattern correctly
        if (this.playerPattern.length === this.patterns.length) {
            await this.handleSuccess();
        }
    }

    private async handleSuccess() {
        this.canInput = false;
        await this.transitionManager.showSuccess();

        // Handle combo logic and scoring only in normal mode
        if (this.gameMode === 'normal') {
            const newCombo = this.comboManager.recordSuccess();
            const comboMultiplier = this.comboManager.getScoreMultiplier();
            const comboState = this.comboManager.getComboState();

            // Check for milestone achievement
            const milestone = this.comboManager.checkMilestone();
            if (milestone) {
                this.audioManager.playMilestoneSound(milestone);
                this.uiManager.showComboMilestone(milestone);
            } else if (newCombo >= 3) {
                // Play combo sound for sustained combos
                this.audioManager.playComboSound(newCombo);
            }

            // Calculate reward with combo multiplier
            const reward = this.rewardSystem.calculateReward(this.currentLevel, true, comboMultiplier);
            this.score += reward;
            this.coins += Math.floor(reward / 10); // Convert some points to coins

            // Update UI with combo information
            this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());
            this.uiManager.updateCombo(comboState.currentCombo, comboState.multiplier, comboState.bestCombo);

            // Send score update to Telegram bot
            this.sendScoreToBot();
        }

        // Always advance level
        this.currentLevel++;

        // Show first success tutorial if this is their first successful level
        if (this.currentLevel === 2) { // Just completed level 1
            this.showFirstSuccessTutorial();
        }

        await this.startNewLevel();
    }

    private async handleFailure() {
        this.canInput = false;
        await this.transitionManager.showFailure();

        // Handle combo breaking and retry logic only in normal mode
        if (this.gameMode === 'normal') {
            const brokenCombo = this.comboManager.recordFailure();
            if (brokenCombo > 0) {
                this.audioManager.playComboBreakSound();
                this.uiManager.showComboBreak(brokenCombo);
            }

            // Update combo display
            const comboState = this.comboManager.getComboState();
            this.uiManager.updateCombo(comboState.currentCombo, comboState.multiplier, comboState.bestCombo);

            // Send final score to bot on game over
            if (!this.rewardSystem.deductTryAgainCost()) {
                this.sendScoreToBot();

                // Show first failure tutorial if this is user's first failure
                if (this.currentLevel === 1) { // Failed on level 1
                    this.showFirstFailureTutorial();
                }

                this.returnToMenu();
                return;
            }

            this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());
        }

        // Reset player pattern for retry
        this.playerPattern = [];

        // Reset progress tracking for retry
        this.progressTracker.startTracking(this.patterns);
        this.uiManager.startProgress(this.patterns.length);

        await this.showPattern();
        this.canInput = true;
    }

    private sendScoreToBot() {
        if (window.Telegram?.WebApp) {
            const gameData = {
                score: this.score,
                level: this.currentLevel,
                coins: this.coins,
                difficulty: this.difficulty
            };
            window.Telegram.WebApp.sendData(JSON.stringify(gameData));
        }
    }

    private handleTryAgain() {
        if (this.rewardSystem.deductTryAgainCost()) {
            this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());
            this.playerPattern = [];

            // Reset progress tracking for try again
            this.progressTracker.startTracking(this.patterns);
            this.uiManager.startProgress(this.patterns.length);

            this.showPattern();
        }
    }

    private handlePause() {
        this.logger.log('Pause requested');
        this.pauseManager.pause();
    }

    private handleResume() {
        this.logger.log('Game resumed');
        // Additional resume logic if needed
    }

    private handleRestart() {
        this.logger.log('Restart requested');
        this.currentLevel = 1;
        this.patterns = [];
        this.playerPattern = [];
        this.score = 0;
        this.coins = 0;
        this.isShowingPattern = false;
        this.canInput = false;

        // Reset combo system
        this.comboManager.reset();

        // Reset progress tracker
        this.progressTracker.reset();

        // Reset UI
        this.uiManager.updateLevel(this.currentLevel);
        this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());

        // Reset combo display
        const comboState = this.comboManager.getComboState();
        this.uiManager.updateCombo(comboState.currentCombo, comboState.multiplier, comboState.bestCombo);

        // Restart the game
        this.startNewLevel();
    }

    private returnToMenu() {
        this.logger.log('Returning to menu');

        // Clear saved game when user voluntarily returns to menu
        // This indicates they're done with their current session
        this.clearSavedGame();

        // Close Telegram WebApp if it exists
        if (window.Telegram?.WebApp) {
            this.logger.log('Closing Telegram WebApp');
            window.Telegram.WebApp.close();
        }
        this.logger.log('Starting MenuScene');
        this.scene.start('MenuScene');
    }

    update() {
        this.backgroundManager?.update();
        this.checkAutoSave();
    }

    // Auto-Save System Methods

    /**
     * Set up auto-save event listeners
     */
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

    /**
     * Save current game state to local storage
     */
    private async saveGameState(): Promise<void> {
        try {
            const gameState: SavedGameState = {
                currentLevel: this.currentLevel,
                score: this.score,
                coins: this.coins,
                difficulty: this.difficulty,
                gameMode: this.gameMode,
                // Practice Mode removed - out of scope
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
    private clearSavedGame(): void {
        const result = this.gameStateStorage.clearSavedGame();
        if (!result.success) {
            this.logger.warn('Failed to clear saved game:', result.error);
        }
    }

    /**
     * Auto-save game state at regular intervals during gameplay
     */
    private checkAutoSave(): void {
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

    // Tutorial System Methods
    private showGameplayTutorial(): void {
        const { width, height } = this.cameras.main;

        // Create circle positions for highlighting
        const circlePositions = this.circles.map(circle => ({
            x: circle.x,
            y: circle.y,
            radius: circle.radius
        }));

        // Update tutorial positions for current screen size and circle positions
        const updatedSteps = updateTutorialPositions(
            gameplayTutorialConfig.steps,
            width,
            height,
            circlePositions
        );

        const config = {
            ...gameplayTutorialConfig,
            steps: updatedSteps
        };

        this.tutorialManager.startTutorial(
            config,
            async () => {
                // Tutorial completed - start the actual game
                markTutorialCompleted('gameplay');
                await this.countdownManager.startCountdown();
                this.startNewLevel();
            },
            async () => {
                // Tutorial skipped - start the actual game
                markTutorialCompleted('gameplay');
                await this.countdownManager.startCountdown();
                this.startNewLevel();
            }
        );
    }

    private showFirstSuccessTutorial(): void {
        if (!shouldShowTutorial('first_success')) return;

        this.tutorialManager.startTutorial(
            firstSuccessConfig,
            () => {
                // Tutorial completed
                markTutorialCompleted('first_success');
            },
            () => {
                // Tutorial skipped (shouldn't happen as skip is disabled for this)
                markTutorialCompleted('first_success');
            }
        );
    }

    private showFirstFailureTutorial(): void {
        if (!shouldShowTutorial('first_failure')) return;

        this.tutorialManager.startTutorial(
            firstFailureConfig,
            () => {
                // Tutorial completed
                markTutorialCompleted('first_failure');
            },
            () => {
                // Tutorial skipped (shouldn't happen as skip is disabled for this)
                markTutorialCompleted('first_failure');
            }
        );
    }
}