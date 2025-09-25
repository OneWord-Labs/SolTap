import Phaser from 'phaser';
import { COLORS } from '../constants';
import { Logger } from '../../utils/Logger';
import { RippleEffect } from '../effects/RippleEffect';
import { ResponsiveConfig } from '../utils/ResponsiveConfig';
import { DeviceDetector } from '../utils/DeviceDetector';

export class Circle {
    private scene: Phaser.Scene;
    private baseCircle: Phaser.GameObjects.Arc;
    private innerCircle: Phaser.GameObjects.Arc;
    private logger: Logger;
    private isExpertMode: boolean;
    private x: number;
    private y: number;
    private radius: number;
    private isActive = false;
    private hitAreaMargin: number = 0.20;
    private rippleEffect: RippleEffect;
    private responsiveConfig: ResponsiveConfig;
    private deviceDetector: DeviceDetector;

    constructor(scene: Phaser.Scene, x: number, y: number, isExpertMode: boolean) {
        this.scene = scene;
        this.isExpertMode = isExpertMode;
        this.logger = new Logger('Circle');
        this.responsiveConfig = ResponsiveConfig.getInstance();
        this.deviceDetector = DeviceDetector.getInstance();

        this.x = x;
        this.y = y;

        // Use responsive configuration for circle radius
        const config = this.responsiveConfig.getCurrentConfig();
        this.radius = config.circleRadius;
        this.isActive = false;

        // Create circles in inactive state with responsive sizing
        this.baseCircle = scene.add.circle(x, y, this.radius);
        this.baseCircle.setDepth(2);
        this.innerCircle = scene.add.circle(x, y, this.radius * 0.88); // Inner circle is 88% of outer
        this.innerCircle.setDepth(3);
        this.rippleEffect = new RippleEffect(scene, x, y);

        // Initialize state
        this.setInactiveState();
        this.setVisible(!isExpertMode);

        this.logger.info(`${isExpertMode ? 'Expert' : 'Novice'} mode circle created (radius: ${this.radius}), setting ${isExpertMode ? 'invisible' : 'visible'}`);

        this.setupInputHandlers();
    }

    private setupInputHandlers(): void {
        // Calculate touch-friendly hit area
        const config = this.responsiveConfig.getCurrentConfig();
        const touchTargetSize = Math.max(config.touchTargetSize, this.radius * 2);
        const hitRadius = touchTargetSize / 2;

        this.baseCircle.setInteractive({
            hitArea: new Phaser.Geom.Circle(0, 0, hitRadius),
            hitAreaCallback: Phaser.Geom.Circle.Contains,
            useHandCursor: true
        });

        this.baseCircle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.baseCircle.visible) {
                this.playTapAnimation();
            }
        });
    }

    setInactiveState(): void {
        this.isActive = false;
        this.baseCircle.setStrokeStyle(3, COLORS.secondary);
        this.baseCircle.setFillStyle(COLORS.secondary, 0.1);
        this.innerCircle.setFillStyle(COLORS.primary, 0.2);
    }

    setActiveState(): void {
        this.isActive = true;
        this.baseCircle.setStrokeStyle(3, COLORS.primary);
        this.baseCircle.setFillStyle(COLORS.primary, 0.3);
        this.innerCircle.setFillStyle(COLORS.secondary, 0.8);
    }

    async activate(duration: number = 500): Promise<void> {
        this.logger.info(`Activating circle at x: ${this.x}, y: ${this.y}`);
        if (this.isExpertMode) {
            this.setVisible(true);
        }
        await new Promise<void>(resolve => {
            this.scene.time.delayedCall(100, () => {
                this.setActiveState();
                this.scene.time.delayedCall(duration, () => {
                    if (this.isExpertMode) {
                        this.setVisible(false);
                    } else {
                        this.setInactiveState();
                    }
                    resolve();
                });
            });
        });
    }

    async playTapAnimation(duration: number = 200): Promise<void> {
        this.logger.info('Playing tap animation');
        if (this.isExpertMode) {
            this.setVisible(true);
        }
        this.setActiveState();
        
        // Play ripple effect
        await this.rippleEffect.play(duration);
        
        // Reset state after animation
        if (!this.isExpertMode) {
            this.setInactiveState();
        } else {
            this.setVisible(false);
        }
    }

    setExpertModeVisibility(visible: boolean): void {
        if (this.isExpertMode) {
            this.logger.info(`Setting expert mode circle visibility to ${visible}`);
            this.setVisible(visible);
            if (visible) {
                this.setActiveState();
            } else {
                this.setInactiveState();
            }
        }
    }

    setVisible(visible: boolean): void {
        this.logger.info(`Setting circle visibility to ${visible}`);
        this.baseCircle.setVisible(visible);
        this.innerCircle.setVisible(visible);
    }

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.baseCircle.setPosition(x, y);
        this.innerCircle.setPosition(x, y);
        this.rippleEffect.setPosition(x, y);
    }

    isPointInside(x: number, y: number): boolean {
        const distance = Math.sqrt(Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2));
        return distance <= this.radius * (1 + this.hitAreaMargin);
    }

    destroy(): void {
        this.baseCircle.destroy();
        this.innerCircle.destroy();
        this.rippleEffect.destroy();
    }
}
