import Phaser from 'phaser';

/**
 * Performance monitoring and adaptive quality management
 */
export class PerformanceMonitor {
  private scene: Phaser.Scene;
  private frameRates: number[] = [];
  private memoryUsage: number[] = [];
  private isMonitoring = false;
  private monitoringInterval: number | null = null;
  private frameCount = 0;
  private lastTime = 0;
  private currentFPS = 60;
  private averageFPS = 60;
  private lowFPSCount = 0;
  private qualityLevel: 'high' | 'medium' | 'low' = 'high';

  // Performance thresholds
  private readonly FPS_TARGET = 60;
  private readonly FPS_WARNING = 45;
  private readonly FPS_CRITICAL = 30;
  private readonly MEMORY_WARNING_MB = 100;
  private readonly MEMORY_CRITICAL_MB = 150;

  // Callbacks for quality adjustments
  private onQualityChange: (level: 'high' | 'medium' | 'low') => void;

  constructor(scene: Phaser.Scene, onQualityChange?: (level: 'high' | 'medium' | 'low') => void) {
    this.scene = scene;
    this.onQualityChange = onQualityChange || (() => {});
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameRates = [];
    this.memoryUsage = [];
    this.frameCount = 0;
    this.lastTime = performance.now();

    // Monitor every 100ms
    this.monitoringInterval = window.setInterval(() => {
      this.updateMetrics();
    }, 100);

    console.log('🔍 Performance monitoring started');
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('⏹️ Performance monitoring stopped');
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const now = performance.now();
    const deltaTime = now - this.lastTime;

    if (deltaTime > 0) {
      this.currentFPS = 1000 / deltaTime;
      this.frameRates.push(this.currentFPS);

      // Keep only last 100 samples for rolling average
      if (this.frameRates.length > 100) {
        this.frameRates.shift();
      }

      // Calculate average FPS
      this.averageFPS = this.frameRates.reduce((a, b) => a + b, 0) / this.frameRates.length;

      // Track consecutive low FPS frames
      if (this.currentFPS < this.FPS_WARNING) {
        this.lowFPSCount++;
      } else {
        this.lowFPSCount = 0;
      }

      // Check for performance degradation
      this.checkPerformanceThresholds();
    }

    // Monitor memory usage if available
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const memoryMB = memInfo.usedJSHeapSize / (1024 * 1024);
      this.memoryUsage.push(memoryMB);

      if (this.memoryUsage.length > 50) {
        this.memoryUsage.shift();
      }
    }

    this.lastTime = now;
    this.frameCount++;
  }

  /**
   * Check performance thresholds and adjust quality if needed
   */
  private checkPerformanceThresholds(): void {
    // Adjust quality based on consistent performance issues
    if (this.lowFPSCount >= 10) { // 1 second of low FPS
      if (this.averageFPS < this.FPS_CRITICAL && this.qualityLevel !== 'low') {
        this.setQualityLevel('low');
      } else if (this.averageFPS < this.FPS_WARNING && this.qualityLevel === 'high') {
        this.setQualityLevel('medium');
      }
    }

    // Memory pressure check
    if (this.memoryUsage.length > 0) {
      const currentMemory = this.memoryUsage[this.memoryUsage.length - 1];
      if (currentMemory > this.MEMORY_CRITICAL_MB && this.qualityLevel !== 'low') {
        console.warn(`⚠️ Critical memory usage: ${currentMemory.toFixed(1)}MB`);
        this.setQualityLevel('low');
      } else if (currentMemory > this.MEMORY_WARNING_MB && this.qualityLevel === 'high') {
        console.warn(`⚠️ High memory usage: ${currentMemory.toFixed(1)}MB`);
        this.setQualityLevel('medium');
      }
    }
  }

  /**
   * Set quality level and notify callback
   */
  private setQualityLevel(level: 'high' | 'medium' | 'low'): void {
    if (this.qualityLevel === level) return;

    const oldLevel = this.qualityLevel;
    this.qualityLevel = level;

    console.log(`🎚️ Quality adjusted: ${oldLevel} → ${level} (FPS: ${this.averageFPS.toFixed(1)})`);
    this.onQualityChange(level);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): {
    currentFPS: number;
    averageFPS: number;
    qualityLevel: 'high' | 'medium' | 'low';
    memoryUsageMB: number;
    frameDrops: number;
  } {
    const currentMemory = this.memoryUsage.length > 0 ?
      this.memoryUsage[this.memoryUsage.length - 1] : 0;

    const frameDrops = this.frameRates.filter(fps => fps < this.FPS_WARNING).length;

    return {
      currentFPS: Math.round(this.currentFPS),
      averageFPS: Math.round(this.averageFPS),
      qualityLevel: this.qualityLevel,
      memoryUsageMB: Math.round(currentMemory),
      frameDrops
    };
  }

  /**
   * Force quality level (for testing)
   */
  forceQualityLevel(level: 'high' | 'medium' | 'low'): void {
    this.setQualityLevel(level);
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): string {
    const metrics = this.getMetrics();
    const status = metrics.averageFPS >= this.FPS_TARGET ? '✅' :
                   metrics.averageFPS >= this.FPS_WARNING ? '⚠️' : '❌';

    return `${status} Performance Report:
FPS: ${metrics.currentFPS} (avg: ${metrics.averageFPS})
Quality: ${metrics.qualityLevel}
Memory: ${metrics.memoryUsageMB}MB
Frame Drops: ${metrics.frameDrops}`;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopMonitoring();
    this.frameRates = [];
    this.memoryUsage = [];
  }
}

/**
 * Device performance detector
 */
export class DeviceProfiler {
  static getDeviceProfile(): {
    tier: 'high' | 'medium' | 'low';
    recommendedQuality: 'high' | 'medium' | 'low';
    features: {
      webGL: boolean;
      canvas: boolean;
      audioContext: boolean;
      deviceMemory?: number;
      hardwareConcurrency: number;
    };
  } {
    const features = {
      webGL: this.hasWebGL(),
      canvas: this.hasCanvas(),
      audioContext: this.hasAudioContext(),
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency || 1
    };

    let tier: 'high' | 'medium' | 'low' = 'medium';

    // High-end device detection
    if (features.webGL &&
        features.hardwareConcurrency >= 4 &&
        (features.deviceMemory === undefined || features.deviceMemory >= 4)) {
      tier = 'high';
    }
    // Low-end device detection
    else if (!features.webGL ||
             features.hardwareConcurrency <= 2 ||
             (features.deviceMemory !== undefined && features.deviceMemory < 2)) {
      tier = 'low';
    }

    // Touch device performance is generally lower
    if (this.isMobile()) {
      tier = tier === 'high' ? 'medium' : 'low';
    }

    return {
      tier,
      recommendedQuality: tier,
      features
    };
  }

  private static hasWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      return false;
    }
  }

  private static hasCanvas(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('2d'));
    } catch (e) {
      return false;
    }
  }

  private static hasAudioContext(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  private static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}