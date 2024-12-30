import Phaser from 'phaser';
import { COLORS } from '../constants';
import { DifficultyMode } from '../types';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Title
    const title = this.add.text(width / 2, height / 3, 'Sol Tap', {
      fontSize: '48px',
      color: '#14F195',
      fontFamily: 'Arial'
    }).setOrigin(0.5);

    // Create mode selection buttons
    this.createModeButton(width / 2, height / 2, 'Novice Mode', 'novice');
    this.createModeButton(width / 2, height / 2 + 80, 'Expert Mode', 'expert');
  }

  private createModeButton(x: number, y: number, text: string, mode: DifficultyMode) {
    const button = this.add.text(x, y, text, {
      fontSize: '32px',
      color: '#FFFFFF',
      fontFamily: 'Arial',
      backgroundColor: '#14F195',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    button.on('pointerdown', () => this.startGame(mode));
  }

  private startGame(mode: DifficultyMode) {
    this.scene.start('MainScene', { difficulty: mode });
  }
}
