import { Logger } from '../../utils/Logger';

export interface ComboConfig {
    multipliers: number[];
    milestones: number[];
    maxDisplayCombo: number;
}

export interface ComboState {
    currentCombo: number;
    bestCombo: number;
    multiplier: number;
    nextMilestone: number;
}

export class ComboManager {
    private combo: number = 0;
    private bestCombo: number = 0;
    private logger: Logger;

    private config: ComboConfig = {
        multipliers: [1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0], // Score multipliers at different combo levels
        milestones: [3, 5, 10, 15, 20, 30, 50], // Combo milestones for special effects
        maxDisplayCombo: 999 // Maximum combo to display
    };

    constructor() {
        this.logger = new Logger('ComboManager');
        this.reset();
    }

    /**
     * Records a successful pattern completion
     * @returns The new combo count
     */
    recordSuccess(): number {
        this.combo++;
        if (this.combo > this.bestCombo) {
            this.bestCombo = this.combo;
        }

        this.logger.log(`Combo increased to ${this.combo}`);
        return this.combo;
    }

    /**
     * Resets the combo on failure
     * @returns The combo count before reset
     */
    recordFailure(): number {
        const previousCombo = this.combo;
        this.combo = 0;

        if (previousCombo > 0) {
            this.logger.log(`Combo broken at ${previousCombo}`);
        }

        return previousCombo;
    }

    /**
     * Gets the current score multiplier based on combo
     * @returns The multiplier as a number (1.0 = no bonus, 2.0 = double score)
     */
    getScoreMultiplier(): number {
        if (this.combo === 0) return 1.0;

        // Use combo tiers for multipliers
        const tier = Math.min(
            Math.floor(this.combo / 3), // Every 3 combos increases tier
            this.config.multipliers.length - 1
        );

        return this.config.multipliers[tier];
    }

    /**
     * Checks if the current combo reached a milestone
     * @returns The milestone reached, or null if no milestone
     */
    checkMilestone(): number | null {
        for (const milestone of this.config.milestones) {
            if (this.combo === milestone) {
                this.logger.log(`Combo milestone reached: ${milestone}`);
                return milestone;
            }
        }
        return null;
    }

    /**
     * Gets the next milestone for UI display
     * @returns The next milestone number
     */
    getNextMilestone(): number {
        for (const milestone of this.config.milestones) {
            if (milestone > this.combo) {
                return milestone;
            }
        }
        // Return a high number if all milestones passed
        return this.config.milestones[this.config.milestones.length - 1] + 50;
    }

    /**
     * Gets the current combo state for UI updates
     * @returns Complete combo state
     */
    getComboState(): ComboState {
        return {
            currentCombo: this.combo,
            bestCombo: this.bestCombo,
            multiplier: this.getScoreMultiplier(),
            nextMilestone: this.getNextMilestone()
        };
    }

    /**
     * Gets the current combo count
     * @returns Current combo
     */
    getCurrentCombo(): number {
        return this.combo;
    }

    /**
     * Gets the best combo achieved
     * @returns Best combo
     */
    getBestCombo(): number {
        return this.bestCombo;
    }

    /**
     * Resets combo and best combo (for new game)
     */
    reset(): void {
        this.combo = 0;
        // Don't reset best combo - it should persist for the session
        this.logger.log('Combo system reset');
    }

    /**
     * Checks if combo should show special effects
     * @returns True if combo is high enough for effects
     */
    shouldShowComboEffects(): boolean {
        return this.combo >= 3; // Show effects at combo 3+
    }

    /**
     * Gets a display-friendly combo text
     * @returns Formatted combo string
     */
    getComboDisplayText(): string {
        if (this.combo === 0) return '';

        const displayCombo = Math.min(this.combo, this.config.maxDisplayCombo);
        const multiplier = this.getScoreMultiplier();

        return `${displayCombo}x COMBO! (${multiplier.toFixed(1)}x)`;
    }

    /**
     * Gets combo tier (for different visual effects)
     * @returns Combo tier from 0-7
     */
    getComboTier(): number {
        if (this.combo === 0) return 0;
        return Math.min(Math.floor(this.combo / 3), 7);
    }
}