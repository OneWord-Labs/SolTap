import Phaser from 'phaser';
import { COLORS } from '../constants';

export class CountdownManager {
  private scene: Phaser.Scene;
  private countdownText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createCountdownText();
  }

  private createCountdownText() {
    const { width, height } = this.scene.cameras.main;
    this.countdownText = this.scene.add.text(width / 2, height / 2, '', {
      fontSize: '64px',
      color: '#14F195',
      fontFamily: 'Arial'
    });
    this.countdownText.setOrigin(0.5);
    this.countdownText.setDepth(1000);
    this.countdownText.setVisible(false);
  }

  startCountdown(duration: number = 3): Promise<void> {
    return new Promise((resolve) => {
      let timeLeft = duration;
      this.countdownText.setVisible(true);
      
      const updateCountdown = () => {
        this.countdownText.setText(timeLeft.toString());
        
        if (timeLeft <= 0) {
          this.countdownText.setVisible(false);
          resolve();
          return;
        }
        
        this.scene.tweens.add({
          targets: this.countdownText,
          scale: { from: 1.5, to: 1 },
          alpha: { from: 1, to: 0 },
          duration: 900,
          ease: 'Cubic.out',
          onComplete: () => {
            timeLeft--;
            this.countdownText.setScale(1);
            this.countdownText.setAlpha(1);
            updateCountdown();
          }
        });
      };
      
      updateCountdown();
    });
  }

  resize(width: number, height: number) {
    if (this.countdownText) {
      this.countdownText.setPosition(width / 2, height / 2);
    }
  }

  destroy() {
    if (this.countdownText) {
      this.countdownText.destroy();
    }
  }
}
