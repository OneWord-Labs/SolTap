import Phaser from 'phaser';
import { Logger } from '../../utils/Logger';

export interface TutorialStep {
  id: string;
  title: string;
  text: string;
  targetElement?: string;
  highlightArea?: { x: number; y: number; width: number; height: number };
  circleHighlight?: { x: number; y: number; radius: number };
  position?: { x: number; y: number };
  action?: 'tap' | 'wait' | 'watch';
  duration?: number;
  skipable?: boolean;
}

export interface TutorialConfig {
  steps: TutorialStep[];
  canSkip: boolean;
  showProgress: boolean;
}

export class TutorialManager {
  private scene: Phaser.Scene;
  private logger: Logger;
  private isActive: boolean = false;
  private currentStep: number = 0;
  private steps: TutorialStep[] = [];

  // UI Elements
  private overlay?: Phaser.GameObjects.Rectangle;
  private tutorialContainer?: Phaser.GameObjects.Container;
  private titleText?: Phaser.GameObjects.Text;
  private contentText?: Phaser.GameObjects.Text;
  private nextButton?: Phaser.GameObjects.Text;
  private skipButton?: Phaser.GameObjects.Text;
  private progressText?: Phaser.GameObjects.Text;
  private highlightGraphics?: Phaser.GameObjects.Graphics;
  private spotlight?: Phaser.GameObjects.Graphics;

  // Configuration
  private config: TutorialConfig = {
    steps: [],
    canSkip: true,
    showProgress: true
  };

