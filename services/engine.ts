import { Coordinates, Entity, EntityType, GameState, GameMode, Item, ItemType, PillType, Stats, TileType } from "../types";
import { MAP_HEIGHT, MAP_WIDTH, STAT_DECAY_RATE } from "../constants";

// Helper for unique IDs
const uuid = () => Math.random().toString(36).substring(2, 9);

// Procedural Map Generation
export const generateMap = (width: number, height: number): TileType[][] => {
  const map: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.WATER));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Simple island generation logic
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const noise = Math.random() * 5; // Add noise

      if (dist < 8 + noise) {
        map[y][x] = Math.random() > 0.8 ? TileType.ROCK : TileType.TREE;
      } else if (dist < 15 + noise) {
        map[y][x] = TileType.GRASS;
      } else if (dist < 20 + noise) {
        map[y][x] = TileType.SAND;
      } else {
        map[y][x] = TileType.WATER;
      }
    }
  }

  // Place Wreckage
  map[Math.floor(height/2) + 12][Math.floor(width/2)] = TileType.WRECKAGE;

  return map;
};

// Initial State Factory
export const createInitialState = (pill: PillType): GameState => {
  const map = generateMap(MAP_WIDTH, MAP_HEIGHT);
  
  // Center player
  const playerPos = { x: Math.floor(MAP_WIDTH / 2), y: Math.floor(MAP_HEIGHT / 2) };
  // Find valid spot
  let radius = 0;
  while (map[playerPos.y][playerPos.x] === TileType.WATER || map[playerPos.y][playerPos.x] === TileType.TREE) {
     playerPos.x = Math.floor(MAP_WIDTH / 2) + Math.floor((Math.random() - 0.5) * radius);
     playerPos.y = Math.floor(MAP_HEIGHT / 2) + Math.floor((Math.random() - 0.5) * radius);
     radius++;
  }

  // Spawn initial entities
  const entities: Entity[] = [];
  // Add some crabs
  for(let i=0; i<5; i++) {
    entities.push({
      id: uuid(),
      type: EntityType.CRAB,
      pos: findValidSpawn(map),
      hp: 20,
      maxHp: 20,
      damage: 5,
      isHostile: true,
      visibleInBlue: true,
      lastMove: 0,
      moveSpeed: 1000, // Slow
    });
  }
  // Add some boars
  for(let i=0; i<3; i++) {
    entities.push({
      id: uuid(),
      type: EntityType.BOAR,
      pos: findValidSpawn(map),
      hp: 50,
      maxHp: 50,
      damage: 15,
      isHostile: true,
      visibleInBlue: Math.random() > 0.5, // 50% chance to be invisible in Blue Pill
      lastMove: 0,
      moveSpeed: 800,
    });
  }

  // Initial Items
  const items: Item[] = [];
  for(let i=0; i<10; i++) {
    items.push({ id: uuid(), type: ItemType.COCONUT, pos: findValidSpawn(map), isFake: false });
  }

  // Start with lower stats if Red Pill, higher if Blue Pill
  const initialHealth = pill === PillType.RED ? 60 : 100;

  return {
    mode: GameMode.PLAYING,
    pill,
    map,
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tick: 0,
    player: {
      pos: playerPos,
      realStats: { health: initialHealth, hunger: 80, thirst: 80, stamina: 100 },
      displayStats: { health: 100, hunger: 100, thirst: 100, stamina: 100 },
      inventory: [],
      facing: 'right',
    },
    entities,
    items,
    messages: ["Welcome to the island.", pill === PillType.BLUE ? "It's a beautiful day!" : "Survive."],
    dayCount: 1,
    timeOfDay: 800, // Morning
  };
};

const findValidSpawn = (map: TileType[][]): Coordinates => {
  let x, y;
  do {
    x = Math.floor(Math.random() * MAP_WIDTH);
    y = Math.floor(Math.random() * MAP_HEIGHT);
  } while (map[y][x] === TileType.WATER || map[y][x] === TileType.TREE || map[y][x] === TileType.ROCK);
  return { x, y };
};

const isSolid = (tile: TileType) => {
  return tile === TileType.TREE || tile === TileType.ROCK || tile === TileType.WATER || tile === TileType.WRECKAGE;
};

// --- GAME UPDATE LOGIC ---

export const updateGameState = (state: GameState, now: number): GameState => {
  if (state.mode !== GameMode.PLAYING) return state;

  const newState = { ...state, tick: state.tick + 1, timeOfDay: (state.timeOfDay + 1) % 2400 };
  
  // 1. Stat Decay
  if (newState.tick % 60 === 0) { // Every second approx
    decayStats(newState);
  }

  // 2. Entity AI
  newState.entities = newState.entities.map(entity => updateEntityAI(entity, newState, now));

  // 3. Update Display Stats (The Lie)
  updateDisplayStats(newState);

  // 4. Check Death
  if (newState.player.realStats.health <= 0) {
    newState.mode = GameMode.GAME_OVER;
    newState.messages.push("You succumbed to the island.");
  }

  return newState;
};

