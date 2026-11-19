// 障碍物和金币类

import { OBSTACLE_TYPES, COIN_CONFIG } from './config.js';

// 基础物品类
export class GameObject {
  constructor(x, z, lane) {
    this.x = x;
    this.y = 0;
    this.z = z;
    this.lane = lane;
    this.active = true;
  }

  update(deltaTime, speed) {
    this.z -= speed * deltaTime * 60;
  }

  reset(x, z, lane) {
    this.x = x;
    this.y = 0;
    this.z = z;
    this.lane = lane;
    this.active = true;
  }
}

// 障碍物类
export class Obstacle extends GameObject {
  constructor(x, z, lane, config) {
    super(x, z, lane);
    this.config = config;
    this.type = 'obstacle';
  }

  reset(x, z, lane, config) {
    super.reset(x, z, lane);
    this.config = config;
  }

  // 检查是否需要跳跃
  needsJump() {
    return this.config.type === 'bamboo' || this.config.type === 'stone';
  }

  // 检查是否可以下蹲躲避
  canSlideAvoid() {
    return this.config.canSlide;
  }

  // 获取碰撞边界
  getBounds() {
    return {
      x: this.x - this.config.width / 2,
      y: 0,
      width: this.config.width,
      height: this.config.height
    };
  }
}

// 金币类
export class Coin extends GameObject {
  constructor(x, z, lane) {
    super(x, z, lane);
    this.config = COIN_CONFIG;
    this.type = 'coin';
    this.collected = false;
    this.rotation = 0;
    this.bobOffset = 0;
    this.animTimer = Math.random() * Math.PI * 2; // 随机初始相位
  }

  reset(x, z, lane) {
    super.reset(x, z, lane);
    this.collected = false;
    this.rotation = 0;
  }

  update(deltaTime, speed) {
    super.update(deltaTime, speed);
    this.animTimer += deltaTime * 5;
    this.rotation += deltaTime * 3;
    this.bobOffset = Math.sin(this.animTimer) * 5;
  }

  // 获取碰撞边界
  getBounds() {
    return {
      x: this.x - this.config.width / 2,
      y: 20 + this.bobOffset,
      width: this.config.width,
      height: this.config.height
    };
  }
}

// 通用对象池
export class ObjectPool {
  constructor(createFn, initialSize = 20) {
    this.createFn = createFn;
    this.pool = [];
    this.active = [];

    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  // 获取对象
  get(...args) {
    let obj;
    if (this.pool.length > 0) {
      obj = this.pool.pop();
      obj.reset(...args);
    } else {
      obj = this.createFn();
      obj.reset(...args);
    }
    this.active.push(obj);
    return obj;
  }

  // 回收对象
  recycle(obj) {
    obj.active = false;
    const index = this.active.indexOf(obj);
    if (index > -1) {
      this.active.splice(index, 1);
    }
    this.pool.push(obj);
  }

  // 清空所有
  clear() {
    while (this.active.length > 0) {
      this.recycle(this.active[0]);
    }
  }
}

// 障碍物对象池
export class ObstaclePool extends ObjectPool {
  constructor(size = 30) {
    super(() => new Obstacle(0, 0, 0, OBSTACLE_TYPES.BAMBOO), size);
  }
}

// 金币对象池
export class CoinPool extends ObjectPool {
  constructor(size = 50) {
    super(() => new Coin(0, 0, 0), size);
  }
}

// 障碍物生成器
export class ObstacleSpawner {
  constructor() {
    this.reset();
  }

  reset() {
    this.nextObstacleZ = 550;
    this.nextCoinZ = 550;
    this.density = 0.5;         // 障碍物密度
    this.minGap = 100;          // 最小间距
    this.difficulty = 0;        // 难度值
  }

  // 更新难度
  updateDifficulty(deltaTime, speed) {
    this.difficulty += deltaTime * speed * 0.01;
    this.density = Math.min(0.85, 0.5 + this.difficulty * 0.02);
    this.minGap = Math.max(60, 100 - this.difficulty * 2);
  }

  // 生成障碍物
  spawnObstacles(obstaclePool, currentZ) {
    if (currentZ < this.nextObstacleZ) {
      return [];
    }

    const spawned = [];

    // 随机选择安全通道
    const safeLane = Math.floor(Math.random() * 3);

    // 在每个赛道决定是否放置障碍物
    for (let lane = 0; lane < 3; lane++) {
      if (lane === safeLane) continue;
      if (Math.random() > this.density) continue;

      const types = Object.values(OBSTACLE_TYPES);
      const type = types[Math.floor(Math.random() * types.length)];
      const x = (lane - 1) * 80; // LANE_WIDTH
      spawned.push(obstaclePool.get(x, this.nextObstacleZ, lane, type));
    }

    // 如果没有生成任何障碍物，强制在一个非安全通道生成
    if (spawned.length === 0) {
      let forcedLane = Math.floor(Math.random() * 3);
      while (forcedLane === safeLane) {
        forcedLane = Math.floor(Math.random() * 3);
      }
      const types = Object.values(OBSTACLE_TYPES);
      const type = types[Math.floor(Math.random() * types.length)];
      const x = (forcedLane - 1) * 80;
      spawned.push(obstaclePool.get(x, this.nextObstacleZ, forcedLane, type));
    }

    this.nextObstacleZ += this.minGap + Math.random() * 40;
    return spawned;
  }

  // 生成金币
  spawnCoins(coinPool, currentZ) {
    if (currentZ < this.nextCoinZ) {
      return [];
    }

    const spawned = [];
    const pattern = Math.floor(Math.random() * 4);

    switch (pattern) {
      case 0: // 单个金币
        {
          const lane = Math.floor(Math.random() * 3);
          const x = (lane - 1) * 80;
          spawned.push(coinPool.get(x, this.nextCoinZ, lane));
        }
        break;

      case 1: // 一排金币
        for (let lane = 0; lane < 3; lane++) {
          const x = (lane - 1) * 80;
          spawned.push(coinPool.get(x, this.nextCoinZ, lane));
        }
        break;

      case 2: // 一条线金币
        {
          const lane = Math.floor(Math.random() * 3);
          for (let i = 0; i < 5; i++) {
            const x = (lane - 1) * 80;
            spawned.push(coinPool.get(x, this.nextCoinZ - i * 15, lane));
          }
        }
        break;

      case 3: // 之字形金币
        {
          const startLane = Math.random() > 0.5 ? 0 : 2;
          for (let i = 0; i < 3; i++) {
            const lane = startLane === 0 ? i : 2 - i;
            const x = (lane - 1) * 80;
            spawned.push(coinPool.get(x, this.nextCoinZ - i * 20, lane));
          }
        }
        break;
    }

    this.nextCoinZ += 60 + Math.random() * 40;
    return spawned;
  }
}
