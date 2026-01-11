import React, { useRef, useEffect } from 'react';
import { EntityType, GameState, PillType, TileType } from '../types';
import { TILE_SIZE, COLORS, PILL_CONFIG, MAP_WIDTH, MAP_HEIGHT } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas sizing
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // --- RENDER LOOP ---
    const render = () => {
      if (!ctx) return;

      // 1. Clear & Background
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Camera Calculation
      // Center the player on the screen
      const screenCenterX = canvas.width / 2;
      const screenCenterY = canvas.height / 2;
      
      const cameraX = gameState.player.pos.x * TILE_SIZE - screenCenterX + (TILE_SIZE / 2);
      const cameraY = gameState.player.pos.y * TILE_SIZE - screenCenterY + (TILE_SIZE / 2);

      // 3. Apply Visual Filter (Red/Blue Pill)
      const config = PILL_CONFIG[gameState.pill];
      // NOTE: Canvas filter is slow on some browsers, using globalCompositeOperation or fillRect overlay might be faster, 
      // but filter is easiest for prototype.
      ctx.filter = `saturate(${config.saturation}) contrast(${config.contrast}) brightness(${config.brightness})`;

      ctx.save();
      // Translate context to simulate camera
      ctx.translate(-cameraX, -cameraY);

      // 4. Draw Map (Optimization: Only draw visible tiles)
      const startCol = Math.floor(cameraX / TILE_SIZE);
      const endCol = startCol + (canvas.width / TILE_SIZE) + 1;
      const startRow = Math.floor(cameraY / TILE_SIZE);
      const endRow = startRow + (canvas.height / TILE_SIZE) + 1;

      for (let y = Math.max(0, startRow); y < Math.min(MAP_HEIGHT, endRow); y++) {
        for (let x = Math.max(0, startCol); x < Math.min(MAP_WIDTH, endCol); x++) {
          const tile = gameState.map[y][x];
          
          // Draw Tile
          ctx.fillStyle = COLORS[tile] || '#000';
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

          // Tile Detail (Simple pixel patterns)
          if (tile === TileType.GRASS) {
             ctx.fillStyle = '#14532d'; // darker green detail
             ctx.fillRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, 4, 4);
             ctx.fillRect(x * TILE_SIZE + 20, y * TILE_SIZE + 24, 4, 4);
          } else if (tile === TileType.WATER) {
             ctx.fillStyle = '#1e3a8a'; 
             ctx.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 8, 8, 2);
          }
        }
      }

      // 5. Draw Items
      gameState.items.forEach(item => {
        // In Blue Pill, check if item is fake? For now, render all.
        // Or if Blue Pill, maybe render items brighter/sparkly?
        const x = item.pos.x * TILE_SIZE;
        const y = item.pos.y * TILE_SIZE;
        
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let emoji = '📦';
        switch(item.type) {
            case 'COCONUT': emoji = '🥥'; break;
            case 'MEAT': emoji = '🍖'; break;
            case 'MEDKIT': emoji = '💊'; break;
            case 'WOOD': emoji = '🪵'; break;
        }
        ctx.fillText(emoji, x + TILE_SIZE/2, y + TILE_SIZE/2);
      });

      // 6. Draw Entities (Mobs)
      gameState.entities.forEach(entity => {
        // Visibility Check for Blue Pill
        if (gameState.pill === PillType.BLUE && !entity.visibleInBlue) return;

        const x = entity.pos.x * TILE_SIZE;
        const y = entity.pos.y * TILE_SIZE;

        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let emoji = '👾';
        if (entity.type === EntityType.CRAB) emoji = '🦀';
        if (entity.type === EntityType.BOAR) emoji = '🐗';
        if (entity.type === EntityType.BOSS) emoji = '🐊';

        ctx.fillText(emoji, x + TILE_SIZE/2, y + TILE_SIZE/2);
        
        // HP Bar for mob
        ctx.fillStyle = 'red';
        ctx.fillRect(x + 4, y - 6, TILE_SIZE - 8, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(x + 4, y - 6, (TILE_SIZE - 8) * (entity.hp / entity.maxHp), 4);
      });

      // 7. Draw Player
      const px = gameState.player.pos.x * TILE_SIZE;
      const py = gameState.player.pos.y * TILE_SIZE;
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(px + TILE_SIZE/2, py + TILE_SIZE - 4, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sprite
      ctx.font = '36px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Flip if facing left
      ctx.save();
      if (gameState.player.facing === 'left') {
          ctx.translate(px + TILE_SIZE/2, py + TILE_SIZE/2);
          ctx.scale(-1, 1);
          ctx.fillText('🧍', 0, 0);
      } else {
          ctx.fillText('🧍', px + TILE_SIZE/2, py + TILE_SIZE/2);
      }
      ctx.restore();

      // 8. Draw Friday (The Illusion)
      if (gameState.pill === PillType.BLUE) {
          const fx = px + 40 + Math.sin(Date.now() / 500) * 10;
          const fy = py - 40 + Math.cos(Date.now() / 500) * 10;
          ctx.font = '24px serif';
          ctx.fillText('🏐', fx, fy);
          ctx.fillStyle = 'white';
          ctx.font = '10px monospace';
          ctx.fillText('Friday', fx, fy - 15);
      }

      // Restore camera
      ctx.restore();

      // 9. Day/Night Cycle Overlay (No filter here to keep UI clean, but applied over map)
      // Actually, we applied filter to context, so everything drawn is filtered. 
      // Let's reset filter for UI elements drawn on canvas if any.
      ctx.filter = 'none';

      // Vignette / Darkness
      if (gameState.pill === PillType.RED) {
          // Night time logic? 
          // Simple vignette for "oppressive" atmosphere
          const grad = ctx.createRadialGradient(screenCenterX, screenCenterY, 150, screenCenterX, screenCenterY, canvas.height);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.8)');
          ctx.fillStyle = grad;
          ctx.fillRect(0,0, canvas.width, canvas.height);
      } else {
          // Sunny vignette
          const grad = ctx.createRadialGradient(screenCenterX, screenCenterY, 200, screenCenterX, screenCenterY, canvas.height);
          grad.addColorStop(0, 'rgba(255,255,200,0)');
          grad.addColorStop(1, 'rgba(0,100,255,0.1)');
          ctx.fillStyle = grad;
          ctx.fillRect(0,0, canvas.width, canvas.height);
      }
    };

    render();

  }, [gameState]); // Re-render when game state updates (from the React loop)

  return <canvas ref={canvasRef} className="block w-full h-full" />;
};

export default GameCanvas;