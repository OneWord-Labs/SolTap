import React, { useEffect, useRef } from 'react';
    import Phaser from 'phaser';
    import { gameConfig } from './game/config';

    function App() {
      const gameRef = useRef<Phaser.Game | null>(null);

      useEffect(() => {
        gameRef.current = new Phaser.Game(gameConfig);

        return () => {
          if (gameRef.current) {
            gameRef.current.destroy(true);
          }
        };
      }, []);

      return (
        <div className="w-full h-screen bg-black">
          <div id="game-container" className="w-full h-full" />
        </div>
      );
    }

    export default App;
