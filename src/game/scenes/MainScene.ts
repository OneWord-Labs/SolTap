import Phaser from 'phaser';
    import { Pattern, DifficultyMode } from '../types';
    import { COLORS, GAME_CONFIG } from '../constants';
    import { PatternGenerator } from '../utils/patternGenerator';
    import { AudioManager } from '../utils/audioManager';
    import { RewardSystem } from '../utils/rewardSystem';
    import { CircleManager } from '../utils/circleManager';
    import { TransitionManager } from '../utils/transitionManager';
    import { BackgroundManager } from '../utils/BackgroundManager';
    import { UIManager } from '../utils/UIManager';
    import { PatternManager } from '../utils/PatternManager';
    import { HitDetection } from '../utils/hitDetection';
    import { CountdownManager } from '../utils/CountdownManager';
    import { Logger } from '../../utils/Logger';
    import { Circle } from '../components/Circle';

    export class MainScene extends Phaser.Scene {
      private patterns: Pattern[] = [];
      private playerSequence: Pattern[] = [];
      private circles: Circle[] = [];
      private isShowingPattern = false;
      private currentLevel = 1;
      private audioManager: AudioManager;
      private rewardSystem: RewardSystem;
      private circleManager: CircleManager;
      private transitionManager: TransitionManager;
      private backgroundManager: BackgroundManager;
      private uiManager: UIManager;
      private patternManager: PatternManager;
      private countdownManager: CountdownManager;
      private canInput = false;
      private difficulty: DifficultyMode = 'novice';
      private logger: Logger;
      private pointerDownTime: number = 0;
      private isLongPressing: boolean = false;
      private longPressIndex: number = -1;
      private longPressTolerance: number = 500;
      private longPressTimer: Phaser.Time.TimerEvent | null = null;

      constructor() {
        super({ key: 'MainScene' });
        this.audioManager = new AudioManager();
        this.rewardSystem = new RewardSystem();
        this.logger = new Logger('MainScene');
      }

      init(data: { difficulty: DifficultyMode, devMode?: boolean, devLevel?: number, longPressEnabled?: boolean }) {
        this.difficulty = data.difficulty;
        this.currentLevel = 1;
        this.patterns = [];
        this.playerSequence = [];
        this.isShowingPattern = false;
        this.canInput = false;
      }

      create() {
        this.setupManagers();
        this.setupEventListeners();
        this.startNewLevel();

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
          this.pointerDownTime = pointer.downTime;
          this.handlePointerDown(pointer);
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
          this.handlePointerUp(pointer);
        });
      }

      private setupManagers() {
        this.backgroundManager = new BackgroundManager(this);
        this.circleManager = new CircleManager(this, this.difficulty === 'expert');
        this.circles = this.circleManager.createCircles(
          this.cameras.main.width,
          this.cameras.main.height
        );
        
        this.transitionManager = new TransitionManager(this);
        this.uiManager = new UIManager(
          this,
          () => this.handleTryAgain(),
          () => this.returnToMenu()
        );
        
        this.patternManager = new PatternManager(
          this,
          this.circles,
          this.audioManager,
          this.difficulty
        );

        this.countdownManager = new CountdownManager(this);
      }

      private setupEventListeners() {
        // Set up resize handler
        this.scale.on('resize', this.handleResize, this);
      }

      private handleResize = (gameSize: Phaser.Structs.Size) => {
        const width = gameSize.width;
        const height = gameSize.height;

        this.cameras.main.setViewport(0, 0, width, height);
        this.backgroundManager?.resize(width, height);
        this.circleManager?.resize(width, height);
        this.uiManager?.resize(width, height);
        this.countdownManager?.resize(width, height);
      }

      private async startNewLevel() {
        this.patterns = PatternGenerator.generate(this.currentLevel, GAME_CONFIG.circleCount, this.difficulty);
        this.playerSequence = [];
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
        this.logger.info('showPattern called');
        await this.patternManager.showPattern(this.patterns);
        this.isShowingPattern = false;
        this.canInput = true;
      }

      private handlePointerDown(pointer: Phaser.Input.Pointer) {
        if (!this.canInput || this.isShowingPattern) {
          this.logger.info('Pointer down ignored - input locked');
          return;
        }
      
        this.logger.info(`Pointer down at x: ${pointer.x}, y: ${pointer.y}`);
      
        let clickedCircleIndex = -1;
        for (let i = 0; i < this.circles.length; i++) {
          const circle = this.circles[i];
          if (circle.isPointInside(pointer.x, pointer.y)) {
            clickedCircleIndex = i;
            break;
          }
        }
      
        if (clickedCircleIndex === -1) {
          this.logger.info('Pointer down outside of any circle');
          return;
        }
      
        const currentPattern = this.patterns[this.playerSequence.length];
        if (currentPattern && currentPattern.type === 'hold' && currentPattern.index === clickedCircleIndex) {
          this.isLongPressing = true;
          this.longPressIndex = clickedCircleIndex;
          this.logger.info(`Long press started for circle index: ${clickedCircleIndex}`);
          this.circles[clickedCircleIndex].showLongPressIndicator();
          
          // Cancel any existing long press timer
          if (this.longPressTimer) {
            this.longPressTimer.destroy();
            this.longPressTimer = null;
          }
          
          // Start a new long press timer
          this.longPressTimer = this.time.delayedCall(currentPattern.duration! - this.longPressTolerance, () => {
            if (this.isLongPressing) {
              this.logger.info(`Long press successful for circle index: ${clickedCircleIndex}`);
              this.handleCircleClick(clickedCircleIndex, pointer, currentPattern.duration!);
            }
          });
        }
      }

      private async handlePointerUp(pointer: Phaser.Input.Pointer) {
        if (!this.canInput || this.isShowingPattern) {
          this.logger.info('Pointer up ignored - input locked');
          return;
        }
      
        this.logger.info(`Pointer up at x: ${pointer.x}, y: ${pointer.y}`);
      
        let clickedCircleIndex = -1;
        for (let i = 0; i < this.circles.length; i++) {
          const circle = this.circles[i];
          if (circle.isPointInside(pointer.x, pointer.y)) {
            clickedCircleIndex = i;
            break;
          }
        }
      
        if (clickedCircleIndex === -1) {
          this.logger.info('Pointer up outside of any circle');
          return;
        }
      
        const duration = pointer.upTime - this.pointerDownTime;
        
        // If it's a long press, check if the pointer up is on the same circle
        if (this.isLongPressing && this.longPressIndex !== clickedCircleIndex) {
          this.logger.info('Pointer up on a different circle during long press');
          this.isLongPressing = false;
          this.longPressIndex = -1;
          if (this.longPressTimer) {
            this.longPressTimer.destroy();
            this.longPressTimer = null;
          }
          return;
        }
        
        // Cancel the long press timer if it's a regular click or a short hold
        if (this.longPressTimer && this.patterns[this.playerSequence.length].type !== 'hold') {
          this.longPressTimer.destroy();
          this.longPressTimer = null;
        }
        
        this.handleCircleClick(clickedCircleIndex, pointer, duration);
      }

      private async handleCircleClick(index: number, pointer: Phaser.Input.Pointer, duration: number) {
        this.logger.info(`Handling click for circle index: ${index}, duration: ${duration}`);
      
        // Play the sound when a circle is clicked
        this.audioManager.playTapSound(index);
      
        // Immediately show the circle when clicked
        const circle = this.circles[index];
        circle.setVisible(true);
        circle.setActiveState();
        circle.playTapAnimation();
      
        const currentPattern = this.patterns[this.playerSequence.length];
      
        if (!currentPattern) {
          this.logger.warn('No current pattern found');
          return;
        }
      
        const playerPattern: Pattern = {
          index,
          type: currentPattern.type,
          ...(currentPattern.type === 'hold' && { duration: currentPattern.duration }),
          ...(currentPattern.type === 'rapid' && { count: currentPattern.count })
        };
      
        if (this.isLongPressing) {
          this.circles[this.longPressIndex].hideLongPressIndicator();
          this.isLongPressing = false;
          this.longPressIndex = -1;
          if (currentPattern.type !== 'hold') {
            this.playerSequence.push(playerPattern);
          }
        } else {
          this.playerSequence.push(playerPattern);
        }
      
        if (index !== currentPattern.index) {
          this.logger.info(`Incorrect circle clicked. Expected: ${currentPattern.index}, Actual: ${index}`);
          await this.handleFailure();
          return;
        }
      
        this.logger.info(`Correct circle clicked. Expected: ${currentPattern.index}, Actual: ${index}`);
      
        if (this.playerSequence.length === this.patterns.length) {
          await this.handleSuccess();
        }
      }

      private async handleSuccess() {
        this.canInput = false;
        await this.transitionManager.showSuccess();
        const reward = this.rewardSystem.calculateReward(this.currentLevel, true);
        this.currentLevel++;
        this.logger.info(`Level ${this.currentLevel -1} completed, starting level ${this.currentLevel}`);
        this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());
        await this.startNewLevel();
      }

      private async handleFailure() {
        try {
          this.canInput = false;
          this.isShowingPattern = true;
          this.logger.info('Handling failure, resetting state');
          this.logger.info('Current patterns:', this.patterns);
          this.logger.info('Player sequence:', this.playerSequence);
          
          // Show failure message
          await this.transitionManager.showFailure();
          
          // Reset player state
          this.playerSequence = [];
          this.isLongPressing = false;
          this.longPressIndex = -1;
          
          if (this.longPressTimer) {
            this.longPressTimer.destroy();
            this.longPressTimer = null;
          }
          
          // Reset and prepare circles
          this.circles.forEach(circle => {
            circle.hideLongPressIndicator();
            circle.setActiveState(false);
            circle.setVisible(this.difficulty === 'novice');
          });
          
          // Show countdown before replaying pattern
          this.logger.info('Starting countdown before pattern replay');
          await this.countdownManager.showCountdown();
          
          this.logger.info('Replaying pattern after failure. Pattern length:', this.patterns.length);
          this.logger.info('Pattern details:', this.patterns);
          await this.showPattern();
          this.isShowingPattern = false;
          this.canInput = true;
          
        } catch (error) {
          console.error('Error in handleFailure:', error);
          this.isShowingPattern = false;
          this.canInput = true;
        }
      }

      private async handleTryAgain() {
        if (this.isShowingPattern) return;
        
        if (this.rewardSystem.deductTryAgainCost()) {
          this.uiManager.updateTokens(this.rewardSystem.getTokenBalance());
          this.playerSequence = [];
          this.canInput = false;
          
          // Reset the current level to the same level
          this.logger.info(`Retrying level ${this.currentLevel}`);
          this.patterns = PatternGenerator.generate(this.currentLevel, GAME_CONFIG.circleCount, this.difficulty);
          
          await this.countdownManager.showCountdown();
          await this.showPattern();
          this.canInput = true;
        }
      }

      private returnToMenu() {
        this.scene.start('MenuScene');
      }

      update() {
        this.backgroundManager?.update();
      }
    }