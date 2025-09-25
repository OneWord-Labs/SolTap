import { DeviceDetector, DeviceInfo } from './DeviceDetector';
import { RESPONSIVE_CONFIG, TOUCH_TARGETS } from '../constants';

export interface ResponsiveGameConfig {
  circleRadius: number;
  circlePadding: number;
  minCircleSpacing: number;
  fontSize: {
    level: number;
    menu: number;
    ui: number;
  };
  buttonSize: {
    width: number;
    height: number;
    padding: { x: number; y: number };
  };
  uiSpacing: {
    topMargin: number;
    bottomMargin: number;
    sideMargin: number;
  };
  touchTargetSize: number;
}

export class ResponsiveConfig {
  private static instance: ResponsiveConfig;
  private deviceDetector: DeviceDetector;
  private currentConfig: ResponsiveGameConfig;

  private constructor() {
    this.deviceDetector = DeviceDetector.getInstance();
    this.currentConfig = this.calculateConfig();

    // Listen for device changes
    this.deviceDetector.onDeviceChange(() => {
      this.currentConfig = this.calculateConfig();
    });
  }

  static getInstance(): ResponsiveConfig {
    if (!ResponsiveConfig.instance) {
      ResponsiveConfig.instance = new ResponsiveConfig();
    }
    return ResponsiveConfig.instance;
  }

  getCurrentConfig(): ResponsiveGameConfig {
    return { ...this.currentConfig };
  }

  private calculateConfig(): ResponsiveGameConfig {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    const baseConfig = this.getBaseConfigForDevice(deviceInfo);

    return {
      ...baseConfig,
      touchTargetSize: this.calculateTouchTargetSize(deviceInfo),
      // Adjust circle size based on screen size
      circleRadius: this.adjustForScreenSize(baseConfig.circleRadius, deviceInfo),
      circlePadding: this.adjustForScreenSize(baseConfig.circlePadding, deviceInfo),
    };
  }

  private getBaseConfigForDevice(deviceInfo: DeviceInfo) {
    const { type, orientation } = deviceInfo;
    return RESPONSIVE_CONFIG[type][orientation];
  }

  private calculateTouchTargetSize(deviceInfo: DeviceInfo): number {
    const { isMobile, isTablet, devicePixelRatio } = deviceInfo;

    let baseSize: number;
    if (isMobile) {
      baseSize = TOUCH_TARGETS.minimum;
    } else if (isTablet) {
      baseSize = TOUCH_TARGETS.recommended;
    } else {
      baseSize = TOUCH_TARGETS.comfortable;
    }

    // Adjust for device pixel ratio
    return Math.max(baseSize, baseSize * devicePixelRatio);
  }

  private adjustForScreenSize(baseValue: number, deviceInfo: DeviceInfo): number {
    const { screenWidth, screenHeight } = deviceInfo;
    const referenceSize = Math.min(screenWidth, screenHeight);

    // Scale based on screen size relative to reference (iPhone SE: 375px)
    const scaleFactor = Math.max(0.7, Math.min(1.5, referenceSize / 375));

    return Math.round(baseValue * scaleFactor);
  }

  // Helper methods for common calculations
  calculateFontSize(baseSize: number, type: 'level' | 'menu' | 'ui' = 'menu'): string {
    const config = this.getCurrentConfig();
    const deviceInfo = this.deviceDetector.getDeviceInfo();

    // Use configured font sizes as base, then apply scaling
    const configuredSize = config.fontSize[type];
    const scaleFactor = Math.min(
      deviceInfo.screenWidth / 800,
      deviceInfo.screenHeight / 600
    );

    const finalSize = Math.max(
      Math.floor(configuredSize * scaleFactor),
      type === 'level' ? 24 : type === 'menu' ? 16 : 12
    );

    return `${finalSize}px`;
  }

  calculateButtonWidth(screenWidth: number): number {
    const config = this.getCurrentConfig();
    return screenWidth * config.buttonSize.width;
  }

  calculateSpacing(dimension: 'width' | 'height', type: 'top' | 'bottom' | 'side'): number {
    const config = this.getCurrentConfig();
    const deviceInfo = this.deviceDetector.getDeviceInfo();

    const screenSize = dimension === 'width' ? deviceInfo.screenWidth : deviceInfo.screenHeight;

    let spacingRatio: number;
    switch (type) {
      case 'top':
        spacingRatio = config.uiSpacing.topMargin;
        break;
      case 'bottom':
        spacingRatio = config.uiSpacing.bottomMargin;
        break;
      case 'side':
        spacingRatio = config.uiSpacing.sideMargin;
        break;
    }

    return screenSize * spacingRatio;
  }

  // Get optimal game dimensions
  getGameDimensions(): { width: number; height: number; aspectRatio: number } {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    const { screenWidth, screenHeight } = deviceInfo;

    // Calculate aspect ratio for game area (excluding UI margins)
    const config = this.getCurrentConfig();
    const usableWidth = screenWidth - (this.calculateSpacing('width', 'side') * 2);
    const usableHeight = screenHeight -
      (this.calculateSpacing('height', 'top') + this.calculateSpacing('height', 'bottom'));

    const aspectRatio = usableWidth / usableHeight;

    return {
      width: usableWidth,
      height: usableHeight,
      aspectRatio
    };
  }

  // Check if device needs special handling
  needsCompactLayout(): boolean {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    return deviceInfo.isMobile && deviceInfo.isLandscape;
  }

  needsLargeText(): boolean {
    const deviceInfo = this.deviceDetector.getDeviceInfo();
    return deviceInfo.screenWidth < 400 || deviceInfo.devicePixelRatio < 2;
  }

  // Safe area handling
  getSafeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
    // Check if CSS env() variables are available
    if (CSS.supports('padding: env(safe-area-inset-top)')) {
      // Create a test element to read safe area values
      const testEl = document.createElement('div');
      testEl.style.position = 'fixed';
      testEl.style.top = 'env(safe-area-inset-top)';
      testEl.style.right = 'env(safe-area-inset-right)';
      testEl.style.bottom = 'env(safe-area-inset-bottom)';
      testEl.style.left = 'env(safe-area-inset-left)';
      testEl.style.visibility = 'hidden';
      document.body.appendChild(testEl);

      const computed = getComputedStyle(testEl);
      const insets = {
        top: parseInt(computed.top) || 0,
        right: parseInt(computed.right) || 0,
        bottom: parseInt(computed.bottom) || 0,
        left: parseInt(computed.left) || 0
      };

      document.body.removeChild(testEl);
      return insets;
    }

    // Fallback for devices without safe area support
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}