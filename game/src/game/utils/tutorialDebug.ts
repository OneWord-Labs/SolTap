/**
 * Debug utilities for testing the tutorial system
 */

import { TutorialManager } from '../managers/TutorialManager';

export class TutorialDebug {
  /**
   * Reset all tutorial states for testing
   */
  static resetAllTutorials(): void {
    try {
      localStorage.removeItem('soltap_tutorial_completed');
      localStorage.removeItem('soltap_menu_tutorial_completed');
      localStorage.removeItem('soltap_first_success_tutorial');
      localStorage.removeItem('soltap_first_failure_tutorial');
      console.log('✅ All tutorial states reset for testing');
    } catch (error) {
      console.warn('Could not reset tutorial states:', error);
    }
  }

  /**
   * Reset specific tutorial state
   */
  static resetTutorial(tutorialType: 'menu' | 'gameplay' | 'first_success' | 'first_failure'): void {
    try {
      switch (tutorialType) {
        case 'menu':
          localStorage.removeItem('soltap_menu_tutorial_completed');
          break;
        case 'gameplay':
          localStorage.removeItem('soltap_tutorial_completed');
          break;
        case 'first_success':
          localStorage.removeItem('soltap_first_success_tutorial');
          break;
        case 'first_failure':
          localStorage.removeItem('soltap_first_failure_tutorial');
          break;
      }
      console.log(`✅ ${tutorialType} tutorial state reset`);
    } catch (error) {
      console.warn(`Could not reset ${tutorialType} tutorial state:`, error);
    }
  }

  /**
   * Check current tutorial completion states
   */
  static checkTutorialStates(): void {
    try {
      const states = {
        mainTutorial: localStorage.getItem('soltap_tutorial_completed') === 'true',
        menuTutorial: localStorage.getItem('soltap_menu_tutorial_completed') === 'true',
        firstSuccess: localStorage.getItem('soltap_first_success_tutorial') === 'true',
        firstFailure: localStorage.getItem('soltap_first_failure_tutorial') === 'true'
      };

      console.log('📊 Tutorial States:', states);
      return states;
    } catch (error) {
      console.warn('Could not check tutorial states:', error);
      return null;
    }
  }

  /**
   * Force show tutorial for testing
   */
  static showTutorialTest(tutorialType: 'menu' | 'gameplay' | 'first_success' | 'first_failure'): void {
    // Reset the specific tutorial state
    this.resetTutorial(tutorialType);
    console.log(`🎯 Tutorial ${tutorialType} will show on next scene load`);
  }
}

// Make available globally for console debugging
(window as any).TutorialDebug = TutorialDebug;