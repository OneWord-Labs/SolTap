export const COLORS = {
  primary: 0x14F195,    // Solana green
  secondary: 0x9945FF,  // Solana purple
  inactive: 0x333333,
  background: 0x000000,
  success: 0x00FF00,    // Success green
  error: 0xFF0000,      // Error red
  button: 0x14F195,     // Button color
  menuText: 0xFFFFFF    // Menu text color
};

export const AudioNotes = {
  tap: [261.63, 329.63, 392.00, 493.88],
  hold: [523.25, 659.25, 783.99, 987.77],
  rapid: [130.81, 164.81, 196.00, 246.94]
};

export const REWARDS = {
  baseTokens: 10,
  multiplierPerLevel: 1.5,
  bonusForPerfect: 50,
  tryAgainCost: 5      // Cost to try again
};

export const GAME_CONFIG = {
  circleCount: 4,
  speedMultiplier: 1.1,  // Speed increases per level
  basePatternDelay: 500, // Base delay between patterns
  minPatternDelay: 200,  // Minimum delay between patterns
  minCircleSpacing: 100,
  circlePadding: 100,
  circleRadius: 40,
  levelTransitionDelay: 2000,    // Time between levels in ms
  patternShowDelay: 500,         // Delay between showing each pattern
  levelStartDelay: 1500,         // Delay before starting new level
  menuButtonWidth: 200,
  menuButtonHeight: 50,
  menuButtonSpacing: 20,
  levelTextStyle: {
    fontSize: '64px',
    color: '#14F195',
    fontFamily: 'Arial'
  },
  menuTextStyle: {
    fontSize: '32px',
    color: '#FFFFFF',
    fontFamily: 'Arial'
  }
};

// Responsive game configuration based on device type
export const RESPONSIVE_CONFIG = {
  // Mobile portrait configuration
  mobile: {
    portrait: {
      circleRadius: 35,
      circlePadding: 80,
      minCircleSpacing: 80,
      fontSize: {
        level: 48,
        menu: 24,
        ui: 18
      },
      buttonSize: {
        width: 0.6,  // 60% of screen width
        height: 50,
        padding: { x: 15, y: 8 }
      },
      uiSpacing: {
        topMargin: 0.08,    // 8% of screen height
        bottomMargin: 0.12,  // 12% of screen height
        sideMargin: 0.05     // 5% of screen width
      }
    },
    landscape: {
      circleRadius: 30,
      circlePadding: 60,
      minCircleSpacing: 70,
      fontSize: {
        level: 40,
        menu: 20,
        ui: 16
      },
      buttonSize: {
        width: 0.4,  // 40% of screen width
        height: 40,
        padding: { x: 12, y: 6 }
      },
      uiSpacing: {
        topMargin: 0.1,      // 10% of screen height
        bottomMargin: 0.15,  // 15% of screen height
        sideMargin: 0.08     // 8% of screen width
      }
    }
  },
  // Tablet configuration
  tablet: {
    portrait: {
      circleRadius: 45,
      circlePadding: 100,
      minCircleSpacing: 100,
      fontSize: {
        level: 56,
        menu: 28,
        ui: 20
      },
      buttonSize: {
        width: 0.5,  // 50% of screen width
        height: 55,
        padding: { x: 18, y: 10 }
      },
      uiSpacing: {
        topMargin: 0.06,
        bottomMargin: 0.1,
        sideMargin: 0.1
      }
    },
    landscape: {
      circleRadius: 50,
      circlePadding: 120,
      minCircleSpacing: 110,
      fontSize: {
        level: 60,
        menu: 30,
        ui: 22
      },
      buttonSize: {
        width: 0.35, // 35% of screen width
        height: 60,
        padding: { x: 20, y: 12 }
      },
      uiSpacing: {
        topMargin: 0.08,
        bottomMargin: 0.12,
        sideMargin: 0.15
      }
    }
  },
  // Desktop configuration
  desktop: {
    portrait: {
      circleRadius: 50,
      circlePadding: 120,
      minCircleSpacing: 120,
      fontSize: {
        level: 64,
        menu: 32,
        ui: 24
      },
      buttonSize: {
        width: 0.3,  // 30% of screen width
        height: 60,
        padding: { x: 20, y: 12 }
      },
      uiSpacing: {
        topMargin: 0.05,
        bottomMargin: 0.08,
        sideMargin: 0.15
      }
    },
    landscape: {
      circleRadius: 55,
      circlePadding: 140,
      minCircleSpacing: 130,
      fontSize: {
        level: 72,
        menu: 36,
        ui: 26
      },
      buttonSize: {
        width: 0.25, // 25% of screen width
        height: 65,
        padding: { x: 22, y: 14 }
      },
      uiSpacing: {
        topMargin: 0.06,
        bottomMargin: 0.1,
        sideMargin: 0.2
      }
    }
  }
};

// Touch target minimum sizes (in pixels)
export const TOUCH_TARGETS = {
  minimum: 44,        // Apple HIG minimum
  recommended: 48,    // Material Design recommended
  comfortable: 56     // Larger for better accessibility
};

// Practice Mode removed - out of scope
