import Phaser from 'phaser';
import { COLORS } from '../constants';

export interface PauseCallbacks {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export class PauseManager {
  private scene: Phaser.Scene;
  private isPaused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private pauseBackground!: Phaser.GameObjects.Rectangle;
  private callbacks: PauseCallbacks;

  // Game state preservation
  private pausedTweens: Phaser.Tweens.Tween[] = [];
  private pausedTimers: Phaser.Time.TimerEvent[] = [];
  private sceneWasActive = true;

  constructor(scene: Phaser.Scene, callbacks: PauseCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.createPauseOverlay();
    this.setupKeyboardControls();
  }

  private createPauseOverlay() {
    const { width, height } = this.scene.cameras.main;

    // Semi-transparent background
    this.pauseBackground = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setVisible(false)
      .setDepth(1000);

    // Main container for pause UI
    this.pauseOverlay = this.scene.add.container(width / 2, height / 2)
      .setDepth(1001)
      .setVisible(false);

    // Title text
    const pauseTitle = this.scene.add.text(0, -120, 'GAME PAUSED', {
      fontSize: '32px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Button styling
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonSpacing = 60;

    // Resume button
    const resumeButton = this.createButton(
      0, -30,
      buttonWidth, buttonHeight,
      'Resume',
      COLORS.success,
      () => this.resume()
    );

    // Restart button
    const restartButton = this.createButton(
      0, 40,
      buttonWidth, buttonHeight,
      'Restart',
      COLORS.warning,
      () => this.handleRestart()
    );

    // Menu button
    const menuButton = this.createButton(
      0, 110,
      buttonWidth, buttonHeight,
      'Main Menu',
      COLORS.danger,
      () => this.handleMenu()
    );

    // Add controls hint
    const controlsHint = this.scene.add.text(0, 180, 'Press ESC or SPACE to resume', {
      fontSize: '16px',
      color: '#CCCCCC',
      fontStyle: 'italic'
    }).setOrigin(0.5);

    this.pauseOverlay.add([
      pauseTitle,
      resumeButton,
      restartButton,
      menuButton,
      controlsHint
    ]);
  }

  private createButton(
    x: number, y: number,
    width: number, height: number,
    text: string,
    color: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const background = this.scene.add.rectangle(0, 0, width, height, color)
      .setStrokeStyle(2, 0xFFFFFF);

    const buttonText = this.scene.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const container = this.scene.add.container(x, y, [background, buttonText]);

    // Make interactive
    container.setSize(width, height);
    container.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        background.setAlpha(0.8);
        container.setScale(1.05);
      })
      .on('pointerout', () => {
        background.setAlpha(1);
        container.setScale(1);
      })
      .on('pointerdown', () => {
        background.setAlpha(0.6);
      })
      .on('pointerup', () => {
        background.setAlpha(0.8);
        callback();
      });

    return container;
  }

  private setupKeyboardControls() {
    // ESC and SPACE keys for pause/resume
    this.scene.input.keyboard!.on('keydown-ESC', () => {
      this.toggle();
    });

    this.scene.input.keyboard!.on('keydown-SPACE', () => {
      if (this.isPaused) {
        this.resume();
      }
    });
  }

  pause() {
    if (this.isPaused) return;

    this.isPaused = true;
    this.sceneWasActive = this.scene.scene.isActive();

    // Store and pause all tweens
    this.pausedTweens = [];
    this.scene.tweens.getAllTweens().forEach(tween => {
      if (tween.isPlaying()) {
        this.pausedTweens.push(tween);
        tween.pause();
      }
    });

    // Store and pause all timers
    this.pausedTimers = [];
    this.scene.time.getAllEvents().forEach(event => {
      if (event.getProgress() < 1) {
        this.pausedTimers.push(event);
        event.paused = true;
      }
    });

    // Pause the scene physics and input
    this.scene.scene.pause();

    // Show pause overlay
    this.pauseBackground.setVisible(true);
    this.pauseOverlay.setVisible(true);

    // Ensure overlay is on top
    this.pauseBackground.setDepth(1000);
    this.pauseOverlay.setDepth(1001);

    console.log('Game paused');
  }

  resume() {
    if (!this.isPaused) return;

    this.isPaused = false;

    // Resume the scene
    if (this.sceneWasActive) {
      this.scene.scene.resume();
    }

    // Resume all paused tweens
    this.pausedTweens.forEach(tween => {
      tween.resume();
    });
    this.pausedTweens = [];

    // Resume all paused timers
    this.pausedTimers.forEach(timer => {
      timer.paused = false;
    });
    this.pausedTimers = [];

    // Hide pause overlay
    this.pauseBackground.setVisible(false);
    this.pauseOverlay.setVisible(false);

    this.callbacks.onResume();
    console.log('Game resumed');
  }

  toggle() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  private handleRestart() {
    this.resume();
    this.callbacks.onRestart();
  }

  private handleMenu() {
    this.resume();
    this.callbacks.onMenu();
  }

  getIsPaused(): boolean {
    return this.isPaused;
  }

  resize(width: number, height: number) {
    this.pauseBackground.setSize(width, height);
    this.pauseOverlay.setPosition(width / 2, height / 2);
  }

  destroy() {
    this.pauseBackground?.destroy();
    this.pauseOverlay?.destroy();
    this.pausedTweens = [];
    this.pausedTimers = [];
  }
}