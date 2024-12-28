import { REWARDS } from '../constants';
import { TelegramService } from '../services/TelegramService';

export class RewardSystem {
  private tokenBalance: number = 0;
  private telegramService: TelegramService;
  private userId?: number;

  constructor() {
    this.telegramService = new TelegramService();
    this.userId = Number(new URLSearchParams(window.location.search).get('userId'));
  }

  calculateReward(level: number, isPerfect: boolean): number {
    const baseReward = REWARDS.baseTokens * Math.pow(REWARDS.multiplierPerLevel, level - 1);
    const reward = isPerfect ? baseReward + REWARDS.bonusForPerfect : baseReward;
    this.tokenBalance += reward;
    
    if (this.userId) {
      fetch('/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          score: this.tokenBalance
        })
      });
    }
    
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