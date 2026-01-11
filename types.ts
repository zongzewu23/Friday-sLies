export enum GameMode {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum PillType {
  RED = 'RED',
  BLUE = 'BLUE'
}

export enum TileType {
  WATER = 0,
  SAND = 1,
  GRASS = 2,
  TREE = 3,
  WRECKAGE = 4,
  ROCK = 5
}

export enum EntityType {
  PLAYER = 'PLAYER',
  CRAB = 'CRAB',
  BOAR = 'BOAR',
  BOSS = 'BOSS',
  FRIDAY = 'FRIDAY'
}

export enum ItemType {
  COCONUT = 'COCONUT', // +Water
  MEAT = 'MEAT',       // +Food
  MEDKIT = 'MEDKIT',   // +Health
  FAKE_WATER = 'FAKE_WATER', // Looks like water, gives nothing (Blue pill)
  WOOD = 'WOOD',
  SPEAR = 'SPEAR'
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Stats {
  health: number;
  hunger: number;
  thirst: number;
  stamina: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Coordinates;
  hp: number;
  maxHp: number;
  damage: number;
  isHostile: boolean;
  visibleInBlue: boolean; // Some enemies might be invisible in Blue Pill
  lastMove: number; // Timestamp for movement cooldown
  moveSpeed: number; // ms per tile
}

export interface Item {
  id: string;
  type: ItemType;
  pos: Coordinates;
  isFake: boolean; // Only exists in Blue Pill illusion
}

export interface GameState {
  mode: GameMode;
  pill: PillType;
  map: TileType[][];
  width: number;
  height: number;
  tick: number;
  
  player: {
    pos: Coordinates;
    realStats: Stats;
    displayStats: Stats; // The stats shown to the user (deceptive in Blue Pill)
    inventory: ItemType[];
    facing: 'left' | 'right';
  };

  entities: Entity[];
  items: Item[];
  
  messages: string[]; // Log messages
  dayCount: number;
  timeOfDay: number; // 0-2400
}