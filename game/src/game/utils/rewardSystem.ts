import { REWARDS } from '../constants';

export class RewardSystem {
    private tokenBalance: number = 0;

    calculateReward(level: number, isPerfect: boolean, comboMultiplier: number = 1.0): number {
        const baseReward = REWARDS.baseTokens * Math.pow(REWARDS.multiplierPerLevel, level - 1);
        let reward = isPerfect ? baseReward + REWARDS.bonusForPerfect : baseReward;

        // Apply combo multiplier
        reward = Math.floor(reward * comboMultiplier);

        this.tokenBalance += reward;
        return reward;
    }

    deductTryAgainCost(): boolean {
        if (this.tokenBalance >= REWARDS.tryAgainCost) {
            this.tokenBalance -= REWARDS.tryAgainCost;
            return true;
        }
        return false;
    }

    getTokenBalance(): number {
        return this.tokenBalance;
    }
}