  // Callbacks
  private onComplete?: () => void;
  private onSkip?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.logger = new Logger('TutorialManager');
  }

  /**
   * Check if user has completed tutorial before
   */
  static hasCompletedTutorial(): boolean {
    try {
      const completed = localStorage.getItem('soltap_tutorial_completed');
      return completed === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Mark tutorial as completed
   */
  static markTutorialCompleted(): void {
    try {
      localStorage.setItem('soltap_tutorial_completed', 'true');
    } catch (error) {
      console.warn('Could not save tutorial completion state:', error);
    }
  }

  /**
   * Reset tutorial completion state (for testing)
   */
  static resetTutorialState(): void {
    try {
      localStorage.removeItem('soltap_tutorial_completed');
    } catch (error) {
      console.warn('Could not reset tutorial state:', error);
    }
  }

  /**
   * Start the tutorial with given configuration
   */
  startTutorial(config: TutorialConfig, onComplete?: () => void, onSkip?: () => void): void {
    if (this.isActive) {
      this.logger.warn('Tutorial already active');
      return;
    }

    this.config = { ...this.config, ...config };
    this.steps = config.steps;
    this.currentStep = 0;
    this.onComplete = onComplete;
    this.onSkip = onSkip;
    this.isActive = true;

    this.logger.log('Starting tutorial with', this.steps.length, 'steps');
    this.createTutorialUI();
    this.showCurrentStep();
  }

  /**
   * Stop the tutorial and clean up
   */
  stopTutorial(completed: boolean = false): void {
    if (!this.isActive) return;

    this.logger.log('Stopping tutorial, completed:', completed);
    this.isActive = false;
    this.cleanupUI();

    if (completed) {
      TutorialManager.markTutorialCompleted();
      this.onComplete?.();
    } else if (this.onSkip) {
      this.onSkip();
    }
  }

  /**
   * Move to next tutorial step
   */
  nextStep(): void {
    if (!this.isActive) return;

    this.currentStep++;

    if (this.currentStep >= this.steps.length) {
      this.stopTutorial(true);
      return;
    }

    this.showCurrentStep();
  }

  /**
   * Skip the tutorial
   */
  skipTutorial(): void {
    if (!this.isActive) return;

    this.logger.log('Tutorial skipped by user');
    this.stopTutorial(false);
  }

  /**
   * Check if tutorial is currently active
   */
  isActiveTutorial(): boolean {
    return this.isActive;
  }

  /**
   * Get current step information
   */
  getCurrentStep(): TutorialStep | null {
    if (!this.isActive || this.currentStep >= this.steps.length) {
      return null;
    }
    return this.steps[this.currentStep];
  }

  /**
   * Create the main tutorial UI elements
   */
  private createTutorialUI(): void {
    const { width, height } = this.scene.cameras.main;

    // Create semi-transparent overlay
    this.overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setDepth(1000);

    // Create spotlight graphics for highlighting
    this.spotlight = this.scene.add.graphics()
      .setDepth(1001);

    // Create highlight graphics for UI elements
    this.highlightGraphics = this.scene.add.graphics()
      .setDepth(1002);

    // Create container for tutorial content
    this.tutorialContainer = this.scene.add.container(width / 2, height * 0.8)
      .setDepth(1003);

    // Create tutorial content box background
    const contentBg = this.scene.add.rectangle(0, 0, width * 0.9, height * 0.25, 0x1a1a1a, 0.95)
      .setStrokeStyle(2, 0x14F195);

    // Create title text
    this.titleText = this.scene.add.text(0, -60, '', {
      fontSize: this.calculateFontSize(24),
      color: '#14F195',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5);

    // Create content text
    this.contentText = this.scene.add.text(0, -20, '', {
      fontSize: this.calculateFontSize(18),
      color: '#FFFFFF',
      fontFamily: 'Arial',
      align: 'center',
      wordWrap: { width: width * 0.8 }
    }).setOrigin(0.5);

    // Create next button
    this.nextButton = this.scene.add.text(width * 0.15, 40, 'Next', {
      fontSize: this.calculateFontSize(20),
      color: '#FFFFFF',
      fontFamily: 'Arial',
      backgroundColor: '#14F195',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.nextStep())
    .on('pointerover', () => this.nextButton?.setStyle({ backgroundColor: '#0FA87F' }))
    .on('pointerout', () => this.nextButton?.setStyle({ backgroundColor: '#14F195' }));

    // Create skip button (if allowed)
    if (this.config.canSkip) {
      this.skipButton = this.scene.add.text(-width * 0.15, 40, 'Skip Tutorial', {
        fontSize: this.calculateFontSize(16),
        color: '#888888',
        fontFamily: 'Arial',
        backgroundColor: '#333333',
        padding: { x: 15, y: 8 }
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.skipTutorial())
      .on('pointerover', () => this.skipButton?.setStyle({ backgroundColor: '#555555' }))
      .on('pointerout', () => this.skipButton?.setStyle({ backgroundColor: '#333333' }));
    }

    // Create progress text (if enabled)
    if (this.config.showProgress) {
      this.progressText = this.scene.add.text(0, 80, '', {
        fontSize: this.calculateFontSize(14),
        color: '#CCCCCC',
        fontFamily: 'Arial',
        align: 'center'
      }).setOrigin(0.5);
    }

    // Add all elements to container
    this.tutorialContainer.add([
      contentBg,
      this.titleText,
      this.contentText,
      this.nextButton
    ]);

    if (this.skipButton) {
      this.tutorialContainer.add(this.skipButton);
    }

    if (this.progressText) {
      this.tutorialContainer.add(this.progressText);
    }
  }

  /**
   * Show the current tutorial step
   */
  private showCurrentStep(): void {
    const step = this.steps[this.currentStep];
    if (!step) return;

    this.logger.log('Showing step:', step.id);

    // Update text content
    if (this.titleText) {
      this.titleText.setText(step.title);
    }

    if (this.contentText) {
      this.contentText.setText(step.text);
    }

    // Update progress
    if (this.progressText && this.config.showProgress) {
      this.progressText.setText(`Step ${this.currentStep + 1} of ${this.steps.length}`);
    }

    // Update next button text
    if (this.nextButton) {
      const isLastStep = this.currentStep === this.steps.length - 1;
      this.nextButton.setText(isLastStep ? 'Finish' : 'Next');
    }

    // Clear previous highlights
    this.spotlight?.clear();
    this.highlightGraphics?.clear();

    // Apply highlighting if specified
    this.applyHighlighting(step);

    // Handle step-specific actions
    if (step.action === 'wait' && step.duration) {
      this.scene.time.delayedCall(step.duration, () => {
        if (this.isActive) {
          this.nextStep();
        }
      });
    }
  }

  /**
   * Apply visual highlighting for the current step
   */
  private applyHighlighting(step: TutorialStep): void {
    const { width, height } = this.scene.cameras.main;

    if (step.circleHighlight && this.spotlight) {
      // Create circular spotlight effect
      this.spotlight.fillStyle(0x000000, 0.7);
      this.spotlight.fillRect(0, 0, width, height);

      // Cut out circle for spotlight
      this.spotlight.beginPath();
      this.spotlight.arc(step.circleHighlight.x, step.circleHighlight.y, step.circleHighlight.radius, 0, Math.PI * 2);
      this.spotlight.closePath();

      // Use blend mode to create cutout effect
      this.spotlight.fillStyle(0x000000, 0);
      this.spotlight.fill();
    }

    if (step.highlightArea && this.highlightGraphics) {
      // Create rectangular highlight
      const { x, y, width: w, height: h } = step.highlightArea;

      this.highlightGraphics.lineStyle(3, 0x14F195, 1);
      this.highlightGraphics.strokeRoundedRect(x, y, w, h, 8);

      // Add pulsing effect
      this.scene.tweens.add({
        targets: this.highlightGraphics,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1
      });
    }
  }

  /**
   * Clean up all tutorial UI elements
   */
  private cleanupUI(): void {
    this.overlay?.destroy();
    this.tutorialContainer?.destroy();
    this.spotlight?.destroy();
    this.highlightGraphics?.destroy();

    this.overlay = undefined;
    this.tutorialContainer = undefined;
    this.titleText = undefined;
    this.contentText = undefined;
    this.nextButton = undefined;
    this.skipButton = undefined;
    this.progressText = undefined;
    this.spotlight = undefined;
    this.highlightGraphics = undefined;
  }

  /**
   * Calculate responsive font size
   */
  private calculateFontSize(baseSize: number): string {
    const scaleFactor = Math.min(
      this.scene.cameras.main.width / 800,
      this.scene.cameras.main.height / 600
    );
    return `${Math.max(Math.floor(baseSize * scaleFactor), 12)}px`;
  }

  /**
   * Handle scene resize
   */
  resize(width: number, height: number): void {
    if (!this.isActive) return;

    // Update overlay size
    if (this.overlay) {
      this.overlay.setSize(width, height);
      this.overlay.setPosition(width / 2, height / 2);
    }

    // Update container position
    if (this.tutorialContainer) {
      this.tutorialContainer.setPosition(width / 2, height * 0.8);

      // Update content background size
      const contentBg = this.tutorialContainer.list[0] as Phaser.GameObjects.Rectangle;
      if (contentBg) {
        contentBg.setSize(width * 0.9, height * 0.25);
      }
    }

    // Re-show current step to update highlighting
    if (this.isActive) {
      this.showCurrentStep();
    }
  }
}