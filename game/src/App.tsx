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
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();

    // Initialize Phaser
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);
    }

    // Cleanup
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div>
      <div style={{ position: 'fixed', top: 0, left: 0, padding: '1rem', background: '#000', color: '#fff' }}>
        Test Preview Deployment
      </div>
      <div id="game-container" />
    </div>
  );
}

export default App;
