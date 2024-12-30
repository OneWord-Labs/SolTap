import Phaser from 'phaser';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Add welcome text
    const text = this.add.text(width / 2, height / 2, 'Welcome to Sol Tap!', {
      font: '32px monospace',
      color: '#ffffff'
    });
    text.setOrigin(0.5, 0.5);
  }

  update() {
    // Game loop updates here
  }
} 