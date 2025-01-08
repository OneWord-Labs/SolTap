import Phaser from 'phaser';
import { COLORS } from '../constants';
import { DifficultyMode } from '../types';

export class MenuScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text;
  private buttons: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    this.createMenuElements();
    this.scale.on('resize', this.handleResize, this);
  }

  private createMenuElements() {
    const { width, height } = this.cameras.main;
    
    // Title - positioned at 25% of screen height
    this.title = this.add.text(width / 2, height * 0.25, 'Sol Tap', {
      fontSize: this.calculateFontSize(48),
      color: '#14F195',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Clear existing buttons
    this.buttons.forEach(button => button.destroy());
    this.buttons = [];

    // Create mode selection buttons - centered vertically with proper spacing
    const buttonSpacing = height * 0.1; // 10% of screen height
    const startY = height * 0.5; // Start at 50% of screen height

    // Novice Mode button
    this.buttons.push(
      this.createModeButton(
        width / 2,
        startY,
        'Novice Mode',
        'novice'
      )
    );

    // Expert Mode button
    this.buttons.push(
      this.createModeButton(
        width / 2,
        startY + buttonSpacing,
        'Expert Mode',
        'expert'
      )
    );
  }

  private calculateFontSize(baseSize: number): string {
    const scaleFactor = Math.min(
      this.cameras.main.width / 800,
      this.cameras.main.height / 600
    );
    return `${Math.max(Math.floor(baseSize * scaleFactor), 16)}px`;
  }

  private createModeButton(x: number, y: number, text: string, mode: DifficultyMode) {
    const button = this.add.text(x, y, text, {
      fontSize: this.calculateFontSize(32),
      color: '#FFFFFF',
      fontFamily: 'Arial',
      backgroundColor: '#14F195',
      padding: { x: 20, y: 10 },
      fixedWidth: this.cameras.main.width * 0.4, // 40% of screen width
      align: 'center'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    // Add hover effect
    button.on('pointerover', () => {
      button.setStyle({ color: '#14F195', backgroundColor: '#FFFFFF' });
    });
    
    button.on('pointerout', () => {
      button.setStyle({ color: '#FFFFFF', backgroundColor: '#14F195' });
    });

    button.on('pointerdown', () => this.startGame(mode));
    
    return button;
  }

  private handleResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;
    this.cameras.main.setViewport(0, 0, width, height);
    this.createMenuElements(); // Recreate all elements with new dimensions
  }

  private startGame(mode: DifficultyMode) {
    this.scene.start('MainScene', { difficulty: mode });
  }
}
