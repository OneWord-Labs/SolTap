import { Pattern, DifficultyMode } from '../types';
import { Circle } from '../components/Circle';
import { AudioManager } from './audioManager';
import { GAME_CONFIG } from '../constants';
import { Logger } from '../../utils/Logger';

export class PatternManager {
    private scene: Phaser.Scene;
    private circles: Circle[];
    private audioManager: AudioManager;
    private difficulty: DifficultyMode;
    private logger: Logger;

    constructor(scene: Phaser.Scene, circles: Circle[], audioManager: AudioManager, difficulty: DifficultyMode) {
        this.scene = scene;
        this.circles = circles;
        this.audioManager = audioManager;
        this.difficulty = difficulty;
        this.logger = new Logger('PatternManager');
    }

    async showPattern(patterns: Pattern[]): Promise<void> {
        this.logger.info('Showing pattern:', patterns);
        
        for (const pattern of patterns) {
            await this.delay(GAME_CONFIG.patternShowDelay);
            await this.showSinglePattern(pattern);
        }
    }

    private async showSinglePattern(pattern: Pattern): Promise<void> {
        const circle = this.circles[pattern.index];
        
        switch (pattern.type) {
            case 'tap':
                await this.showTapPattern(circle);
                break;
            case 'hold':
                await this.showHoldPattern(circle, pattern.duration || 500);
                break;
            case 'rapid':
                await this.showRapidPattern(circle, pattern.count || 3);
                break;
        }
    }

    private async showTapPattern(circle: Circle): Promise<void> {
        this.audioManager.playTapSound(this.circles.indexOf(circle));
        await circle.activate(300);
    }

    private async showHoldPattern(circle: Circle, duration: number): Promise<void> {
        this.audioManager.playHoldSound(this.circles.indexOf(circle));
        await circle.activate(duration);
    }

    private async showRapidPattern(circle: Circle, count: number): Promise<void> {
        for (let i = 0; i < count; i++) {
            this.audioManager.playRapidSound(this.circles.indexOf(circle));
            await circle.activate(150);
            await this.delay(100);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => this.scene.time.delayedCall(ms, resolve));
    }
}
