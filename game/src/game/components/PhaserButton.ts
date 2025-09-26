import Phaser from 'phaser';

export interface PhaserButtonConfig {
  x: number;
  y: number;
  text: string;
  width?: number;
  height?: number;
  fontSize?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'ghost' | 'neon';
  rounded?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

export class PhaserButton extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private config: Required<PhaserButtonConfig>;
  private isHovered: boolean = false;
  private glowEffect?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, config: PhaserButtonConfig) {
    // Set defaults
    const fullConfig: Required<PhaserButtonConfig> = {
      width: 200,
      height: 50,
      fontSize: '20px',
      variant: 'primary',
      rounded: true,
      glow: false,
      onClick: () => {},
      ...config
    };

    super(scene, config.x, config.y);
    this.config = fullConfig;

    // Create button components
    this.background = scene.add.graphics();
    this.text = scene.add.text(0, 0, config.text, {
      fontSize: fullConfig.fontSize,
      color: this.getTextColor(),
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    // Add glow effect if enabled
    if (fullConfig.glow) {
      this.glowEffect = scene.add.graphics();
      this.add(this.glowEffect);
      this.createGlowEffect();
    }

    // Add to container
    this.add([this.background, this.text]);

    // Draw initial button state
    this.drawButton();

    // Make interactive
    this.setSize(fullConfig.width, fullConfig.height);
    this.setInteractive({ useHandCursor: true });

    // Add event listeners
    this.setupEventListeners();

    // Add to scene
    scene.add.existing(this);
  }

  private getVariantColors(): { main: number; hover: number; border?: number } {
    const variants = {
      primary: { main: 0x14F195, hover: 0x0BC77E },  // Solana green
      secondary: { main: 0x9945FF, hover: 0x7E2AE8 }, // Solana purple
      success: { main: 0x14F195, hover: 0x0BC77E },  // Also Solana green
      warning: { main: 0xFFA500, hover: 0xFF8C00 },  // Orange for resume
      ghost: { main: 0x000000, hover: 0x1A1A1A, border: 0x14F195 }, // Black with green border
      neon: { main: 0x000000, hover: 0x0F0F0F, border: 0x9945FF } // Black with purple border
    };
    return variants[this.config.variant] || variants.primary;
  }

  private getTextColor(): string {
    const textColors = {
      primary: '#000000',  // Black text on green
      secondary: '#FFFFFF', // White text on purple
      success: '#000000',  // Black text on green
      warning: '#FFFFFF',  // White text on orange
      ghost: '#14F195',    // Green text on black
      neon: '#9945FF'      // Purple text on black
    };
    return textColors[this.config.variant] || '#FFFFFF';
  }

  private drawButton(): void {
    const colors = this.getVariantColors();
    const color = this.isHovered ? colors.hover : colors.main;
    const { width, height, rounded } = this.config;

    this.background.clear();

    const radius = rounded ? Math.min(height / 2.5, 16) : 0;

    // Draw shadow for non-ghost variants
    if (!this.isHovered && this.config.variant !== 'ghost' && this.config.variant !== 'neon') {
      this.background.fillStyle(0x000000, 0.15);
      this.background.fillRoundedRect(
        -width / 2 + 2,
        -height / 2 + 3,
        width,
        height,
        radius
      );
    }

    // Draw border for ghost and neon variants
    if (colors.border) {
      this.background.lineStyle(3, colors.border, 1);
    }

    // Fill background
    const alpha = this.config.variant === 'ghost' || this.config.variant === 'neon' ? 0.1 : 1;
    this.background.fillStyle(color, alpha);

    // Draw the button
    this.background.fillRoundedRect(
      -width / 2,
      -height / 2,
      width,
      height,
      radius
    );

    if (colors.border) {
      this.background.strokeRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height,
        radius
      );
    }

    // Add shine effect for primary and secondary variants
    if (this.config.variant === 'primary' || this.config.variant === 'secondary') {
      this.background.fillStyle(0xFFFFFF, this.isHovered ? 0.15 : 0.1);
      this.background.fillRoundedRect(
        -width / 2,
        -height / 2,
        width,
        height / 3,
        radius
      );
    }
  }

  private createGlowEffect(): void {
    if (!this.glowEffect) return;

    const { width, height } = this.config;
    const glowRadius = 15;

    this.glowEffect.clear();

    // Only show glow on hover for neon variant or if always enabled
    if (this.config.variant === 'neon' && this.isHovered) {
      // Create multiple layers of glow
      for (let i = 3; i > 0; i--) {
        const alpha = 0.1 * i;
        const offset = glowRadius * (4 - i);
        this.glowEffect.fillStyle(0x14F195, alpha);
        this.glowEffect.fillRoundedRect(
          -width / 2 - offset,
          -height / 2 - offset,
          width + offset * 2,
          height + offset * 2,
          Math.min(height / 3, 20) + offset
        );
      }
    }
  }

  private setupEventListeners(): void {
    this.on('pointerover', () => {
      this.isHovered = true;
      this.drawButton();
      this.createGlowEffect();

      // Scale effect
      this.setScale(1.02);
    });

    this.on('pointerout', () => {
      this.isHovered = false;
      this.drawButton();
      this.createGlowEffect();

      // Reset scale
      this.setScale(1);
    });

    this.on('pointerdown', () => {
      this.setScale(0.98);
      this.config.onClick();
    });

    this.on('pointerup', () => {
      if (this.isHovered) {
        this.setScale(1.02);
      } else {
        this.setScale(1);
      }
    });
  }

  setText(text: string): void {
    this.text.setText(text);
  }

  setEnabled(enabled: boolean): void {
    this.setAlpha(enabled ? 1 : 0.5);
    this.setInteractive(enabled);
  }

  destroy(): void {
    this.removeAllListeners();
    super.destroy();
  }
}