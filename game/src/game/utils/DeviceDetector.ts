export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  touchSupported: boolean;
  hasNotch: boolean;
  type: 'mobile' | 'tablet' | 'desktop';
  orientation: 'portrait' | 'landscape';
}

export class DeviceDetector {
  private static instance: DeviceDetector;
  private info: DeviceInfo;
  private listeners: Array<(info: DeviceInfo) => void> = [];

  private constructor() {
    this.info = this.detectDevice();
    this.setupListeners();
  }

  static getInstance(): DeviceDetector {
    if (!DeviceDetector.instance) {
      DeviceDetector.instance = new DeviceDetector();
    }
    return DeviceDetector.instance;
  }

  getDeviceInfo(): DeviceInfo {
    return { ...this.info };
  }

  onDeviceChange(callback: (info: DeviceInfo) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private detectDevice(): DeviceInfo {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Mobile detection (width < 768px or known mobile user agents)
    const isMobile = width < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Tablet detection (768px - 1024px and touch support, or known tablet user agents)
    const isTablet = !isMobile && (
      (width >= 768 && width <= 1024 && touchSupported) ||
      /iPad|Android.*(?!.*Mobile)|Tablet/i.test(navigator.userAgent)
    );

    // Desktop is anything that's not mobile or tablet
    const isDesktop = !isMobile && !isTablet;

    // Detect device notch/safe area
    const hasNotch = this.hasNotchOrSafeArea();

    let type: 'mobile' | 'tablet' | 'desktop';
    if (isMobile) type = 'mobile';
    else if (isTablet) type = 'tablet';
    else type = 'desktop';

    return {
      isMobile,
      isTablet,
      isDesktop,
      isLandscape,
      isPortrait: !isLandscape,
      screenWidth: width,
      screenHeight: height,
      devicePixelRatio: window.devicePixelRatio || 1,
      touchSupported,
      hasNotch,
      type,
      orientation: isLandscape ? 'landscape' : 'portrait'
    };
  }

  private hasNotchOrSafeArea(): boolean {
    // Check if device has safe area insets (indicates notch or similar)
    if (CSS.supports('padding: env(safe-area-inset-top)')) {
      // Create a test element to check safe area values
      const testEl = document.createElement('div');
      testEl.style.position = 'fixed';
      testEl.style.top = 'env(safe-area-inset-top)';
      testEl.style.left = '0';
      testEl.style.visibility = 'hidden';
      document.body.appendChild(testEl);

      const computedTop = getComputedStyle(testEl).top;
      document.body.removeChild(testEl);

      return computedTop !== '0px' && computedTop !== 'env(safe-area-inset-top)';
    }

    // Fallback: check for known devices with notches
    const ua = navigator.userAgent;
    return /iPhone.*OS (1[1-9]|[2-9][0-9])/.test(ua) || // iPhone X and newer
           /iPhone.*OS 1[0-9].*Version\/1[4-9]/.test(ua); // iOS 14+ which may have notches
  }

  private setupListeners(): void {
    const updateDevice = () => {
      const oldInfo = { ...this.info };
      this.info = this.detectDevice();

      // Only notify if there's a meaningful change
      if (this.hasSignificantChange(oldInfo, this.info)) {
        this.listeners.forEach(callback => callback(this.info));
      }
    };

    // Listen for resize and orientation changes
    window.addEventListener('resize', updateDevice);
    window.addEventListener('orientationchange', () => {
      // Wait a bit for orientation change to complete
      setTimeout(updateDevice, 100);
    });

    // Listen for device pixel ratio changes (zoom)
    if ('matchMedia' in window) {
      const mediaQuery = window.matchMedia('(resolution: 1dppx)');
      mediaQuery.addEventListener('change', updateDevice);
    }
  }

  private hasSignificantChange(oldInfo: DeviceInfo, newInfo: DeviceInfo): boolean {
    return (
      oldInfo.type !== newInfo.type ||
      oldInfo.orientation !== newInfo.orientation ||
      Math.abs(oldInfo.screenWidth - newInfo.screenWidth) > 50 ||
      Math.abs(oldInfo.screenHeight - newInfo.screenHeight) > 50
    );
  }

  // Helper methods for common checks
  static isMobile(): boolean {
    return DeviceDetector.getInstance().getDeviceInfo().isMobile;
  }

  static isTablet(): boolean {
    return DeviceDetector.getInstance().getDeviceInfo().isTablet;
  }

  static isDesktop(): boolean {
    return DeviceDetector.getInstance().getDeviceInfo().isDesktop;
  }

  static isLandscape(): boolean {
    return DeviceDetector.getInstance().getDeviceInfo().isLandscape;
  }

  static isPortrait(): boolean {
    return DeviceDetector.getInstance().getDeviceInfo().isPortrait;
  }

  static getTouchTargetSize(): number {
    const info = DeviceDetector.getInstance().getDeviceInfo();
    // Apple recommends 44pt, Google recommends 48dp
    // Convert to pixels based on device
    if (info.isMobile) {
      return Math.max(44 * info.devicePixelRatio, 44);
    } else if (info.isTablet) {
      return Math.max(48 * info.devicePixelRatio, 48);
    } else {
      return 40; // Desktop can have smaller targets
    }
  }
}