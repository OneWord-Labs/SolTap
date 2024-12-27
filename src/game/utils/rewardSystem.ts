import { REWARDS } from '../constants';

export class RewardSystem {
  private tokens: number = 0;

  calculateReward(level: number, perfectMatch: boolean): number {
    const baseReward = REWARDS.baseTokens * Math.pow(REWARDS.multiplierPerLevel, level - 1);
    const bonus = perfectMatch ? REWARDS.bonusForPerfect : 0;
    const totalReward = Math.floor(baseReward + bonus);
    
    this.tokens += totalReward;
    return totalReward;
  }

  deductTryAgainCost(): boolean {
    if (this.tokens >= REWARDS.tryAgainCost) {
      this.tokens -= REWARDS.tryAgainCost;
      return true;
    }
    return false;
  }

  getTokenBalance(): number {
    return this.tokens;
  }
}
