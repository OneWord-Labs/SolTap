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
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0,
        padding: '1rem',
        background: '#4CAF50',
        color: 'white',
        textAlign: 'center',
        zIndex: 1000
      }}>
        <h1 style={{ margin: 0 }}>Preview Environment Test</h1>
        <p style={{ margin: '0.5rem 0 0' }}>
          Testing preview deployment - {import.meta.env.VITE_ENVIRONMENT}
        </p>
      </div>
      <div id="game-container" style={{ marginTop: '100px' }} />
    </div>
  );
}

export default App;
