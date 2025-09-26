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
import { PhaserButton } from '../components/PhaserButton';
import { AudioManager } from '../utils/AudioManager';

export class MenuScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private buttons: PhaserButton[] = [];
  private welcomeText!: Phaser.GameObjects.Text;
  private tutorialManager!: TutorialManager;
  private responsiveConfig: ResponsiveConfig;
  private deviceDetector: DeviceDetector;
  private gameStateStorage!: GameStateStorage;
  private audioManager!: AudioManager;

  constructor() {
    super({ key: 'MenuScene' });
    this.responsiveConfig = ResponsiveConfig.getInstance();
    this.deviceDetector = DeviceDetector.getInstance();
  }

  create() {
    // Initialize game state storage
    this.gameStateStorage = new GameStateStorage();

    // Initialize audio manager
    this.audioManager = new AudioManager();

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

    // Title - positioned at 35% of screen height with Solana green
    this.title = this.add.text(width / 2, height * 0.35, 'Sol Tap', {
      fontSize: this.calculateFontSize(56),
      color: '#14F195',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      stroke: '#14F195',
      strokeThickness: 1
    }).setOrigin(0.5);

    // Add subtle title animation
    this.tweens.add({
      targets: this.title,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Clear existing buttons
    this.buttons.forEach(button => button.destroy());
    this.buttons = [];

    // Check if there's a saved game
    const hasSavedGame = this.gameStateStorage.hasSavedGame();

    // Button configuration with dynamic spacing to avoid overlap
    const buttonWidth = Math.min(width * 0.6, 280);
    const nominalButtonHeight = 54;
    const minSpacing = nominalButtonHeight + 12; // ensure gap between buttons
    const maxSpacing = Math.max(minSpacing, Math.min(height * 0.1, 84));

    // Determine how many primary buttons will be shown
    const totalPrimaryButtons = hasSavedGame ? 3 : 2; // Resume (optional), Novice, Expert
    const clusterHeight = (totalPrimaryButtons - 1) * maxSpacing;
    const centerY = height * 0.50; // center cluster vertically around mid-screen
    const startY = centerY - clusterHeight / 2;

    let currentButtonIndex = 0;

    // Resume Game button (if saved game exists)
    if (hasSavedGame) {
      const resumeButton = new PhaserButton(this, {
        x: width / 2,
        y: startY + maxSpacing * currentButtonIndex,
        text: 'Resume Game',
        width: buttonWidth,
        height: 54,
        variant: 'warning',
        onClick: async () => {
          await this.audioManager.initialize();
          this.audioManager.playMenuClick();
          this.resumeGame();
        }
      });
      this.buttons.push(resumeButton);
      currentButtonIndex++;
    }

    // Novice Mode button with Solana green
    const noviceButton = new PhaserButton(this, {
      x: width / 2,
      y: startY + maxSpacing * currentButtonIndex,
      text: 'Novice Mode',
      width: buttonWidth,
      height: 54,
      variant: 'primary',
      onClick: async () => {
        await this.initializeAudioAndStart('novice', 'normal');
      }
    });
    this.buttons.push(noviceButton);
    currentButtonIndex++;

    // Expert Mode button with Solana purple
    const expertButton = new PhaserButton(this, {
      x: width / 2,
      y: startY + maxSpacing * currentButtonIndex,
      text: 'Expert Mode',
      width: buttonWidth,
      height: 54,
      variant: 'secondary',
      onClick: async () => {
        await this.initializeAudioAndStart('expert', 'normal');
      }
    });
    this.buttons.push(expertButton);
    currentButtonIndex++;

    // Add bottom utility buttons in a row
    const utilityY = Math.max(height - 64, height * 0.82);
    const utilityCount = 4;
    const utilitySize = Math.min(50, Math.max(40, Math.floor(width / (utilityCount * 4))));
    // Space evenly across available width with margins
    const margin = Math.max(16, width * 0.06);
    const usableWidth = width - margin * 2;
    const step = usableWidth / (utilityCount - 1);
    const utilityXs = new Array(utilityCount).fill(0).map((_, i) => Math.floor(margin + step * i));

    // Tutorial button
    const tutorialButton = new PhaserButton(this, {
      x: utilityXs[0],
      y: utilityY,
      text: '?',
      width: utilitySize,
      height: utilitySize,
      variant: 'ghost',
      fontSize: '24px',
      onClick: async () => {
        await this.audioManager.initialize();
        this.audioManager.playMenuClick();
        this.checkAndShowTutorial();
      }
    });
    this.buttons.push(tutorialButton);

    // Settings button
    const settingsButton = new PhaserButton(this, {
      x: utilityXs[1],
      y: utilityY,
      text: '⚙',
      width: utilitySize,
      height: utilitySize,
      variant: 'ghost',
      fontSize: '24px',
      onClick: async () => {
        await this.audioManager.initialize();
        this.audioManager.playMenuClick();
        console.log('Settings');
      }
    });
    this.buttons.push(settingsButton);

    // Leaderboard button
    const leaderButton = new PhaserButton(this, {
      x: utilityXs[2],
      y: utilityY,
      text: '🏆',
      width: utilitySize,
      height: utilitySize,
      variant: 'ghost',
      fontSize: '24px',
      onClick: async () => {
        await this.audioManager.initialize();
        this.audioManager.playMenuClick();
        console.log('Leaderboard');
      }
    });
    this.buttons.push(leaderButton);

    // Share button
    const shareButton = new PhaserButton(this, {
      x: utilityXs[3],
      y: utilityY,
      text: '📤',
      width: utilitySize,
      height: utilitySize,
      variant: 'ghost',
      fontSize: '24px',
      onClick: async () => {
        await this.audioManager.initialize();
        this.audioManager.playMenuClick();
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.switchInlineQuery('Play Sol Tap!', ['users']);
        }
      }
    });
    this.buttons.push(shareButton);
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

  private async initializeAudioAndStart(mode: DifficultyMode, gameMode: GameMode = 'normal') {
    // Initialize audio on first user interaction
    try {
      await this.audioManager.initialize();
      console.log('Audio initialized successfully');
      // Play a subtle click to confirm input
      this.audioManager.playMenuClick();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }

    // Start the game
    this.startGame(mode, gameMode);
  }

  private startGame(mode: DifficultyMode, gameMode: GameMode = 'normal') {
    // If tutorial is active, don't start game yet
    if (this.tutorialManager && this.tutorialManager.isActiveTutorial()) {
      return;
    }

    this.scene.start('MainScene', { difficulty: mode, gameMode: gameMode });
  }
}
