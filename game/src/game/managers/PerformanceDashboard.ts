import Phaser from 'phaser';
import { PerformanceMonitor } from './PerformanceMonitor';
import { RippleEffect } from '../effects/RippleEffect';

export interface PerformanceSettings {
  qualityLevel: 'high' | 'medium' | 'low';
  maxParticles: number;
  enableRippleEffects: boolean;
  enableSmoothAnimations: boolean;
  targetFrameRate: number;
  enableDebugInfo: boolean;
}

/**
 * Performance dashboard and adaptive quality manager
 */
export class PerformanceDashboard {
  private scene: Phaser.Scene;
  private monitor: PerformanceMonitor;
  private settings: PerformanceSettings;
  private debugText?: Phaser.GameObjects.Text;
  private isVisible = false;
  private updateTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, monitor: PerformanceMonitor) {
    this.scene = scene;
    this.monitor = monitor;

    // Default settings
    this.settings = {
      qualityLevel: 'high',
      maxParticles: 10,
      enableRippleEffects: true,
      enableSmoothAnimations: true,
      targetFrameRate: 60,
      enableDebugInfo: false
    };
  }

  /**
   * Initialize dashboard
   */
  init(): void {
    this.createDebugText();
    this.setupPerformanceCallbacks();

    if (this.settings.enableDebugInfo) {
      this.show();
    }
  }

  /**
   * Create debug text display
   */
  private createDebugText(): void {
    this.debugText = this.scene.add.text(10, 10, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ff88',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: { x: 8, y: 4 }
    });

    this.debugText.setDepth(1000);
    this.debugText.setVisible(false);
  }

  /**
   * Setup performance monitoring callbacks
   */
  private setupPerformanceCallbacks(): void {
    this.monitor.startMonitoring();

    // Update display every 500ms
    this.updateTimer = this.scene.time.addEvent({
      delay: 500,
      callback: this.updateDisplay,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Update performance display
   */
  private updateDisplay(): void {
    if (!this.debugText || !this.isVisible) return;

    const metrics = this.monitor.getMetrics();
    const poolStats = RippleEffect.getPoolStats();

    const debugInfo = [
      `FPS: ${metrics.currentFPS} (avg: ${metrics.averageFPS})`,
      `Quality: ${metrics.qualityLevel.toUpperCase()}`,
      `Memory: ${metrics.memoryUsageMB}MB`,
      `Frame Drops: ${metrics.frameDrops}`,
      `Pool: ${poolStats.available}/${poolStats.maxSize}`,
      `Settings: ${this.getSettingsSummary()}`
    ].join('\n');

    this.debugText.setText(debugInfo);

    // Color code based on performance
    const color = metrics.averageFPS >= 50 ? '#00ff88' :
                  metrics.averageFPS >= 30 ? '#ffaa00' : '#ff4444';
    this.debugText.setColor(color);
  }

  /**
   * Get settings summary
   */
  private getSettingsSummary(): string {
    const { qualityLevel, enableRippleEffects, enableSmoothAnimations } = this.settings;
    return `${qualityLevel[0].toUpperCase()}_${enableRippleEffects ? 'R' : 'r'}_${enableSmoothAnimations ? 'A' : 'a'}`;
  }

  /**
   * Adjust quality settings based on performance
   */
  adjustQuality(level: 'high' | 'medium' | 'low'): void {
    this.settings.qualityLevel = level;

    switch (level) {
      case 'high':
        this.settings.maxParticles = 10;
        this.settings.enableRippleEffects = true;
        this.settings.enableSmoothAnimations = true;
        this.settings.targetFrameRate = 60;
        break;

      case 'medium':
        this.settings.maxParticles = 6;
        this.settings.enableRippleEffects = true;
        this.settings.enableSmoothAnimations = true;
        this.settings.targetFrameRate = 45;
        break;

      case 'low':
        this.settings.maxParticles = 3;
        this.settings.enableRippleEffects = false;
        this.settings.enableSmoothAnimations = false;
        this.settings.targetFrameRate = 30;
        break;
    }

    console.log(`🎚️ Quality settings adjusted to ${level}:`, {
      maxParticles: this.settings.maxParticles,
      rippleEffects: this.settings.enableRippleEffects,
      smoothAnimations: this.settings.enableSmoothAnimations,
      targetFPS: this.settings.targetFrameRate
    });

    // Apply frame rate limiting
    if (this.scene.game.loop) {
      this.scene.game.loop.targetFps = this.settings.targetFrameRate;
    }
  }

  /**
   * Show performance dashboard
   */
  show(): void {
    this.isVisible = true;
    if (this.debugText) {
      this.debugText.setVisible(true);
    }
  }

  /**
   * Hide performance dashboard
   */
  hide(): void {
    this.isVisible = false;
    if (this.debugText) {
      this.debugText.setVisible(false);
    }
  }

  /**
   * Toggle dashboard visibility
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Get current performance settings
   */
  getSettings(): PerformanceSettings {
    return { ...this.settings };
  }

  /**
   * Update specific setting
   */
  updateSetting<K extends keyof PerformanceSettings>(key: K, value: PerformanceSettings[K]): void {
    this.settings[key] = value;

    // Apply immediate effects based on setting
    switch (key) {
      case 'enableDebugInfo':
        if (value) {
          this.show();
        } else {
          this.hide();
        }
        break;

      case 'targetFrameRate':
        if (this.scene.game.loop) {
          this.scene.game.loop.targetFps = value as number;
        }
        break;
    }
  }

  /**
   * Get performance report
   */
  getReport(): {
    metrics: ReturnType<PerformanceMonitor['getMetrics']>;
    settings: PerformanceSettings;
    poolStats: ReturnType<typeof RippleEffect.getPoolStats>;
  } {
    return {
      metrics: this.monitor.getMetrics(),
      settings: this.getSettings(),
      poolStats: RippleEffect.getPoolStats()
    };
  }

  /**
   * Enable performance testing mode
   */
  enableTestingMode(): void {
    this.settings.enableDebugInfo = true;
    this.show();

    // Log performance every 5 seconds
    this.scene.time.addEvent({
      delay: 5000,
      callback: () => {
        const report = this.getReport();
        console.log('Performance Report:', report);
      },
      loop: true
    });

    console.log('🧪 Performance testing mode enabled');
  }

  /**
   * Apply performance optimizations based on current metrics
   */
  optimize(): void {
    const metrics = this.monitor.getMetrics();

    if (metrics.averageFPS < 30 && this.settings.qualityLevel !== 'low') {
      this.adjustQuality('low');
    } else if (metrics.averageFPS < 45 && this.settings.qualityLevel === 'high') {
      this.adjustQuality('medium');
    } else if (metrics.averageFPS >= 55 && this.settings.qualityLevel === 'low') {
      this.adjustQuality('medium');
    } else if (metrics.averageFPS >= 58 && this.settings.qualityLevel === 'medium') {
      this.adjustQuality('high');
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.monitor.stopMonitoring();

    if (this.updateTimer) {
      this.updateTimer.destroy();
    }

    if (this.debugText) {
      this.debugText.destroy();
    }

    console.log('🧹 Performance dashboard destroyed');
  }
}

/**
 * Performance preset configurations
 */
export class PerformancePresets {
  static readonly HIGH_END: PerformanceSettings = {
    qualityLevel: 'high',
    maxParticles: 15,
    enableRippleEffects: true,
    enableSmoothAnimations: true,
    targetFrameRate: 60,
    enableDebugInfo: false
  };

  static readonly MEDIUM_END: PerformanceSettings = {
    qualityLevel: 'medium',
    maxParticles: 8,
    enableRippleEffects: true,
    enableSmoothAnimations: true,
    targetFrameRate: 45,
    enableDebugInfo: false
  };

  static readonly LOW_END: PerformanceSettings = {
    qualityLevel: 'low',
    maxParticles: 3,
    enableRippleEffects: false,
    enableSmoothAnimations: false,
    targetFrameRate: 30,
    enableDebugInfo: false
  };

  static readonly DEBUG: PerformanceSettings = {
    qualityLevel: 'medium',
    maxParticles: 6,
    enableRippleEffects: true,
    enableSmoothAnimations: true,
    targetFrameRate: 60,
    enableDebugInfo: true
  };
}