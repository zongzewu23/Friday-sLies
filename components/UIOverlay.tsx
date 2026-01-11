import React from 'react';
import { GameState, ItemType, PillType } from '../types';
import { Heart, Droplets, Drumstick, Zap, Backpack } from 'lucide-react';

interface UIOverlayProps {
  state: GameState;
  onConsume: (index: number) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ state, onConsume }) => {
  const { displayStats, inventory } = state.player;
  
  // Blue pill style override
  const isBlue = state.pill === PillType.BLUE;
  const barColor = (val: number) => {
      if (isBlue) return 'bg-blue-400';
      return val < 30 ? 'bg-red-600' : 'bg-green-600';
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
      {/* Top Bar: Stats */}
      <div className={`flex gap-4 p-2 rounded-lg border-2 border-opacity-50 pointer-events-auto ${isBlue ? 'bg-white/20 border-white text-white shadow-[0_0_15px_rgba(0,255,255,0.5)]' : 'bg-black/70 border-gray-600 text-gray-300'}`}>
        <StatBar icon={<Heart size={16} />} value={displayStats.health} max={100} color={isBlue ? 'bg-pink-400' : 'bg-red-600'} label="HP" />
        <StatBar icon={<Drumstick size={16} />} value={displayStats.hunger} max={100} color={isBlue ? 'bg-yellow-400' : 'bg-orange-500'} label="HUN" />
        <StatBar icon={<Droplets size={16} />} value={displayStats.thirst} max={100} color={isBlue ? 'bg-cyan-400' : 'bg-blue-500'} label="H2O" />
        <StatBar icon={<Zap size={16} />} value={displayStats.stamina} max={100} color={isBlue ? 'bg-purple-400' : 'bg-yellow-300'} label="STA" />
      </div>

      {/* Messages */}
      <div className="flex flex-col items-start gap-1">
          {state.messages.slice().reverse().map((msg, i) => (
              <span key={i} className={`px-2 py-1 rounded text-sm ${isBlue ? 'bg-blue-500/50 text-white' : 'bg-black/60 text-red-200'} animate-fade-in`}>
                  {isBlue ? `Friday: ${msg}` : `> ${msg}`}
              </span>
          ))}
      </div>

      {/* Bottom Bar: Inventory */}
      <div className={`mt-auto self-center p-2 rounded-lg border-2 pointer-events-auto ${isBlue ? 'bg-white/20 border-white' : 'bg-black/80 border-gray-600'}`}>
        <div className="flex items-center gap-2 mb-1 text-xs uppercase tracking-widest font-bold">
            <Backpack size={14} /> Inventory
        </div>
        <div className="flex gap-2">
            {inventory.length === 0 && <span className="text-xs opacity-50 italic">Empty...</span>}
            {inventory.map((item, idx) => (
                <button 
                    key={idx}
                    onClick={() => onConsume(idx)}
                    className="w-10 h-10 border border-gray-500 bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-lg rounded relative group"
                    title={`Click to use ${item}`}
                >
                    {getItemIcon(item)}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {item}
                    </span>
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

const StatBar = ({ icon, value, max, color, label }: any) => (
  <div className="flex flex-col w-24">
      <div className="flex justify-between text-xs mb-1 font-bold">
          <span className="flex items-center gap-1">{icon} {label}</span>
          <span>{Math.floor(value)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
          <div className={`h-full transition-all duration-500 ${color}`} style={{ width: `${(value / max) * 100}%` }}></div>
      </div>
  </div>
);

const getItemIcon = (type: ItemType) => {
    switch(type) {
        case ItemType.COCONUT: return '🥥';
        case ItemType.MEAT: return '🍖';
        case ItemType.MEDKIT: return '💊';
        case ItemType.WOOD: return '🪵';
        case ItemType.SPEAR: return '🔱';
        default: return '?';
    }
}

export default UIOverlay;