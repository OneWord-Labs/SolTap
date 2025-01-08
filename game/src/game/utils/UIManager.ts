import Phaser from 'phaser';
import { COLORS, REWARDS } from '../constants';

export class UIManager {
  private scene: Phaser.Scene;
  private levelText!: Phaser.GameObjects.Text;
  private tokenText!: Phaser.GameObjects.Text;
  private userNameText!: Phaser.GameObjects.Text;
  private homeButton!: Phaser.GameObjects.Container;
  private onTryAgain: () => void;
  private onReturnToMenu: () => void;

  constructor(scene: Phaser.Scene, onTryAgain: () => void, onReturnToMenu: () => void) {
    this.scene = scene;
    this.onTryAgain = onTryAgain;
    this.onReturnToMenu = onReturnToMenu;
    this.createUI();
  }

  private createUI() {
    this.createTexts();
    this.createHomeButton();
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

  updateLevel(level: number) {
    this.levelText.setText(`Level: ${level}`);
  }

  updateTokens(tokens: number) {
    this.tokenText.setText(`Tokens: ${tokens}`);
  }

  updateUserName(name: string) {
    this.userNameText.setText(`Player: ${name}`);
  }

  resize(width: number, height: number) {
    this.levelText.setPosition(16, 16);
    this.tokenText.setPosition(16, 56);
    this.userNameText.setPosition(16, 96);
    this.homeButton.setPosition(width - 76, 72);
  }
}
