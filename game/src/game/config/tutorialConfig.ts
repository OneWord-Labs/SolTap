import { TutorialStep, TutorialConfig } from '../managers/TutorialManager';

/**
 * Tutorial steps for the menu introduction
 */
export const menuTutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Sol Tap! 🎉',
    text: 'Get ready for an exciting memory and reflex challenge! This quick tutorial will show you how to play.',
    action: 'wait',
    duration: 3000,
    skipable: true
  },
  {
    id: 'game_modes',
    title: 'Choose Your Difficulty',
    text: 'Select Novice Mode for a gentle start, or Expert Mode for a real challenge with faster patterns and more circles!',
    highlightArea: { x: 0, y: 0, width: 0, height: 0 }, // Will be calculated dynamically
    action: 'tap'
  }
];

/**
 * Tutorial steps for the main gameplay
 */
export const gameplayTutorialSteps: TutorialStep[] = [
  {
    id: 'game_start',
    title: 'Let\'s Learn the Basics! 🎯',
    text: 'Sol Tap is a memory game where you watch patterns and repeat them. Let me show you how it works!',
    action: 'wait',
    duration: 3000
  },
  {
    id: 'watch_pattern',
    title: 'Step 1: Watch Carefully 👀',
    text: 'First, I\'ll show you a pattern by lighting up circles in sequence. Pay close attention to the order!',
    action: 'wait',
    duration: 3000
  },
  {
    id: 'repeat_pattern',
    title: 'Step 2: Repeat the Pattern 👆',
    text: 'After watching, tap the circles in the same order you saw them light up. Start with the first circle!',
    action: 'tap'
  },
  {
    id: 'circle_explanation',
    title: 'The Game Area 🟢',
    text: 'These are your game circles. When it\'s your turn, tap them in the correct order to match the pattern.',
    circleHighlight: { x: 0, y: 0, radius: 100 }, // Will be calculated dynamically
    action: 'wait',
    duration: 3000
  },
  {
    id: 'ui_explanation',
    title: 'Your Game Info 📊',
    text: 'Keep track of your current level, tokens earned, and your progress. Tokens let you retry when you make mistakes!',
    highlightArea: { x: 0, y: 0, width: 0, height: 100 }, // Will be calculated dynamically
    action: 'wait',
    duration: 3000
  },
  {
    id: 'scoring_system',
    title: 'Scoring & Rewards 🏆',
    text: 'Each level you complete earns points and tokens. Higher levels give better rewards. Don\'t worry about mistakes - you can retry!',
    action: 'wait',
    duration: 3000
  },
  {
    id: 'ready_to_play',
    title: 'Ready to Play! 🚀',
    text: 'You\'re all set! The game will start with a simple pattern. Remember: Watch first, then repeat. Good luck!',
    action: 'wait',
    duration: 2000
  }
];

/**
 * Tutorial steps for first successful pattern
 */
export const firstSuccessTutorialSteps: TutorialStep[] = [
  {
    id: 'first_success',
    title: 'Great Job! 🎉',
    text: 'Perfect! You successfully repeated the pattern. Each level will get a bit more challenging with longer patterns.',
    action: 'wait',
    duration: 2000
  },
  {
    id: 'level_progression',
    title: 'Level Up! 📈',
    text: 'As you progress, patterns will get longer and more complex. Stay focused and you\'ll master Sol Tap in no time!',
    action: 'wait',
    duration: 2000
  }
];

/**
 * Tutorial steps for first failure
 */
export const firstFailureTutorialSteps: TutorialStep[] = [
  {
    id: 'first_failure',
    title: 'No Worries! 💪',
    text: 'Making mistakes is part of learning! You can use tokens to try again, or return to the menu to select a different difficulty.',
    action: 'wait',
    duration: 3000
  },
  {
    id: 'retry_system',
    title: 'Try Again System 🔄',
    text: 'Use your tokens to retry the same level immediately, or go back to menu to start fresh. Every attempt helps you improve!',
    action: 'wait',
    duration: 2000
  }
];

/**
 * Main menu tutorial configuration
 */
export const menuTutorialConfig: TutorialConfig = {
  steps: menuTutorialSteps,
  canSkip: true,
  showProgress: true
};

/**
 * Main gameplay tutorial configuration
 */
export const gameplayTutorialConfig: TutorialConfig = {
  steps: gameplayTutorialSteps,
  canSkip: true,
  showProgress: true
};

/**
 * First success tutorial configuration
 */
export const firstSuccessConfig: TutorialConfig = {
  steps: firstSuccessTutorialSteps,
  canSkip: false,
  showProgress: false
};

/**
 * First failure tutorial configuration
 */
export const firstFailureConfig: TutorialConfig = {
  steps: firstFailureTutorialSteps,
  canSkip: false,
  showProgress: false
};

/**
 * Helper function to update tutorial steps with dynamic positions
 */
export function updateTutorialPositions(
  steps: TutorialStep[],
  screenWidth: number,
  screenHeight: number,
  circlePositions?: Array<{ x: number; y: number; radius: number }>
): TutorialStep[] {
  return steps.map(step => {
    const updatedStep = { ...step };

    // Update circle highlighting for gameplay tutorial
    if (step.id === 'circle_explanation' && circlePositions && circlePositions.length > 0) {
      updatedStep.circleHighlight = {
        x: circlePositions[0].x,
        y: circlePositions[0].y,
        radius: circlePositions[0].radius + 20 // Add some padding
      };
    }

    // Update UI highlighting areas
    if (step.id === 'ui_explanation') {
      updatedStep.highlightArea = {
        x: 20,
        y: 20,
        width: screenWidth - 40,
        height: 80
      };
    }

    // Update game mode highlighting for menu
    if (step.id === 'game_modes') {
      updatedStep.highlightArea = {
        x: screenWidth * 0.1,
        y: screenHeight * 0.45,
        width: screenWidth * 0.8,
        height: screenHeight * 0.2
      };
    }

    return updatedStep;
  });
}

/**
 * Check if user should see tutorial based on their experience
 */
export function shouldShowTutorial(tutorialType: 'menu' | 'gameplay' | 'first_success' | 'first_failure'): boolean {
  try {
    // Always show tutorial if not completed before
    const hasCompletedMain = localStorage.getItem('soltap_tutorial_completed') === 'true';

    if (!hasCompletedMain) {
      return tutorialType === 'menu' || tutorialType === 'gameplay';
    }

    // For users who completed main tutorial, show contextual tutorials
    const firstSuccess = localStorage.getItem('soltap_first_success_tutorial') === 'true';
    const firstFailure = localStorage.getItem('soltap_first_failure_tutorial') === 'true';

    switch (tutorialType) {
      case 'first_success':
        return !firstSuccess;
      case 'first_failure':
        return !firstFailure;
      default:
        return false;
    }
  } catch (error) {
    console.warn('Error checking tutorial state:', error);
    return true; // Default to showing tutorial on error
  }
}

/**
 * Mark specific tutorial as completed
 */
export function markTutorialCompleted(tutorialType: 'menu' | 'gameplay' | 'first_success' | 'first_failure'): void {
  try {
    switch (tutorialType) {
      case 'menu':
        localStorage.setItem('soltap_menu_tutorial_completed', 'true');
        break;
      case 'gameplay':
        localStorage.setItem('soltap_tutorial_completed', 'true');
        break;
      case 'first_success':
        localStorage.setItem('soltap_first_success_tutorial', 'true');
        break;
      case 'first_failure':
        localStorage.setItem('soltap_first_failure_tutorial', 'true');
        break;
    }
  } catch (error) {
    console.warn('Error saving tutorial completion:', error);
  }
}