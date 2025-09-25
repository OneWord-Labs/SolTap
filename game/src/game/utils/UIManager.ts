import Phaser from 'phaser';
import { COLORS, REWARDS } from '../constants';
import { ProgressIndicator } from '../components/ProgressIndicator';

export class UIManager {
  private scene: Phaser.Scene;
  private levelText!: Phaser.GameObjects.Text;
  private tokenText!: Phaser.GameObjects.Text;
  private userNameText!: Phaser.GameObjects.Text;
  private homeButton!: Phaser.GameObjects.Container;
  private pauseButton!: Phaser.GameObjects.Container;
  private comboContainer!: Phaser.GameObjects.Container;
  private comboText!: Phaser.GameObjects.Text;
  private comboGlow!: Phaser.GameObjects.Graphics;
  private bestComboText!: Phaser.GameObjects.Text;
  private progressIndicator!: ProgressIndicator;
  private onTryAgain: () => void;
  private onReturnToMenu: () => void;
  private onPause?: () => void;

  constructor(scene: Phaser.Scene, onTryAgain: () => void, onReturnToMenu: () => void, onPause?: () => void) {
    this.scene = scene;
    this.onTryAgain = onTryAgain;
    this.onReturnToMenu = onReturnToMenu;
    this.onPause = onPause;
    this.createUI();
  }

  private createUI() {
    this.createTexts();
    this.createComboDisplay();
    this.createProgressIndicator();
    this.createHomeButton();
    if (this.onPause) {
      this.createPauseButton();
    }
  }

  private createTexts() {
    this.levelText = this.scene.add.text(16, 16, '', {
      fontSize: '24px',
      color: '#14F195'
    });
    
    this.tokenText = this.scene.add.text(16, 56, '', {
      fontSize: '24px',
      color: '#9945FF'
    });

    this.userNameText = this.scene.add.text(16, 96, '', {
      fontSize: '24px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    });
  }

  private createHomeButton() {
    const buttonWidth = 120;
    const buttonHeight = 40;
    const { width } = this.scene.cameras.main;

    const background = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, COLORS.secondary);
    const text = this.scene.add.text(0, 0, 'Home', {
      fontSize: '16px',
      color: '#000000'
    }).setOrigin(0.5);

    this.homeButton = this.scene.add.container(width - buttonWidth/2 - 16, 72, [background, text]);

    // Make the container interactive
    this.homeButton.setSize(buttonWidth, buttonHeight);
    this.homeButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => background.setAlpha(0.8))
      .on('pointerout', () => background.setAlpha(1))
      .on('pointerdown', () => {
        console.log('Home button clicked');
        this.onReturnToMenu();
      });
  }

