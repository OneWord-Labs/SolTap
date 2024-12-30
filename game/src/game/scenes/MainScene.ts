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

export default class MainScene extends Phaser.Scene {
    private patterns: Pattern[] = [];
    private playerPattern: Pattern[] = [];
    private circles: Circle[] = [];
    private currentLevel = 1;
    private canInput = false;
    private difficulty: DifficultyMode = 'novice';
    private isShowingPattern = false;

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
    }

    init(data: { difficulty: DifficultyMode }) {
        this.difficulty = data.difficulty;
        this.currentLevel = 1;
        this.patterns = [];
        this.playerPattern = [];
        this.isShowingPattern = false;
        this.canInput = false;
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
        await this.countdownManager.startCountdown();
        this.startNewLevel();
    }

    private async startNewLevel() {
        this.patterns = PatternGenerator.generate(this.currentLevel, GAME_CONFIG.circleCount, this.difficulty);
        this.playerPattern = [];
        this.canInput = false;

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
        this.rewardSystem.calculateReward(this.currentLevel, true);
        this.currentLevel++;
        this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());
        await this.startNewLevel();
    }

    private async handleFailure() {
        this.canInput = false;
        await this.transitionManager.showFailure();
        if (this.rewardSystem.deductTryAgainCost()) {
            this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());
            this.playerPattern = [];
            await this.showPattern();
            this.canInput = true;
        } else {
            this.returnToMenu();
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
        this.scene.start('MenuScene');
    }

    update() {
        this.backgroundManager?.update();
    }
}