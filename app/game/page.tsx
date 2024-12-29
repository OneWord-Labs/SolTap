'use client';

import React, { useEffect } from 'react';

export default function GamePage() {
  useEffect(() => {
    // Initialize Telegram game
    const tg = (window as any).Telegram.WebApp;
    if (tg) {
      tg.ready();
      // You can expand game functionality here
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Game Test</h1>
      <div className="flex flex-col items-center gap-4">
        <p className="text-xl">Your game will be here!</p>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => {
            // Add game start logic here
            alert('Game starting...');
          }}
        >
          Start Game
        </button>
      </div>
    </main>
  );
} 