import { PillType, TileType } from "./types";

export const TILE_SIZE = 48; // px
export const MAP_WIDTH = 50;
export const MAP_HEIGHT = 50;

export const TICKS_PER_SECOND = 60;
export const DAY_LENGTH = 12000; // Ticks per day

export const STAT_DECAY_RATE = {
  hunger: 0.05,
  thirst: 0.08,
  stamina: 0.5, // Regen
};

export const COLORS = {
  [TileType.WATER]: '#1e40af', // blue-800
  [TileType.SAND]: '#fde047', // yellow-300
  [TileType.GRASS]: '#166534', // green-800
  [TileType.TREE]: '#064e3b', // emerald-900
  [TileType.WRECKAGE]: '#7f1d1d', // red-900
  [TileType.ROCK]: '#57534e', // stone-600
};

export const PILL_CONFIG = {
  [PillType.RED]: {
    saturation: 0, // Grayscale start
    contrast: 1.2,
    brightness: 0.8,
    music: 'oppressive',
    uiAccuracy: 1.0, // 100% accurate
  },
  [PillType.BLUE]: {
    saturation: 1.5, // Vibrant
    contrast: 1.0,
    brightness: 1.1,
    music: 'relaxed',
    uiAccuracy: 0.0, // Deceptive
  }
};