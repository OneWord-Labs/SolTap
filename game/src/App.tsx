import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from './game/scenes/MainScene';
import { MenuScene } from './game/scenes/MenuScene';
import { GAME_CONFIG } from './game/constants';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready(): void;
        close(): void;
        sendData(data: string): void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
            first_name: string;
          };
        };
      };
    };
  }
}

function App() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      console.log('Telegram WebApp initialized with user:', window.Telegram.WebApp.initDataUnsafe.user);
    }

    // Initialize game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'game-container',
      backgroundColor: '#1e1e1e',
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scene: [MenuScene, MainScene]
    };

    // Create game instance if it doesn't exist
    if (!gameRef.current) {
      console.log('Creating new game instance');
      gameRef.current = new Phaser.Game(config);
    }

    // Clean up on unmount
    return () => {
      if (gameRef.current) {
        console.log('Destroying game instance');
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div id="game-container" className="w-full h-full bg-[#1e1e1e]">
      {/* Game will be mounted here */}
    </div>
  );
}

export default App;
