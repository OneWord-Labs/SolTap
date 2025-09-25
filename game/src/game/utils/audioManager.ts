import { SoundManager } from '../audio/SoundManager';

export class AudioManager {
  private soundManager: SoundManager;
  
  constructor() {
    this.soundManager = new SoundManager();
  }

  playTapSound(index: number) {
    this.soundManager.playDotSound(index);
  }

  playHoldSound(index: number) {
    this.soundManager.playDotSound(index);
  }

  playRapidSound(index: number) {
    this.soundManager.playDotSound(index);
  }

  playComboSound(comboCount: number) {
    this.soundManager.playComboSound(comboCount);
  }

  playMilestoneSound(milestone: number) {
    this.soundManager.playMilestoneSound(milestone);
  }

  playComboBreakSound() {
    this.soundManager.playComboBreakSound();
  }

  cleanup() {
    this.soundManager.cleanup();
  }
}
