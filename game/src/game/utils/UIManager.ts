import { Scene } from 'phaser';
import { COLORS } from '../constants';

export class UIManager {
  private scene: Scene;
  private levelText!: Phaser.GameObjects.Text;
  private tokenText!: Phaser.GameObjects.Text;
  private homeButton!: Phaser.GameObjects.Text;
  private onTryAgain?: () => void;

  constructor(scene: Scene) {
    this.scene = scene;
    this.init();
  }

  private init() {
    this.levelText = this.scene.add.text(0, 0, '', {
      fontSize: '32px',
      color: '#ffffff'
    });
    this.tokenText = this.scene.add.text(0, 0, '', {
      fontSize: '32px',
      color: '#ffffff'
    });
    this.homeButton = this.scene.add.text(0, 0, 'Home', {
      fontSize: '32px',
      color: '#ffffff'
    });
  }

  public updateLevel(level: number) {
    this.levelText.setText(`Level: ${level}`);
  }

  public updateTokens(tokens: number) {
    this.tokenText.setText(`Tokens: ${tokens}`);
  }

  public showGameOver(score: number) {
    const { width } = this.scene.cameras.main;
    const centerX = width / 2;

    const gameOverText = this.scene.add.text(centerX, 200, 'Game Over', {
      fontSize: '64px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const scoreText = this.scene.add.text(centerX, 300, `Score: ${score}`, {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    const tryAgainButton = this.scene.add.text(centerX, 400, 'Try Again', {
      fontSize: '32px',
      color: '#ffffff'
    })
    .setOrigin(0.5)
    .setInteractive()
    .on('pointerdown', () => {
      if (this.onTryAgain) {
        this.onTryAgain();
      }
    });
  }

  public setTryAgainCallback(callback: () => void) {
    this.onTryAgain = callback;
  }
}