  private createPauseButton() {
    const buttonWidth = 100;
    const buttonHeight = 40;
    const { width } = this.scene.cameras.main;

    const background = this.scene.add.rectangle(0, 0, buttonWidth, buttonHeight, COLORS.primary);
    const text = this.scene.add.text(0, 0, 'Pause', {
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.pauseButton = this.scene.add.container(width - buttonWidth/2 - 16, 24, [background, text]);

    // Make the container interactive
    this.pauseButton.setSize(buttonWidth, buttonHeight);
    this.pauseButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => background.setAlpha(0.8))
      .on('pointerout', () => background.setAlpha(1))
      .on('pointerdown', () => {
        console.log('Pause button clicked');
        this.onPause?.();
      });
  }

  private createProgressIndicator() {
    this.progressIndicator = new ProgressIndicator(this.scene);
  }

  updateLevel(level: number) {
    this.levelText.setText(`Level: ${level}`);
  }

  updateTokens(tokens: number) {
    this.tokenText.setText(`Tokens: ${tokens}`);
  }

  updateUserName(name: string) {
    this.userNameText.setText(`Player: ${name}`);
  }

  private createComboDisplay() {
    const { width, height } = this.scene.cameras.main;

    // Create glow effect background
    this.comboGlow = this.scene.add.graphics();

    // Main combo text (large, center screen)
    this.comboText = this.scene.add.text(width / 2, height / 2 - 100, '', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setVisible(false);

    // Best combo text (top right corner)
    this.bestComboText = this.scene.add.text(width - 16, 16, '', {
      fontSize: '18px',
      color: '#FFD700',
      fontStyle: 'bold'
    }).setOrigin(1, 0).setVisible(false);

    // Container for easier management
    this.comboContainer = this.scene.add.container(0, 0, [
      this.comboGlow,
      this.comboText,
      this.bestComboText
    ]);
  }

  updateCombo(currentCombo: number, multiplier: number, bestCombo: number) {
    if (currentCombo <= 0) {
      this.comboText.setVisible(false);
      this.comboGlow.setVisible(false);
      return;
    }

    // Update main combo display
    const comboDisplayText = currentCombo >= 3 ?
      `${currentCombo}x COMBO!\n${multiplier.toFixed(1)}x SCORE` :
      '';

    if (comboDisplayText) {
      this.comboText.setText(comboDisplayText);
      this.comboText.setVisible(true);

      // Update glow based on combo tier
      this.updateComboGlow(currentCombo);
    } else {
      this.comboText.setVisible(false);
      this.comboGlow.setVisible(false);
    }

    // Update best combo if we have one
    if (bestCombo > 0) {
      this.bestComboText.setText(`Best: ${bestCombo}x`);
      this.bestComboText.setVisible(true);
    }
  }

  private updateComboGlow(combo: number) {
    this.comboGlow.clear();
    this.comboGlow.setVisible(true);

    // Different glow colors based on combo tier
    let glowColor = 0xFFD700; // Gold
    let glowRadius = 60;

    if (combo >= 20) {
      glowColor = 0xFF0080; // Pink/Purple for high combos
      glowRadius = 100;
    } else if (combo >= 10) {
      glowColor = 0x00FFFF; // Cyan for medium combos
      glowRadius = 80;
    }

    // Create glow effect
    const { width, height } = this.scene.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2 - 100;

    // Outer glow
    this.comboGlow.fillGradientStyle(
      glowColor, glowColor, glowColor, glowColor,
      0.1, 0.1, 0.1, 0.1
    );
    this.comboGlow.fillCircle(centerX, centerY, glowRadius);

    // Inner glow
    this.comboGlow.fillGradientStyle(
      glowColor, glowColor, glowColor, glowColor,
      0.3, 0.3, 0.3, 0.3
    );
    this.comboGlow.fillCircle(centerX, centerY, glowRadius * 0.6);
  }

  showComboBreak(brokenCombo: number) {
    if (brokenCombo < 3) return; // Only show for significant combos

    const { width, height } = this.scene.cameras.main;

    // Create break text
    const breakText = this.scene.add.text(width / 2, height / 2 + 50,
      `COMBO BROKEN!\n${brokenCombo}x streak ended`, {
      fontSize: '32px',
      color: '#FF4444',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5);

    // Animate break text
    this.scene.tweens.add({
      targets: breakText,
      alpha: { from: 1, to: 0 },
      y: { from: height / 2 + 50, to: height / 2 },
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        breakText.destroy();
      }
    });
  }

  showComboMilestone(milestone: number) {
    const { width, height } = this.scene.cameras.main;

    // Create milestone text
    const milestoneText = this.scene.add.text(width / 2, height / 2 + 100,
      `🎉 ${milestone} COMBO MILESTONE! 🎉`, {
      fontSize: '36px',
      color: '#00FF00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Animate milestone text
    milestoneText.setScale(0);
    this.scene.tweens.add({
      targets: milestoneText,
      scale: { from: 0, to: 1.2 },
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        this.scene.tweens.add({
          targets: milestoneText,
          alpha: { from: 1, to: 0 },
          duration: 1500,
          delay: 1000,
          onComplete: () => {
            milestoneText.destroy();
          }
        });
      }
    });
  }

  // Progress Indicator Methods
  startProgress(totalSteps: number) {
    this.progressIndicator.startProgress(totalSteps);
  }

  updateProgress(current: number) {
    this.progressIndicator.updateProgress(current);
  }

  completeProgress() {
    this.progressIndicator.completeProgress();
  }

  resetProgress() {
    this.progressIndicator.reset();
  }

  showProgressError() {
    this.progressIndicator.showError();
  }

  getProgressData(): { current: number; total: number } {
    return this.progressIndicator.getProgressData();
  }

  resize(width: number, height: number) {
    this.levelText.setPosition(16, 16);
    this.tokenText.setPosition(16, 56);
    this.userNameText.setPosition(16, 96);
    this.homeButton.setPosition(width - 76, 72);
    if (this.pauseButton) {
      this.pauseButton.setPosition(width - 66, 24);
    }

    // Update combo display positions
    if (this.comboText) {
      this.comboText.setPosition(width / 2, height / 2 - 100);
    }
    if (this.bestComboText) {
      this.bestComboText.setPosition(width - 16, 16);
    }

    // Update progress indicator position
    if (this.progressIndicator) {
      this.progressIndicator.resize(width, height);
    }
  }
}
