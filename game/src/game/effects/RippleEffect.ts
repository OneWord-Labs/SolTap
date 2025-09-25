import Phaser from 'phaser';
import { COLORS } from '../constants';
import { RippleRingPool } from '../managers/ObjectPool';

export class RippleEffect {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;
  private activeRings: Phaser.GameObjects.Arc[] = [];
  private static ringPool: RippleRingPool;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    // Initialize global ring pool if not exists
    if (!RippleEffect.ringPool) {
      RippleEffect.ringPool = new RippleRingPool(scene, 15);
    }
  }

  play(duration: number = 200): Promise<void> {
    return new Promise((resolve) => {
      const ringCount = 3;
      const delay = duration / ringCount;
      const maxScale = 3 + (duration / 200);

      for (let i = 0; i < ringCount; i++) {
        // Get ring from pool instead of creating new one
        const ring = RippleEffect.ringPool.acquire();
        ring.setPosition(this.x, this.y);
        ring.setDepth(1);
        this.activeRings.push(ring);

        // Set initial state
        ring.setScale(1);
        ring.setAlpha(0.4);
        ring.setStrokeStyle(2, i === 0 ? COLORS.primary : COLORS.secondary);
        ring.setFillStyle(i === 0 ? COLORS.primary : COLORS.secondary, 0.1);

        // Animation
        this.scene.tweens.add({
          targets: ring,
          scale: maxScale,
          alpha: 0,
          duration: duration,
          delay: i * delay,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            // Return ring to pool instead of destroying
            RippleEffect.ringPool.release(ring);
            const index = this.activeRings.indexOf(ring);
            if (index > -1) {
              this.activeRings.splice(index, 1);
            }

            if (i === ringCount - 1) {
              resolve();
            }
          }
        });
      }
    });
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  destroy(): void {
    // Return all active rings to pool
    this.activeRings.forEach(ring => {
      this.scene.tweens.killTweensOf(ring);
      RippleEffect.ringPool.release(ring);
    });
    this.activeRings = [];
  }

  // Static method to get pool statistics for debugging
  static getPoolStats() {
    return RippleEffect.ringPool?.getStats() || { available: 0, maxSize: 0, initialSize: 0 };
  }
}
