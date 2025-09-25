import Phaser from 'phaser';

/**
 * Memory optimization utilities for reducing garbage collection impact
 */
export class MemoryOptimizer {
  private static instance: MemoryOptimizer;
  private gcStats = {
    lastGC: 0,
    gcCount: 0,
    memoryUsage: 0
  };

  static getInstance(): MemoryOptimizer {
    if (!MemoryOptimizer.instance) {
      MemoryOptimizer.instance = new MemoryOptimizer();
    }
    return MemoryOptimizer.instance;
  }

  /**
   * Optimize Phaser scene for memory efficiency
   */
  optimizeScene(scene: Phaser.Scene): void {
    // Disable unused systems
    scene.anims.pauseAll();

    // Optimize texture settings
    if (scene.textures.get('__MISSING')) {
      scene.textures.get('__MISSING').setFilter(Phaser.Textures.FilterMode.NEAREST);
    }

    // Enable texture compression where available
    this.enableTextureCompression(scene);

    // Optimize physics if used
    if (scene.physics && scene.physics.world) {
      scene.physics.world.setBounds(0, 0, scene.cameras.main.width, scene.cameras.main.height);
    }

    console.log('🛠️ Scene memory optimizations applied');
  }

  /**
   * Enable texture compression for better memory usage
   */
  private enableTextureCompression(scene: Phaser.Scene): void {
    const gl = scene.renderer.gl;
    if (!gl) return;

    // Check for compression support
    const ext = gl.getExtension('WEBGL_compressed_texture_s3tc') ||
                gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc') ||
                gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc');

    if (ext) {
      console.log('✅ Texture compression available');
    }
  }

  /**
   * Optimize game object pools for memory efficiency
   */
  optimizeObjectPools(): {
    recommended: {
      rippleRings: number;
      particles: number;
      tweens: number;
    }
  } {
    const memInfo = this.getMemoryInfo();
    const deviceTier = this.getDeviceTier();

    let multiplier = 1;
    switch (deviceTier) {
      case 'low':
        multiplier = 0.5;
        break;
      case 'medium':
        multiplier = 0.75;
        break;
      case 'high':
        multiplier = 1.0;
        break;
    }

    // Conservative memory usage
    if (memInfo.usedMB > 100) {
      multiplier *= 0.7;
    }

    return {
      recommended: {
        rippleRings: Math.max(5, Math.floor(15 * multiplier)),
        particles: Math.max(10, Math.floor(50 * multiplier)),
        tweens: Math.max(5, Math.floor(20 * multiplier))
      }
    };
  }

  /**
   * Monitor garbage collection patterns
   */
  monitorGarbageCollection(): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const currentUsage = memInfo.usedJSHeapSize;

      // Detect potential GC by memory drop
      if (this.gcStats.memoryUsage > 0 && currentUsage < this.gcStats.memoryUsage * 0.9) {
        this.gcStats.gcCount++;
        this.gcStats.lastGC = Date.now();
        console.log(`🗑️ Potential GC detected (${this.gcStats.gcCount})`);
      }

      this.gcStats.memoryUsage = currentUsage;
    }
  }

  /**
   * Get current memory information
   */
  getMemoryInfo(): {
    usedMB: number;
    totalMB: number;
    limitMB: number;
    available: boolean;
  } {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return {
        usedMB: Math.round(memInfo.usedJSHeapSize / (1024 * 1024)),
        totalMB: Math.round(memInfo.totalJSHeapSize / (1024 * 1024)),
        limitMB: Math.round(memInfo.jsHeapSizeLimit / (1024 * 1024)),
        available: true
      };
    }

    return {
      usedMB: 0,
      totalMB: 0,
      limitMB: 0,
      available: false
    };
  }

  /**
   * Determine device performance tier
   */
  private getDeviceTier(): 'low' | 'medium' | 'high' {
    const cores = navigator.hardwareConcurrency || 1;
    const memory = (navigator as any).deviceMemory || 0;

    if (cores >= 4 && memory >= 4) {
      return 'high';
    } else if (cores >= 2 && memory >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Suggest memory optimizations based on current usage
   */
  getOptimizationSuggestions(): {
    priority: 'high' | 'medium' | 'low';
    suggestions: string[];
  } {
    const memInfo = this.getMemoryInfo();
    const suggestions: string[] = [];
    let priority: 'high' | 'medium' | 'low' = 'low';

    if (memInfo.usedMB > 150) {
      priority = 'high';
      suggestions.push('Reduce object pool sizes');
      suggestions.push('Clear unused textures');
      suggestions.push('Disable non-essential animations');
    } else if (memInfo.usedMB > 100) {
      priority = 'medium';
      suggestions.push('Monitor object pool usage');
      suggestions.push('Consider texture compression');
    }

    if (this.gcStats.gcCount > 10) {
      priority = 'high';
      suggestions.push('Reduce object allocations in hot paths');
      suggestions.push('Implement more aggressive object pooling');
    }

    return { priority, suggestions };
  }

  /**
   * Force garbage collection if available (development only)
   */
  forceGC(): boolean {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
      console.log('🗑️ Manual garbage collection triggered');
      return true;
    }
    return false;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.gcStats = {
      lastGC: 0,
      gcCount: 0,
      memoryUsage: 0
    };
  }
}

/**
 * Utility functions for memory-efficient operations
 */
export class MemoryUtils {
  /**
   * Reuse object instead of creating new ones
   */
  static reuseObject<T extends Record<string, any>>(
    target: T,
    source: Partial<T>
  ): T {
    Object.keys(source).forEach(key => {
      if (source[key] !== undefined) {
        target[key] = source[key];
      }
    });
    return target;
  }

  /**
   * Create a recycling function for simple objects
   */
  static createRecycler<T extends Record<string, any>>(
    factory: () => T
  ): {
    acquire: () => T;
    release: (obj: T) => void;
    getStats: () => { available: number; total: number };
  } {
    const pool: T[] = [];
    let totalCreated = 0;

    return {
      acquire: () => {
        if (pool.length > 0) {
          return pool.pop()!;
        }
        totalCreated++;
        return factory();
      },
      release: (obj: T) => {
        // Clear object properties
        Object.keys(obj).forEach(key => {
          obj[key] = undefined;
        });
        pool.push(obj);
      },
      getStats: () => ({
        available: pool.length,
        total: totalCreated
      })
    };
  }

  /**
   * Debounce function to reduce excessive allocations
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T {
    let timeoutId: number | undefined;
    return ((...args: any[]) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func(...args), delay);
    }) as T;
  }

  /**
   * Throttle function to limit execution frequency
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T {
    let lastExecution = 0;
    return ((...args: any[]) => {
      const now = Date.now();
      if (now - lastExecution >= delay) {
        lastExecution = now;
        return func(...args);
      }
    }) as T;
  }
}