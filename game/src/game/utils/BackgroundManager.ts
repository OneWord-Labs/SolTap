import Phaser from 'phaser';
import { COLORS } from '../constants';

interface Star {
    sprite: Phaser.GameObjects.Arc;
    speed: number;
}

export class BackgroundManager {
    private scene: Phaser.Scene;
    private background!: Phaser.GameObjects.Rectangle;
    private stars: Star[] = [];
    private readonly starCount = 100;
    private readonly minSpeed = 0.1;
    private readonly maxSpeed = 0.5;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createBackground();
        this.createStarfield();
    }

    private createBackground() {
        const { width, height } = this.scene.cameras.main;
        this.background = this.scene.add.rectangle(0, 0, width, height, COLORS.background);
        this.background.setOrigin(0);
        this.background.setDepth(-2);
    }

    private createStarfield() {
        const { width, height } = this.scene.cameras.main;

        for (let i = 0; i < this.starCount; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const radius = Phaser.Math.FloatBetween(0.5, 2);
            const alpha = Phaser.Math.FloatBetween(0.3, 1);
            
            const star = this.scene.add.circle(x, y, radius, 0xFFFFFF, alpha);
            star.setDepth(-1);
            
            this.stars.push({
                sprite: star,
                speed: Phaser.Math.FloatBetween(this.minSpeed, this.maxSpeed)
            });
        }
    }

    update() {
        const { width, height } = this.scene.cameras.main;
        
        this.stars.forEach(star => {
            star.sprite.y += star.speed;
            
            // Reset star position when it goes off screen
            if (star.sprite.y > height) {
                star.sprite.y = 0;
                star.sprite.x = Phaser.Math.Between(0, width);
            }
        });
    }

    resize(width: number, height: number) {
        this.background.setSize(width, height);
        
        // Redistribute stars when screen is resized
        this.stars.forEach(star => {
            if (star.sprite.x > width) {
                star.sprite.x = Phaser.Math.Between(0, width);
            }
            if (star.sprite.y > height) {
                star.sprite.y = Phaser.Math.Between(0, height);
            }
        });
    }

    destroy() {
        this.stars.forEach(star => star.sprite.destroy());
        this.stars = [];
        this.background.destroy();
    }
}
