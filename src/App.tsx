import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/config';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (fn: () => void) => void;
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
      window.Telegram.WebApp.expand();
    }

    // Initialize Phaser game
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game({
        ...gameConfig,
        parent: 'game-container'
      });
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full bg-black">
      <div id="game-container" className="w-full h-full" />
    </div>
  );
}

export default App;
