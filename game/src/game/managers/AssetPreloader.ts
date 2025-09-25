import Phaser from 'phaser';

export interface AssetConfig {
  key: string;
  type: 'image' | 'audio' | 'json';
  url: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Intelligent asset preloading system for smooth gameplay
 */
export class AssetPreloader {
  private scene: Phaser.Scene;
  private loadQueue: AssetConfig[] = [];
  private loadedAssets = new Set<string>();
  private loadingAssets = new Set<string>();
  private onProgress?: (progress: number, asset?: string) => void;
  private onComplete?: () => void;
  private totalAssets = 0;
  private loadedCount = 0;
  private isPreloading = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Add asset to preload queue
   */
  addAsset(config: AssetConfig): void {
    if (this.loadedAssets.has(config.key)) {
      return; // Already loaded
    }

    this.loadQueue.push(config);
    this.totalAssets++;
  }

  /**
   * Add multiple assets with same priority
   */
  addAssets(assets: Omit<AssetConfig, 'priority'>[], priority: 'high' | 'medium' | 'low' = 'medium'): void {
    assets.forEach(asset => {
      this.addAsset({ ...asset, priority });
    });
  }

  /**
   * Start preloading assets
   */
  async preload(
    onProgress?: (progress: number, asset?: string) => void,
    onComplete?: () => void
  ): Promise<void> {
    if (this.isPreloading) {
      console.warn('Asset preloading already in progress');
      return;
    }

    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.isPreloading = true;

    console.log(`🚀 Starting asset preload (${this.totalAssets} assets)`);

    // Sort by priority: high -> medium -> low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    this.loadQueue.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // Preload high priority assets first
    await this.loadAssetBatch('high');

    // Then medium priority
    await this.loadAssetBatch('medium');

    // Finally low priority (can be loaded in background during gameplay)
    this.loadAssetBatch('low', true); // Load in background

    this.isPreloading = false;
    this.onComplete?.();
    console.log('✅ Asset preloading completed');
  }

  /**
   * Load a batch of assets by priority
   */
  private async loadAssetBatch(priority: 'high' | 'medium' | 'low', background = false): Promise<void> {
    const batch = this.loadQueue.filter(asset => asset.priority === priority);
    if (batch.length === 0) return;

    if (background) {
      // Load in background without waiting
      this.loadAssetsConcurrent(batch);
      return;
    }

    // Wait for completion
    await this.loadAssetsConcurrent(batch);
  }

  /**
   * Load multiple assets concurrently
   */
  private loadAssetsConcurrent(assets: AssetConfig[]): Promise<void> {
    return new Promise((resolve) => {
      let completed = 0;
      const total = assets.length;

      if (total === 0) {
        resolve();
        return;
      }

      assets.forEach((asset) => {
        this.loadSingleAsset(asset).then(() => {
          completed++;
          this.loadedCount++;
          this.loadedAssets.add(asset.key);
          this.loadingAssets.delete(asset.key);

          const progress = (this.loadedCount / this.totalAssets) * 100;
          this.onProgress?.(progress, asset.key);

          if (completed === total) {
            resolve();
          }
        }).catch((error) => {
          console.error(`Failed to load asset ${asset.key}:`, error);
          completed++;
          this.loadedCount++;

          if (completed === total) {
            resolve();
          }
        });
      });
    });
  }

  /**
   * Load a single asset
   */
  private loadSingleAsset(asset: AssetConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.loadedAssets.has(asset.key)) {
        resolve();
        return;
      }

