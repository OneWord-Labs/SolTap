export type PatternType = 'tap' | 'hold' | 'rapid';
export type DifficultyMode = 'novice' | 'expert';
export type GameMode = 'normal'; // Practice mode removed - out of scope

export interface Pattern {
  index: number;
  type: PatternType;
  duration?: number; // For hold patterns
  count?: number;    // For rapid tap patterns
}

export interface CircleConfig {
  x: number;
  y: number;
  radius: number;
  color: number;
}

export interface GameState {
  difficulty: DifficultyMode;
  score: number;
  bestScore: number;
  isPlaying: boolean;
  gameMode: GameMode;
  // Practice Mode removed - out of scope
}

// Practice Mode removed - out of scope

// State persistence types
export interface SavedGameState {
  // Game progress
  currentLevel: number;
  score: number;
  coins: number;
  difficulty: DifficultyMode;
  gameMode: GameMode;
  // Practice Mode removed - out of scope

  // Current pattern state
  patterns: Pattern[];
  playerPattern: Pattern[];
  patternIndex: number;

  // Game timing and state
  canInput: boolean;
  isShowingPattern: boolean;

  // User information
  userName: string;
  userId?: number;

  // Timestamp for save validation
  savedAt: number;
  version: string;
}

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  stateError?: import('./utils/StateErrorHandler').StateError;
}

export interface GameStateStorageInterface {
  saveGame(state: SavedGameState): Promise<StorageResult<void>>;
  loadGame(): Promise<StorageResult<SavedGameState>>;
  hasSavedGame(): boolean;
  clearSavedGame(): StorageResult<void>;
  validateSavedGame(state: SavedGameState): boolean;
}
