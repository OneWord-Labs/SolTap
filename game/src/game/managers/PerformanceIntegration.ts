import Phaser from 'phaser';
import { PerformanceMonitor, DeviceProfiler } from './PerformanceMonitor';
import { PerformanceDashboard } from './PerformanceDashboard';
import { AssetPreloader, GameAssets } from './AssetPreloader';
import { MemoryOptimizer } from './MemoryOptimizer';

/**
 * Complete performance integration for SolTap game
 * Combines all performance optimization systems into a unified interface
 */
export class PerformanceIntegration {
  private monitor: PerformanceMonitor;
  private dashboard: PerformanceDashboard;
  private preloader: AssetPreloader;
  private memoryOptimizer: MemoryOptimizer;
  private scene: Phaser.Scene;
  private isInitialized = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.monitor = new PerformanceMonitor(scene, this.onQualityChange.bind(this));
    this.dashboard = new PerformanceDashboard(scene, this.monitor);
    this.preloader = new AssetPreloader(scene);
    this.memoryOptimizer = MemoryOptimizer.getInstance();
  }

  /**
   * Initialize all performance systems
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing performance systems...');

    // 1. Device profiling
    const deviceProfile = DeviceProfiler.getDeviceProfile();
    console.log('📱 Device Profile:', deviceProfile);

    // 2. Memory optimization
    this.memoryOptimizer.optimizeScene(this.scene);

    // 3. Asset preloading
    await this.setupAssetPreloading();

    // 4. Performance monitoring
    this.dashboard.init();

    // 5. Apply initial quality settings based on device
    this.dashboard.adjustQuality(deviceProfile.recommendedQuality);

    // 6. Setup memory monitoring
    this.setupMemoryMonitoring();

    this.isInitialized = true;
    console.log('✅ Performance systems initialized');

    // Enable testing mode in development
    if (process.env.NODE_ENV === 'development') {
      this.enableDevelopmentMode();
    }
  }

  /**
   * Setup asset preloading with progress tracking
   */
  private async setupAssetPreloading(): Promise<void> {
    // Add game-specific assets
    this.preloader.addAssets(GameAssets.getRequiredAssets(), 'high');
    this.preloader.addAssets(GameAssets.getSoundAssets(), 'medium');

    // Start preloading
    await this.preloader.preload(
      (progress, assetKey) => {
        console.log(`📦 Preloading: ${progress.toFixed(1)}% (${assetKey})`);
      },
      () => {
        console.log('✅ Asset preloading completed');
      }
    );
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    // Monitor memory every 2 seconds
    this.scene.time.addEvent({
      delay: 2000,
      callback: () => {
        this.memoryOptimizer.monitorGarbageCollection();

        const suggestions = this.memoryOptimizer.getOptimizationSuggestions();
        if (suggestions.priority === 'high') {
          console.warn('⚠️ High memory usage detected:', suggestions.suggestions);
          this.applyEmergencyOptimizations();
        }
      },
      loop: true
    });
  }

  /**
   * Handle quality changes from performance monitor
   */
  private onQualityChange(level: 'high' | 'medium' | 'low'): void {
    console.log(`🎚️ Adjusting quality to: ${level}`);

    // Apply memory optimizations based on quality level
    const poolOptimizations = this.memoryOptimizer.optimizeObjectPools();
    console.log('🔧 Pool optimizations:', poolOptimizations);

    // Adjust game systems based on quality
    this.adjustGameQuality(level);
  }

  /**
   * Adjust game systems based on quality level
   */
  private adjustGameQuality(level: 'high' | 'medium' | 'low'): void {
    const settings = this.dashboard.getSettings();

    // Adjust based on quality level
    switch (level) {
      case 'high':
        // Enable all effects
        break;

      case 'medium':
        // Reduce some effects
        if ('children' in this.scene && Array.isArray(this.scene.children.list)) {
          this.scene.children.list.forEach((child: any) => {
            if (child.setAlpha && child.type !== 'Image') {
              child.setAlpha(0.9); // Slight transparency for performance
            }
          });
        }
        break;

      case 'low':
        // Minimal effects
        if (this.scene.tweens) {
          this.scene.tweens.killAll(); // Kill non-essential tweens
        }
        break;
    }
  }

  /**
   * Apply emergency optimizations for low memory situations
   */
  private applyEmergencyOptimizations(): void {
    console.log('🚨 Applying emergency optimizations');

    // Force lowest quality
    this.dashboard.adjustQuality('low');

    // Clear texture cache of unused textures
    if (this.scene.textures) {
      const textureKeys = this.scene.textures.list;
      Object.keys(textureKeys).forEach(key => {
        if (key !== '__MISSING' && key !== '__DEFAULT') {
          // Check if texture is actively used
          // This is a simplified check - in production you'd want more sophisticated tracking
          if (!key.includes('circle') && !key.includes('ui')) {
            this.scene.textures.remove(key);
          }
        }
      });
    }

    // Force garbage collection if available
    this.memoryOptimizer.forceGC();
  }

  /**
   * Enable development mode with enhanced debugging
   */
  private enableDevelopmentMode(): void {
    this.dashboard.enableTestingMode();

    // Add keyboard shortcuts for testing
    this.scene.input.keyboard?.on('keydown-P', () => {
      this.dashboard.toggle();
    });

    this.scene.input.keyboard?.on('keydown-Q', () => {
      const currentSettings = this.dashboard.getSettings();
      const levels: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
      const currentIndex = levels.indexOf(currentSettings.qualityLevel);
      const nextLevel = levels[(currentIndex + 1) % levels.length];
      this.dashboard.forceQualityLevel(nextLevel);
    });

    this.scene.input.keyboard?.on('keydown-G', () => {
      this.memoryOptimizer.forceGC();
    });

    console.log('🔧 Development mode enabled:');
    console.log('  - Press P to toggle performance dashboard');
    console.log('  - Press Q to cycle quality levels');
    console.log('  - Press G to force garbage collection');
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): {
    device: ReturnType<typeof DeviceProfiler.getDeviceProfile>;
    performance: ReturnType<PerformanceDashboard['getReport']>;
    memory: ReturnType<MemoryOptimizer['getMemoryInfo']>;
    assets: ReturnType<AssetPreloader['getProgress']>;
    optimizations: ReturnType<MemoryOptimizer['getOptimizationSuggestions']>;
  } {
    return {
      device: DeviceProfiler.getDeviceProfile(),
      performance: this.dashboard.getReport(),
      memory: this.memoryOptimizer.getMemoryInfo(),
      assets: this.preloader.getProgress(),
      optimizations: this.memoryOptimizer.getOptimizationSuggestions()
    };
  }

  /**
   * Show performance dashboard
   */
  showDashboard(): void {
    this.dashboard.show();
  }

  /**
   * Hide performance dashboard
   */
  hideDashboard(): void {
    this.dashboard.hide();
  }

  /**
   * Get current performance metrics for external systems
   */
  getCurrentMetrics(): {
    fps: number;
    quality: 'high' | 'medium' | 'low';
    memoryMB: number;
  } {
    const metrics = this.monitor.getMetrics();
    return {
      fps: metrics.currentFPS,
      quality: metrics.qualityLevel,
      memoryMB: metrics.memoryUsageMB
    };
  }

  /**
   * Clean up all performance systems
   */
  destroy(): void {
    this.monitor.destroy();
    this.dashboard.destroy();
    this.preloader.clear();
    this.memoryOptimizer.cleanup();

    console.log('🧹 Performance systems cleaned up');
  }
}

/**
 * Convenience function to integrate performance systems into a scene
 */
export function setupPerformanceOptimization(scene: Phaser.Scene): PerformanceIntegration {
  const integration = new PerformanceIntegration(scene);

  // Initialize on scene start
  scene.events.once('create', async () => {
    await integration.initialize();
  });

  // Cleanup on scene shutdown
  scene.events.once('shutdown', () => {
    integration.destroy();
  });

  return integration;
}