      if (this.loadingAssets.has(asset.key)) {
        // Already loading, wait for completion
        const checkInterval = setInterval(() => {
          if (this.loadedAssets.has(asset.key) || !this.loadingAssets.has(asset.key)) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 50);
        return;
      }

      this.loadingAssets.add(asset.key);

      // Check if asset already exists in cache
      if (this.scene.cache.json.has(asset.key) ||
          this.scene.textures.exists(asset.key) ||
          this.scene.cache.audio.has(asset.key)) {
        this.loadedAssets.add(asset.key);
        this.loadingAssets.delete(asset.key);
        resolve();
        return;
      }

      try {
        switch (asset.type) {
          case 'image':
            this.scene.load.image(asset.key, asset.url);
            break;
          case 'audio':
            this.scene.load.audio(asset.key, asset.url);
            break;
          case 'json':
            this.scene.load.json(asset.key, asset.url);
            break;
          default:
            reject(new Error(`Unknown asset type: ${asset.type}`));
            return;
        }

        // Set up load events
        this.scene.load.once(`filecomplete-${asset.type}-${asset.key}`, () => {
          resolve();
        });

        this.scene.load.once(`loaderror`, (file: any) => {
          if (file.key === asset.key) {
            reject(new Error(`Failed to load ${asset.key}`));
          }
        });

        // Start loading if not already started
        if (!this.scene.load.isLoading()) {
          this.scene.load.start();
        }

      } catch (error) {
        this.loadingAssets.delete(asset.key);
        reject(error);
      }
    });
  }

  /**
   * Check if asset is loaded
   */
  isAssetLoaded(key: string): boolean {
    return this.loadedAssets.has(key);
  }

  /**
   * Get loading progress
   */
  getProgress(): { loaded: number; total: number; percentage: number } {
    return {
      loaded: this.loadedCount,
      total: this.totalAssets,
      percentage: this.totalAssets > 0 ? (this.loadedCount / this.totalAssets) * 100 : 100
    };
  }

  /**
   * Clear preloader state
   */
  clear(): void {
    this.loadQueue = [];
    this.loadedAssets.clear();
    this.loadingAssets.clear();
    this.totalAssets = 0;
    this.loadedCount = 0;
    this.isPreloading = false;
  }
}

/**
 * Game-specific asset definitions
 */
export class GameAssets {
  static getRequiredAssets(): AssetConfig[] {
    return [
      // High priority - needed immediately
      {
        key: 'circle-base',
        type: 'image',
        url: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
            <circle cx="25" cy="25" r="23" fill="none" stroke="#00ff88" stroke-width="2"/>
          </svg>
        `),
        priority: 'high'
      },

      // Medium priority - nice to have ready
      {
        key: 'success-sound',
        type: 'audio',
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhAjOLze/CdikEJHfE7dl+MwgZYrPt5Z9NEAxQp+PytmMcBjiR0/LNeSsFJHfH8N2RQAoUXrTq67pVFAlGnt/yv2wdBjKLzu/CdikEJHfE7dl+Mwk=',
        priority: 'medium'
      }
    ];
  }

  static getSoundAssets(): AssetConfig[] {
    return [
      {
        key: 'tap-sound-1',
        type: 'audio',
        url: GameAssets.generateTapSound(220), // A3
        priority: 'high'
      },
      {
        key: 'tap-sound-2',
        type: 'audio',
        url: GameAssets.generateTapSound(261), // C4
        priority: 'high'
      },
      {
        key: 'tap-sound-3',
        type: 'audio',
        url: GameAssets.generateTapSound(329), // E4
        priority: 'high'
      },
      {
        key: 'success-sound',
        type: 'audio',
        url: GameAssets.generateSuccessSound(),
        priority: 'medium'
      },
      {
        key: 'failure-sound',
        type: 'audio',
        url: GameAssets.generateFailureSound(),
        priority: 'medium'
      }
    ];
  }

  /**
   * Generate a simple tap sound as data URL
   */
  private static generateTapSound(frequency: number): string {
    // Generate a simple beep sound using Web Audio API
    const duration = 0.1;
    const sampleRate = 22050;
    const samples = duration * sampleRate;
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);

    // Generate sine wave
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 10); // Exponential decay
      const sample = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3;
      const intSample = Math.max(-32768, Math.min(32767, sample * 32767));
      view.setInt16(44 + i * 2, intSample, true);
    }

    // Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return 'data:audio/wav;base64,' + btoa(binary);
  }

  private static generateSuccessSound(): string {
    return this.generateTapSound(523); // C5
  }

  private static generateFailureSound(): string {
    return this.generateTapSound(147); // D3
  }
}