const decayStats = (state: GameState) => {
  const { realStats } = state.player;
  
  // Decay Hunger/Thirst
  realStats.hunger = Math.max(0, realStats.hunger - STAT_DECAY_RATE.hunger);
  realStats.thirst = Math.max(0, realStats.thirst - STAT_DECAY_RATE.thirst);

  // Damage if starving/dehydrated
  if (realStats.hunger <= 0) realStats.health -= 0.5;
  if (realStats.thirst <= 0) realStats.health -= 1.0;

  // Stamina regen
  if (realStats.hunger > 20 && realStats.thirst > 20) {
    realStats.stamina = Math.min(100, realStats.stamina + STAT_DECAY_RATE.stamina);
  }
};

const updateDisplayStats = (state: GameState) => {
  if (state.pill === PillType.RED) {
    // Red Pill: Display is reality
    state.player.displayStats = { ...state.player.realStats };
  } else {
    // Blue Pill: The lie. 
    // Always show high stats unless CRITICAL (e.g. < 10 real health)
    const { realStats } = state.player;
    
    state.player.displayStats.health = realStats.health < 20 ? realStats.health + 20 : 100;
    state.player.displayStats.hunger = realStats.hunger < 10 ? 30 : 90 + Math.sin(state.tick * 0.05) * 5;
    state.player.displayStats.thirst = realStats.thirst < 10 ? 30 : 90 + Math.cos(state.tick * 0.05) * 5;
    state.player.displayStats.stamina = 100;
  }
};

const updateEntityAI = (entity: Entity, state: GameState, now: number): Entity => {
  if (now - entity.lastMove < entity.moveSpeed) return entity;

  const distToPlayer = Math.hypot(state.player.pos.x - entity.pos.x, state.player.pos.y - entity.pos.y);
  let newPos = { ...entity.pos };

  // AI Logic
  if (entity.isHostile && distToPlayer < 6) {
    // Chase
    const dx = Math.sign(state.player.pos.x - entity.pos.x);
    const dy = Math.sign(state.player.pos.y - entity.pos.y);
    
    // Simple pathfinding (move random axis)
    if (Math.random() > 0.5) newPos.x += dx;
    else newPos.y += dy;

    // Attack range
    if (distToPlayer <= 1.5) {
      state.player.realStats.health -= entity.damage;
      state.messages.push(`The ${entity.type.toLowerCase()} attacked you!`);
      return { ...entity, lastMove: now + 500 }; // Attack cooldown
    }

  } else {
    // Wander
    const dir = Math.floor(Math.random() * 4);
    if (dir === 0) newPos.y--;
    else if (dir === 1) newPos.y++;
    else if (dir === 2) newPos.x--;
    else if (dir === 3) newPos.x++;
  }

  // Collision check for entity
  if (
    newPos.x >= 0 && newPos.x < MAP_WIDTH &&
    newPos.y >= 0 && newPos.y < MAP_HEIGHT &&
    !isSolid(state.map[newPos.y][newPos.x])
  ) {
    return { ...entity, pos: newPos, lastMove: now };
  }

  return { ...entity, lastMove: now };
};

export const movePlayer = (state: GameState, dx: number, dy: number): GameState => {
  if (state.mode !== GameMode.PLAYING) return state;

  const newX = state.player.pos.x + dx;
  const newY = state.player.pos.y + dy;

  // Bounds
  if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return state;

  // Solid check
  if (isSolid(state.map[newY][newX])) {
    return state;
  }

  // Interaction check (Items)
  let newItems = [...state.items];
  let inventory = [...state.player.inventory];
  let messages = [...state.messages];
  const itemIndex = newItems.findIndex(i => i.pos.x === newX && i.pos.y === newY);

  if (itemIndex >= 0) {
    const item = newItems[itemIndex];
    if (state.pill === PillType.BLUE && item.isFake) {
       messages.push("You picked up... nothing?");
    } else {
       inventory.push(item.type);
       messages.push(`Picked up ${item.type}`);
    }
    newItems.splice(itemIndex, 1);
  }

  return {
    ...state,
    player: {
      ...state.player,
      pos: { x: newX, y: newY },
      inventory,
      facing: dx > 0 ? 'right' : dx < 0 ? 'left' : state.player.facing
    },
    items: newItems,
    messages: messages.slice(-5) // Keep last 5
  };
};

export const consumeItem = (state: GameState, index: number): GameState => {
    const itemType = state.player.inventory[index];
    const newInventory = [...state.player.inventory];
    newInventory.splice(index, 1);
    
    const { realStats } = state.player;
    
    switch (itemType) {
        case ItemType.COCONUT:
            realStats.thirst = Math.min(100, realStats.thirst + 20);
            realStats.hunger = Math.min(100, realStats.hunger + 5);
            break;
        case ItemType.MEAT:
            realStats.hunger = Math.min(100, realStats.hunger + 30);
             // Raw meat hurts a bit
            realStats.health = Math.max(0, realStats.health - 5);
            break;
        case ItemType.MEDKIT:
            realStats.health = Math.min(100, realStats.health + 50);
            break;
    }

    return {
        ...state,
        player: { ...state.player, inventory: newInventory, realStats }
    };
}
