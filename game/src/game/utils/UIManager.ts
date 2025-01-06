import Phaser from 'phaser';
import { COLORS } from '../constants';

export class UIManager {
    private scene: Phaser.Scene;
    private levelText: Phaser.GameObjects.Text;
    private tokenText: Phaser.GameObjects.Text;
    private playerNameText: Phaser.GameObjects.Text;
    private highScoreText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, onTryAgain: () => void, onMenu: () => void) {
        this.scene = scene;
        
        // Create UI elements
        const { width, height } = scene.cameras.main;
        
        this.levelText = scene.add.text(20, 20, 'Level: 1', {
            fontSize: '24px',
            color: '#ffffff'
        });

        this.tokenText = scene.add.text(20, 60, 'Points: 0', {
            fontSize: '24px',
            color: '#ffffff'
        });

        this.playerNameText = scene.add.text(width - 20, 20, '', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(1, 0);

        this.highScoreText = scene.add.text(width - 20, 60, 'High Score: 0', {
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(1, 0);
    }

    setPlayerName(username: string): void {
        this.playerNameText.setText(`Player: ${username}`);
    }

    updateHighScore(score: number): void {
        this.highScoreText.setText(`High Score: ${score}`);
    }

    updateLevel(level: number): void {
        this.levelText.setText(`Level: ${level}`);
    }

    updateTokens(tokens: number): void {
        this.tokenText.setText(`Points: ${tokens}`);
    }

    resize(width: number, height: number): void {
        this.playerNameText.setPosition(width - 20, 20);
        this.highScoreText.setPosition(width - 20, 60);
    }
}
