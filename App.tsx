import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, GameState, PillType } from './types';
import { createInitialState, updateGameState, movePlayer, consumeItem } from './services/engine';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import { Play, Skull, RefreshCw, Info } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeMenu, setActiveMenu] = useState<'MAIN' | 'DEATH'>('MAIN');
  
  // Game Loop Ref to hold state between frames without re-rendering everything constantly
  // However, for React simplicity in this prototype, we will trigger re-renders 
  // on a fixed tick, but use refs for input handling to ensure responsiveness.
  const stateRef = useRef<GameState | null>(null);
  
  // Sync Ref with State
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  const startGame = (pill: PillType) => {
    const initial = createInitialState(pill);
    setGameState(initial);
    setActiveMenu('MAIN'); // Hide menu (logic handled by !gameState check)
  };

  const resetGame = () => {
    setGameState(null);
    setActiveMenu('MAIN');
  };

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!stateRef.current || stateRef.current.mode !== GameMode.PLAYING) return;

      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowUp' || e.key === 'w') dy = -1;
      if (e.key === 'ArrowDown' || e.key === 's') dy = 1;
      if (e.key === 'ArrowLeft' || e.key === 'a') dx = -1;
      if (e.key === 'ArrowRight' || e.key === 'd') dx = 1;

      if (dx !== 0 || dy !== 0) {
        setGameState(prev => prev ? movePlayer(prev, dx, dy) : null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Game Loop
  useEffect(() => {
    if (!gameState || gameState.mode !== GameMode.PLAYING) return;

    const loop = setInterval(() => {
       setGameState(prev => {
         if (!prev) return null;
         return updateGameState(prev, Date.now());
       });
    }, 1000 / 30); // 30 FPS logic updates

    return () => clearInterval(loop);
  }, [gameState?.mode]); // Only restart loop if mode changes

  const handleConsume = (index: number) => {
      setGameState(prev => prev ? consumeItem(prev, index) : null);
  };

  // --- RENDER ---

  // 1. Main Menu
  if (!gameState) {
    return (
      <div className="relative w-screen h-screen bg-black flex items-center justify-center overflow-hidden">
        {/* Background animation abstract */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/island/1920/1080')] bg-cover filter grayscale blur-sm"></div>
        
        <div className="z-10 text-center max-w-2xl p-8 bg-black/80 border-4 border-double border-gray-600 rounded-xl shadow-2xl">
          <h1 className="text-6xl text-white mb-2 font-['VT323'] tracking-widest text-shadow-red">FRIDAY'S LIES</h1>
          <p className="text-gray-400 mb-8 italic">"Loneliness is the only truth."</p>

          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Red Pill */}
            <button 
              onClick={() => startGame(PillType.RED)}
              className="group flex flex-col items-center gap-4 p-6 border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 transition-all rounded-lg"
            >
              <div className="w-16 h-8 rounded-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)] group-hover:scale-110 transition-transform"></div>
              <h3 className="text-red-400 text-2xl font-bold">RED PILL</h3>
              <p className="text-xs text-red-200/60 max-w-[200px]">Reality. Pain. Truth. <br/>Experience survival as it truly is.</p>
            </button>

            {/* Blue Pill */}
            <button 
              onClick={() => startGame(PillType.BLUE)}
              className="group flex flex-col items-center gap-4 p-6 border border-blue-900/50 bg-blue-950/20 hover:bg-blue-900/40 transition-all rounded-lg"
            >
              <div className="w-16 h-8 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] group-hover:scale-110 transition-transform"></div>
              <h3 className="text-blue-400 text-2xl font-bold">BLUE PILL</h3>
              <p className="text-xs text-blue-200/60 max-w-[200px]">Illusion. Comfort. Lies. <br/>A pleasant vacation until the end.</p>
            </button>
          </div>
          
          <div className="text-xs text-gray-600 font-mono mt-4 border-t border-gray-800 pt-4">
             WASD / Arrows to Move • Survival Mechanics • Permadeath
          </div>
        </div>
      </div>
    );
  }

  // 2. Game Over Screen
  if (gameState.mode === GameMode.GAME_OVER) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-red-600 font-mono">
        <Skull size={64} className="mb-4 animate-pulse" />
        <h1 className="text-4xl mb-4">YOU SUCCUMBED</h1>
        <p className="text-gray-400 mb-8">The island claims another soul.</p>
        
        <div className="mb-8 p-4 bg-gray-900 rounded border border-gray-800">
           <p>Real Health: {gameState.player.realStats.health.toFixed(0)}</p>
           <p>Days Survived: {gameState.dayCount}</p>
        </div>

        <button 
          onClick={resetGame}
          className="flex items-center gap-2 px-6 py-3 bg-red-900 hover:bg-red-800 text-white rounded transition-colors"
        >
          <RefreshCw size={20} /> Try Again
        </button>
      </div>
    );
  }

  // 3. Gameplay
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none">
      <div className="scanline"></div>
      
      {/* Game View */}
      <GameCanvas gameState={gameState} />
      
      {/* UI Layer */}
      <UIOverlay state={gameState} onConsume={handleConsume} />
    </div>
  );
};

export default App;