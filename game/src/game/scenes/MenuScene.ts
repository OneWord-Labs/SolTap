import Phaser from 'phaser';
import { COLORS } from '../constants';
import { DifficultyMode, GameMode, SavedGameState } from '../types';
import { TutorialManager } from '../managers/TutorialManager';
import {
  menuTutorialConfig,
  shouldShowTutorial,
  markTutorialCompleted,
  updateTutorialPositions
} from '../config/tutorialConfig';
import { ResponsiveConfig } from '../utils/ResponsiveConfig';
import { DeviceDetector } from '../utils/DeviceDetector';
import { GameStateStorage } from '../services/GameStateStorage';

export class MenuScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private buttons: Phaser.GameObjects.Text[] = [];
  private welcomeText!: Phaser.GameObjects.Text;
  private tutorialManager!: TutorialManager;
  private responsiveConfig: ResponsiveConfig;
  private deviceDetector: DeviceDetector;
  private gameStateStorage!: GameStateStorage;

  constructor() {
    super({ key: 'MenuScene' });
    this.responsiveConfig = ResponsiveConfig.getInstance();
    this.deviceDetector = DeviceDetector.getInstance();
  }

  create() {
    // Initialize game state storage
    this.gameStateStorage = new GameStateStorage();

    this.createMenuElements();
    this.scale.on('resize', this.handleResize, this);

    // Initialize tutorial system
    this.tutorialManager = new TutorialManager(this);

    // Check storage health and warn users if needed
    this.checkStorageHealth();

    // Show menu tutorial if it's the user's first time
    this.time.delayedCall(500, () => {
      this.checkAndShowTutorial();
    });
  }

  /**
   * Check storage health and show warnings if needed
   */
  private checkStorageHealth(): void {
    const healthReport = this.gameStateStorage.checkStorageHealth();

    if (!healthReport.healthy) {
      // Show storage health warnings
      const warningMessages = healthReport.issues.map(issue =>
        this.gameStateStorage.getErrorHandler().getUserFriendlyMessage(issue)
      );

      const combinedMessage = warningMessages.join('\n\n');

      // Show warning notification
      this.time.delayedCall(1000, () => {
        this.showWarningNotification(combinedMessage);
      });
    }
  }

  /**
   * Show warning notification to user
   */
  private showWarningNotification(message: string): void {
    // Create a temporary text overlay for warning notification
    const { width, height } = this.cameras.main;
    const warningText = this.add.text(width / 2, height * 0.8, message, {
      fontSize: '20px',
      color: '#FFD700',
      fontFamily: 'Arial',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      padding: { x: 20, y: 15 },
      fixedWidth: width * 0.85,
      align: 'center',
      wordWrap: { width: width * 0.75 }
    }).setOrigin(0.5);

    // Auto-hide after 8 seconds (longer for warnings)
    this.time.delayedCall(8000, () => {
      if (warningText && warningText.scene) {
        warningText.destroy();
      }
    });
  }

  private createMenuElements() {
    const { width, height } = this.cameras.main;
    
    // Welcome message - positioned at 15% of screen height
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name) {
      const userName = window.Telegram.WebApp.initDataUnsafe.user.first_name;
      this.welcomeText = this.add.text(width / 2, height * 0.15, `Welcome, ${userName}! 👋`, {
        fontSize: this.calculateFontSize(36),
        color: '#FFFFFF',
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center'
      }).setOrigin(0.5);
    }
    
    // Title - positioned at 35% of screen height
    this.title = this.add.text(width / 2, height * 0.35, 'Sol Tap', {
      fontSize: this.calculateFontSize(48),
      color: '#14F195',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Clear existing buttons
    this.buttons.forEach(button => button.destroy());
    this.buttons = [];

    // Check if there's a saved game
    const hasSavedGame = this.gameStateStorage.hasSavedGame();

    // Calculate button layout based on whether resume button is shown
    const buttonSpacing = height * 0.08; // 8% of screen height for tighter spacing
    const totalButtons = hasSavedGame ? 4 : 3; // Include resume button if saved game exists
    const startY = height * 0.4; // Start higher to accommodate more buttons

    let currentButtonIndex = 0;

    // Resume Game button (if saved game exists)
    if (hasSavedGame) {
      this.buttons.push(
        this.createResumeButton(
          width / 2,
          startY + buttonSpacing * currentButtonIndex,
          'Resume Game'
        )
      );
      currentButtonIndex++;
    }

    // Novice Mode button
    this.buttons.push(
      this.createModeButton(
        width / 2,
        startY + buttonSpacing * currentButtonIndex,
        'Novice Mode',
        'novice',
        'normal'
      )
    );
    currentButtonIndex++;

    // Expert Mode button
    this.buttons.push(
      this.createModeButton(
        width / 2,
        startY + buttonSpacing * currentButtonIndex,
        'Expert Mode',
        'expert',
        'normal'
      )
    );
    currentButtonIndex++;

    // Practice Mode removed - out of scope
  }

  private calculateFontSize(baseSize: number, type: 'level' | 'menu' | 'ui' = 'menu'): string {
    // Use responsive configuration for better device-specific sizing
    return this.responsiveConfig.calculateFontSize(baseSize, type);
  }

  private createModeButton(x: number, y: number, text: string, mode: DifficultyMode, gameMode: GameMode) {
    const config = this.responsiveConfig.getCurrentConfig();
    const buttonWidth = this.responsiveConfig.calculateButtonWidth(this.cameras.main.width);
    const touchTargetSize = config.touchTargetSize;

    const button = this.add.text(x, y, text, {
      fontSize: this.calculateFontSize(32, 'menu'),
      color: '#FFFFFF',
      fontFamily: 'Arial',
      backgroundColor: '#14F195',
      padding: config.buttonSize.padding,
      fixedWidth: buttonWidth,
      fixedHeight: Math.max(config.buttonSize.height, touchTargetSize),
      align: 'center'
    })
    .setOrigin(0.5)
    .setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(
        -buttonWidth / 2,
        -Math.max(config.buttonSize.height, touchTargetSize) / 2,
        buttonWidth,
        Math.max(config.buttonSize.height, touchTargetSize)
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });

    // Add hover effect
    button.on('pointerover', () => {
      button.setStyle({ color: '#14F195', backgroundColor: '#FFFFFF' });
    });
    
    button.on('pointerout', () => {
      button.setStyle({ color: '#FFFFFF', backgroundColor: '#14F195' });
    });

    button.on('pointerdown', () => this.startGame(mode, gameMode));
    
    return button;
  }

  // Practice Mode button method removed - out of scope

  private createResumeButton(x: number, y: number, text: string) {
    const config = this.responsiveConfig.getCurrentConfig();
    const buttonWidth = this.responsiveConfig.calculateButtonWidth(this.cameras.main.width);
    const touchTargetSize = config.touchTargetSize;

    const button = this.add.text(x, y, text, {
      fontSize: this.calculateFontSize(32, 'menu'),
      color: '#FFFFFF',
      fontFamily: 'Arial',
      backgroundColor: '#FF6B00', // Orange for resume button
      padding: config.buttonSize.padding,
      fixedWidth: buttonWidth,
      fixedHeight: Math.max(config.buttonSize.height, touchTargetSize),
      align: 'center'
    })
    .setOrigin(0.5)
    .setInteractive({
      useHandCursor: true,
      hitArea: new Phaser.Geom.Rectangle(
        -buttonWidth / 2,
        -Math.max(config.buttonSize.height, touchTargetSize) / 2,
        buttonWidth,
        Math.max(config.buttonSize.height, touchTargetSize)
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains
    });

    // Add hover effect
    button.on('pointerover', () => {
      button.setStyle({ color: '#FF6B00', backgroundColor: '#FFFFFF' });
    });

    button.on('pointerout', () => {
      button.setStyle({ color: '#FFFFFF', backgroundColor: '#FF6B00' });
    });

    button.on('pointerdown', () => this.resumeGame());

    return button;
  }

  /**
   * Resume saved game
   */
  private async resumeGame(): Promise<void> {
    // If tutorial is active, don't start game yet
    if (this.tutorialManager && this.tutorialManager.isActiveTutorial()) {
      return;
    }

    try {
      const result = await this.gameStateStorage.loadGame();
      if (result.success && result.data) {
        const savedState = result.data;

        // Start MainScene with saved state
        this.scene.start('MainScene', {
          resumeGame: true,
          savedState: savedState,
          difficulty: savedState.difficulty,
          gameMode: savedState.gameMode
        });
      } else {
        // If loading fails, show user-friendly error and recreate menu
        const userFriendlyMessage = this.gameStateStorage.getUserFriendlyError(result);
        console.error('Failed to resume game:', result.error);

        // Show error notification to user (you can implement a toast or modal here)
        this.showErrorNotification(userFriendlyMessage);

        this.createMenuElements(); // This will hide the resume button since load failed
      }
    } catch (error) {
      console.error('Unexpected error during resume:', error);
      this.showErrorNotification('An unexpected error occurred while resuming your game.');
      this.createMenuElements();
    }
  }

  /**
   * Show error notification to user
   */
  private showErrorNotification(message: string): void {
    // Create a temporary text overlay for error notification
    const { width, height } = this.cameras.main;
    const errorText = this.add.text(width / 2, height * 0.7, message, {
      fontSize: '24px',
      color: '#FF6B6B',
      fontFamily: 'Arial',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: { x: 20, y: 10 },
      fixedWidth: width * 0.8,
      align: 'center',
      wordWrap: { width: width * 0.7 }
    }).setOrigin(0.5);

    // Auto-hide after 5 seconds
    this.time.delayedCall(5000, () => {
      if (errorText && errorText.scene) {
        errorText.destroy();
      }
    });
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;
    this.cameras.main.setViewport(0, 0, width, height);
    this.createMenuElements(); // Recreate all elements with new dimensions

    // Resize tutorial if active
    if (this.tutorialManager) {
      this.tutorialManager.resize(width, height);
    }
  }

  private checkAndShowTutorial() {
    if (shouldShowTutorial('menu')) {
      const { width, height } = this.cameras.main;

      // Update tutorial positions for current screen size
      const updatedSteps = updateTutorialPositions(
        menuTutorialConfig.steps,
        width,
        height
      );

      const config = {
        ...menuTutorialConfig,
        steps: updatedSteps
      };

      this.tutorialManager.startTutorial(
        config,
        () => {
          // Tutorial completed
          markTutorialCompleted('menu');
        },
        () => {
          // Tutorial skipped
          markTutorialCompleted('menu');
        }
      );
    }
  }

  private startGame(mode: DifficultyMode, gameMode: GameMode = 'normal') {
    // If tutorial is active, don't start game yet
    if (this.tutorialManager && this.tutorialManager.isActiveTutorial()) {
      return;
    }

    this.scene.start('MainScene', { difficulty: mode, gameMode: gameMode });
  }
}
