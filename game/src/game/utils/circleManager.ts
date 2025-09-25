import Phaser from 'phaser';
import { Circle } from '../components/Circle';
import { GAME_CONFIG } from '../constants';
import { ResponsiveConfig } from './ResponsiveConfig';
import { DeviceDetector } from './DeviceDetector';

export class CircleManager {
    private scene: Phaser.Scene;
    private circles: Circle[] = [];
    private isExpertMode: boolean;
    private responsiveConfig: ResponsiveConfig;
    private deviceDetector: DeviceDetector;

    constructor(scene: Phaser.Scene, isExpertMode: boolean) {
        this.scene = scene;
        this.isExpertMode = isExpertMode;
        this.responsiveConfig = ResponsiveConfig.getInstance();
        this.deviceDetector = DeviceDetector.getInstance();
    }

    createCircles(width: number, height: number): Circle[] {
        const positions = this.generatePositions(width, height);
        
        this.circles = positions.map(pos => 
            new Circle(this.scene, pos.x, pos.y, this.isExpertMode)
        );
        
        return this.circles;
    }

    private generatePositions(width: number, height: number): Array<{x: number, y: number}> {
        const positions: Array<{x: number, y: number}> = [];
        const config = this.responsiveConfig.getCurrentConfig();
        const deviceInfo = this.deviceDetector.getDeviceInfo();

        // Get responsive spacing and padding values
        const circlePadding = config.circlePadding;
        const minCircleSpacing = config.minCircleSpacing;

        // Calculate safe area for circles (excluding UI margins)
        const topMargin = this.responsiveConfig.calculateSpacing('height', 'top');
        const bottomMargin = this.responsiveConfig.calculateSpacing('height', 'bottom');
        const sideMargin = this.responsiveConfig.calculateSpacing('width', 'side');

        // Define play area bounds
        const playAreaBounds = {
            x: sideMargin + circlePadding,
            y: topMargin + circlePadding,
            width: width - (sideMargin * 2) - (circlePadding * 2),
            height: height - (topMargin + bottomMargin) - (circlePadding * 2)
        };

        // For mobile landscape, prefer horizontal arrangement
        if (deviceInfo.isMobile && deviceInfo.isLandscape) {
            return this.generateLandscapePositions(playAreaBounds, minCircleSpacing);
        }

        // Default positioning for portrait and desktop
        for (let i = 0; i < GAME_CONFIG.circleCount; i++) {
            let validPosition = false;
            let pos: {x: number, y: number};
            let attempts = 0;
            const maxAttempts = 100;

            do {
                pos = {
                    x: Phaser.Math.Between(playAreaBounds.x, playAreaBounds.x + playAreaBounds.width),
                    y: Phaser.Math.Between(playAreaBounds.y, playAreaBounds.y + playAreaBounds.height)
                };

                validPosition = positions.every(existing =>
                    Phaser.Math.Distance.Between(existing.x, existing.y, pos.x, pos.y) > minCircleSpacing
                );

                attempts++;
            } while (!validPosition && attempts < maxAttempts);

            // If we can't find a valid position, use a fallback grid
            if (!validPosition) {
                pos = this.getFallbackPosition(i, playAreaBounds);
            }

            positions.push(pos);
        }

        return positions;
    }

    private generateLandscapePositions(bounds: any, minSpacing: number): Array<{x: number, y: number}> {
        const positions: Array<{x: number, y: number}> = [];
        const centerY = bounds.y + bounds.height / 2;

        // Try to arrange circles horizontally
        const spacing = Math.max(minSpacing, bounds.width / (GAME_CONFIG.circleCount + 1));

        for (let i = 0; i < GAME_CONFIG.circleCount; i++) {
            const x = bounds.x + spacing * (i + 1);
            const y = centerY + Phaser.Math.Between(-bounds.height / 4, bounds.height / 4);

            positions.push({ x, y });
        }

        return positions;
    }

    private getFallbackPosition(index: number, bounds: any): {x: number, y: number} {
        // Create a 2x2 grid as fallback
        const rows = 2;
        const cols = 2;
        const row = Math.floor(index / cols);
        const col = index % cols;

        return {
            x: bounds.x + (bounds.width / cols) * (col + 0.5),
            y: bounds.y + (bounds.height / rows) * (row + 0.5)
        };
    }

    resize(width: number, height: number): void {
        const positions = this.generatePositions(width, height);
        this.circles.forEach((circle, index) => {
            circle.setPosition(positions[index].x, positions[index].y);
        });
    }

    destroy(): void {
        this.circles.forEach(circle => circle.destroy());
        this.circles = [];
    }
}
