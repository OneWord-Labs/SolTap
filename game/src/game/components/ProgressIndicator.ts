import Phaser from 'phaser';
import { COLORS } from '../constants';

/**
 * Progress Indicator Component
 * Shows the current progress through a pattern sequence (e.g., '3/5 correct')
 */
export class ProgressIndicator {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private progressText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressBarBackground!: Phaser.GameObjects.Rectangle;
  private stepIndicators: Phaser.GameObjects.Arc[] = [];

  private currentProgress = 0;
  private totalSteps = 0;
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createProgressIndicator();
  }

  private createProgressIndicator() {
    this.container = this.scene.add.container(0, 0);
    this.container.setVisible(false);

    // Create background for the progress indicator (responsive size)
    const { width } = this.scene.cameras.main;
    let containerWidth = width < 768 ? Math.min(width * 0.9, 300) : 200;
    let containerHeight = width < 768 ? 50 : 60;

    const bg = this.scene.add.rectangle(0, 0, containerWidth, containerHeight, 0x000000, 0.7);
    bg.setStrokeStyle(2, COLORS.secondary);
    this.container.add(bg);

    // Create progress text (e.g., "3/5") with responsive font size
    let fontSize = width < 768 ? '16px' : '20px';
    this.progressText = this.scene.add.text(0, -10, '', {
      fontSize: fontSize,
      color: '#14F195',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.container.add(this.progressText);

    // Create progress bar background (responsive width)
    let barWidth = Math.min(containerWidth * 0.8, 160);
    this.progressBarBackground = this.scene.add.rectangle(0, 15, barWidth, 8, 0x333333);
    this.container.add(this.progressBarBackground);

    // Create progress bar fill
    this.progressBar = this.scene.add.rectangle(0, 15, 0, 8, COLORS.primary);
    this.container.add(this.progressBar);

    // Set initial position (top center of screen)
    this.updatePosition();
  }

  /**
   * Initialize progress tracking for a new pattern
   */
  startProgress(totalSteps: number) {
    this.totalSteps = totalSteps;
    this.currentProgress = 0;
    this.isVisible = true;

    this.createStepIndicators();
    this.updateDisplay();
    this.show();
  }

  /**
   * Update progress when player completes a step
   */
  updateProgress(current: number) {
    if (current < 0 || current > this.totalSteps) return;

    this.currentProgress = current;
    this.updateDisplay();
    this.animateProgressUpdate();
  }

  /**
   * Complete the progress indicator with success animation
   */
  completeProgress() {
    this.currentProgress = this.totalSteps;
    this.updateDisplay();
    this.animateCompletion();
  }

  /**
   * Show error animation when progress fails
   */
  showError() {
    // Shake animation
    this.scene.tweens.add({
      targets: this.container,
      x: this.container.x - 5,
      duration: 50,
      ease: 'Power2',
      yoyo: true,
      repeat: 5
    });

    // Flash red
    this.scene.tweens.add({
      targets: this.progressBar,
      tint: 0xFF0000,
      duration: 200,
      ease: 'Power2',
      yoyo: true
    });

    // Animate failed step indicators
    this.stepIndicators.forEach((indicator, index) => {
      if (index < this.currentProgress) {
        // Completed steps fade out
        this.scene.tweens.add({
          targets: indicator,
          alpha: 0.3,
          duration: 300,
          ease: 'Power2'
        });
      }
    });
  }

  /**
   * Reset progress indicator
   */
  reset() {
    this.currentProgress = 0;
    this.totalSteps = 0;
    this.clearStepIndicators();
    this.hide();
  }

  /**
   * Show the progress indicator with fade-in animation
   */
  private show() {
    this.container.setVisible(true);
    this.container.setAlpha(0);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 300,
      ease: 'Power2'
    });
  }

  /**
   * Hide the progress indicator with fade-out animation
   */
  private hide() {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.container.setVisible(false);
      }
    });
  }

  private createStepIndicators() {
    this.clearStepIndicators();

    const startX = -(this.totalSteps - 1) * 15 / 2;

    for (let i = 0; i < this.totalSteps; i++) {
      const indicator = this.scene.add.circle(
        startX + (i * 15),
        25,
        4,
        0x666666
      );
      indicator.setStrokeStyle(1, 0x999999);
      this.stepIndicators.push(indicator);
      this.container.add(indicator);
    }
  }

  private clearStepIndicators() {
    this.stepIndicators.forEach(indicator => {
      this.container.remove(indicator);
      indicator.destroy();
    });
    this.stepIndicators = [];
  }

  private updateDisplay() {
    // Update text
    this.progressText.setText(`${this.currentProgress}/${this.totalSteps}`);

    // Update progress bar
    const progressRatio = this.totalSteps > 0 ? this.currentProgress / this.totalSteps : 0;
    const barWidth = 160 * progressRatio;
    this.progressBar.width = barWidth;
    this.progressBar.x = -80 + barWidth / 2; // Align to left of background

    // Update step indicators
    this.stepIndicators.forEach((indicator, index) => {
      if (index < this.currentProgress) {
        indicator.fillColor = COLORS.primary;
        indicator.setStrokeStyle(1, COLORS.primary);
      } else if (index === this.currentProgress && this.currentProgress < this.totalSteps) {
        indicator.fillColor = 0xFFFF00; // Yellow for current step
        indicator.setStrokeStyle(2, 0xFFFF00);
      } else {
        indicator.fillColor = 0x666666;
        indicator.setStrokeStyle(1, 0x999999);
      }
    });
  }

  private animateProgressUpdate() {
    // Pulse animation for progress update
    this.scene.tweens.add({
      targets: this.progressText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      ease: 'Power2',
      yoyo: true
    });

    // Animate the progress bar with bounce effect
    const targetWidth = 160 * (this.currentProgress / this.totalSteps);
    this.scene.tweens.add({
      targets: this.progressBar,
      width: targetWidth,
      x: -80 + targetWidth / 2,
      duration: 400,
      ease: 'Back.easeOut'
    });

    // Animate the current step indicator
    if (this.currentProgress > 0 && this.stepIndicators[this.currentProgress - 1]) {
      const currentStepIndicator = this.stepIndicators[this.currentProgress - 1];

      // Scale animation for completed step
      this.scene.tweens.add({
        targets: currentStepIndicator,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 200,
        ease: 'Back.easeOut',
        yoyo: true
      });

      // Create sparkle effect for completed step
      this.createSparkleEffect(currentStepIndicator.x, currentStepIndicator.y);
    }

    // Animate next step indicator (highlight current)
    if (this.currentProgress < this.totalSteps && this.stepIndicators[this.currentProgress]) {
      const nextStepIndicator = this.stepIndicators[this.currentProgress];

      // Gentle pulse for next step
      this.scene.tweens.add({
        targets: nextStepIndicator,
        alpha: 0.7,
        duration: 500,
        ease: 'Power2',
        yoyo: true,
        repeat: -1
      });
    }
  }

  private animateCompletion() {
    // Success pulse animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        // Flash green with glow effect
        this.scene.tweens.add({
          targets: this.progressBar,
          tint: 0x00FF00,
          duration: 400,
          ease: 'Power2',
          yoyo: true
        });

        // Create celebration sparkles
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 40;
          const sparkleX = Math.cos(angle) * radius;
          const sparkleY = Math.sin(angle) * radius;
          this.createSparkleEffect(sparkleX, sparkleY, true);
        }
      }
    });

    // Animate all step indicators with a cascade effect
    this.stepIndicators.forEach((indicator, index) => {
      this.scene.tweens.add({
        targets: indicator,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 200,
        ease: 'Back.easeOut',
        delay: index * 50,
        yoyo: true
      });
    });
  }

  /**
   * Create sparkle effect at specified position
   */
  private createSparkleEffect(x: number, y: number, isCelebration: boolean = false) {
    const sparkle = this.scene.add.circle(x, y, 3, 0xFFD700);
    sparkle.setAlpha(0);
    this.container.add(sparkle);

    // Random sparkle animation
    const targetX = x + (Math.random() - 0.5) * (isCelebration ? 80 : 40);
    const targetY = y + (Math.random() - 0.5) * (isCelebration ? 80 : 40);

    this.scene.tweens.add({
      targets: sparkle,
      x: targetX,
      y: targetY,
      alpha: { from: 0, to: 1 },
      scale: { from: 0.5, to: 1.2 },
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.scene.tweens.add({
          targets: sparkle,
          alpha: 0,
          scale: 0.5,
          duration: 200,
          ease: 'Power2',
          onComplete: () => {
            this.container.remove(sparkle);
            sparkle.destroy();
          }
        });
      }
    });
  }

  /**
   * Update position based on screen size
   */
  updatePosition() {
    const { width, height } = this.scene.cameras.main;

    // Responsive positioning based on screen size
    let yPosition: number;
    let containerWidth: number;
    let fontSize: string;

    if (width < 768) {
      // Mobile portrait
      yPosition = height * 0.15; // 15% from top
      containerWidth = Math.min(width * 0.9, 300);
      fontSize = '16px';
    } else if (width < 1024) {
      // Tablet or mobile landscape
      yPosition = height * 0.18;
      containerWidth = Math.min(width * 0.7, 400);
      fontSize = '18px';
    } else {
      // Desktop
      yPosition = 140; // Fixed position for desktop
      containerWidth = 200;
      fontSize = '20px';
    }

    this.container.setPosition(width / 2, yPosition);

    // Update text size for better readability
    if (this.progressText) {
      this.progressText.setFontSize(fontSize);
    }

    // Scale progress bar width based on screen size
    if (this.progressBar && this.progressBarBackground) {
      const barWidth = Math.min(containerWidth * 0.8, 160);
      this.progressBarBackground.width = barWidth;

      // Update progress bar position and size
      const currentProgress = this.currentProgress / this.totalSteps;
      const currentBarWidth = barWidth * currentProgress;
      this.progressBar.width = currentBarWidth;
      this.progressBar.x = -barWidth / 2 + currentBarWidth / 2;
    }

    // Reposition step indicators
    if (this.stepIndicators.length > 0) {
      const indicatorSpacing = Math.min(15, (containerWidth * 0.6) / this.stepIndicators.length);
      const startX = -(this.stepIndicators.length - 1) * indicatorSpacing / 2;

      this.stepIndicators.forEach((indicator, index) => {
        indicator.x = startX + (index * indicatorSpacing);
      });
    }
  }

  /**
   * Resize handler for responsive design
   */
  resize(width: number, height: number) {
    this.updatePosition();
  }

  /**
   * Get visibility state
   */
  getVisibility(): boolean {
    return this.isVisible;
  }

  /**
   * Get current progress data
   */
  getProgressData(): { current: number; total: number } {
    return {
      current: this.currentProgress,
      total: this.totalSteps
    };
  }
}