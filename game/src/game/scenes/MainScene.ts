import Phaser from 'phaser';
import { DifficultyMode, Pattern } from '../types';
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
import { Logger } from '../../utils/Logger';
import { Circle } from '../components/Circle';

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
    private isShowingPattern = false;
    private score = 0;
    private coins = 0;
    private userName: string = '';

    // Managers
    private audioManager!: AudioManager;
    private rewardSystem!: RewardSystem;
    private circleManager!: CircleManager;
    private transitionManager!: TransitionManager;
    private backgroundManager!: BackgroundManager;
    private uiManager!: UIManager;
    private patternManager!: PatternManager;
    private countdownManager!: CountdownManager;
    private logger: Logger;

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
            this.logger.log('User name set:', this.userName);
        }
    }

    init(data: { difficulty: DifficultyMode }) {
        this.difficulty = data.difficulty;
        this.currentLevel = 1;
        this.patterns = [];
        this.playerPattern = [];
        this.isShowingPattern = false;
        this.canInput = false;
        this.score = 0;
        this.coins = 0;

        // Get user name from Telegram if not already set
        if (!this.userName && window.Telegram?.WebApp) {
            const { user } = window.Telegram.WebApp.initDataUnsafe;
            if (user) {
                this.userName = user.first_name;
            }
        }
    }

    create() {
        this.setupManagers();
        this.setupEventListeners();
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
            () => this.returnToMenu()
        );
        this.countdownManager = new CountdownManager(this);

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
            this.difficulty
        );
    }

    private setupEventListeners() {
        this.scale.on('resize', this.handleResize, this);
        
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (!this.canInput || this.isShowingPattern) return;
            
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
    }

    private async startGame() {
        // Start countdown after UI is ready
        await this.countdownManager.startCountdown();
        this.startNewLevel();
    }

    private async startNewLevel() {
        this.patterns = PatternGenerator.generate(this.currentLevel, GAME_CONFIG.circleCount, this.difficulty);
        this.playerPattern = [];
        this.canInput = false;

        // Update UI immediately for new level
        this.uiManager.updateLevel(this.currentLevel);
        this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());

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

        // Check if the pattern is correct
        if (playerPattern.index !== currentPattern.index) {
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
        const reward = this.rewardSystem.calculateReward(this.currentLevel, true);
        this.score += reward;
        this.coins += Math.floor(reward / 10); // Convert some points to coins
        this.currentLevel++;
        this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());
        
        // Send score update to Telegram bot
        this.sendScoreToBot();
        
        await this.startNewLevel();
    }

    private async handleFailure() {
        this.canInput = false;
        await this.transitionManager.showFailure();
        
        // Send final score to bot on game over
        if (!this.rewardSystem.deductTryAgainCost()) {
            this.sendScoreToBot();
            this.returnToMenu();
            return;
        }
        
        this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());
        this.playerPattern = [];
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
            this.showPattern();
        }
    }

    private returnToMenu() {
        this.logger.log('Returning to menu');
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
    }
}