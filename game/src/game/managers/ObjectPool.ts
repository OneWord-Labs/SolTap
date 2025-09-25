/**
 * Generic Object Pool for efficient memory management
 * Reduces garbage collection by reusing objects
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (item: T) => void;
  private maxSize: number;
  private initialSize: number;

  constructor(
    createFn: () => T,
    resetFn: (item: T) => void,
    initialSize: number = 10,
    maxSize: number = 50
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    this.initialSize = initialSize;

    // Initialize pool with pre-created objects
    this.warmUp();
  }

  /**
   * Pre-create objects to avoid allocation during gameplay
   */
  private warmUp(): void {
    for (let i = 0; i < this.initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  /**
   * Get an object from the pool
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }

    // Create new object if pool is empty but haven't reached max size
    return this.createFn();
  }

  /**
   * Return an object to the pool for reuse
   */
  release(item: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(item);
      this.pool.push(item);
    }
    // If pool is full, object will be garbage collected
  }

  /**
   * Get current pool statistics
   */
  getStats(): { available: number; maxSize: number; initialSize: number } {
    return {
      available: this.pool.length,
      maxSize: this.maxSize,
      initialSize: this.initialSize
    };
  }

  /**
   * Clear the pool and reset
   */
  clear(): void {
    this.pool = [];
    this.warmUp();
  }

  /**
   * Destroy all objects in pool
   */
  destroy(): void {
    this.pool = [];
  }
}

/**
 * Specialized pool for Phaser GameObjects
 */
export class GameObjectPool<T extends Phaser.GameObjects.GameObject> extends ObjectPool<T> {
  constructor(
    createFn: () => T,
    initialSize: number = 10,
    maxSize: number = 50
  ) {
    super(
      createFn,
      (obj: T) => {
        // Reset common GameObject properties
        obj.setVisible(false);
        obj.setActive(false);
        if ('setPosition' in obj) {
          (obj as any).setPosition(0, 0);
        }
        if ('setScale' in obj) {
          (obj as any).setScale(1);
        }
        if ('setAlpha' in obj) {
          (obj as any).setAlpha(1);
        }
      },
      initialSize,
      maxSize
    );
  }

  acquire(): T {
    const obj = super.acquire();
    obj.setVisible(true);
    obj.setActive(true);
    return obj;
  }
}

/**
 * Pool specifically for ripple effect rings
 */
export class RippleRingPool extends GameObjectPool<Phaser.GameObjects.Arc> {
  constructor(scene: Phaser.Scene, initialSize: number = 15) {
    super(
      () => {
        const ring = scene.add.circle(0, 0, 25);
        ring.setDepth(1);
        ring.setVisible(false);
        ring.setActive(false);
        return ring;
      },
      initialSize,
      30 // Max 30 rings (10 effects * 3 rings each)
    );
  }
}
