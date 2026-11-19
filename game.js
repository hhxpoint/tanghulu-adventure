// 糖葫芦历险记 - 主入口文件（完整版）

import { Renderer } from './js/renderer.js';
import { Player } from './js/player.js';
import { ObstaclePool, CoinPool, ObstacleSpawner } from './js/obstacle.js';
import { InputManager } from './js/input.js';
import {
  GAME_STATE,
  LANE_WIDTH, LANE_COUNT, ROAD_LENGTH,
  INITIAL_SPEED, MAX_SPEED, SPEED_INCREMENT,
  OBSTACLE_SPAWN_Z, OBSTACLE_DESPAWN_Z, PLAYER_Z,
  SCORE, STORAGE_KEYS, UI
} from './js/config.js';

class Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.renderer = null;
    this.player = null;
    this.obstaclePool = null;
    this.coinPool = null;
    this.spawner = null;
    this.inputManager = null;

    // 游戏状态
    this.gameState = GAME_STATE.START;

    // 得分相关
    this.score = 0;
    this.displayScore = 0;  // 用于动画显示的分数
    this.coins = 0;
    this.highScore = 0;
    this.totalCoins = 0;

    // 游戏数据
    this.speed = INITIAL_SPEED;
    this.roadOffset = 0;
    this.lastTime = 0;
    this.distance = 0;
    this.playTime = 0;      // 游戏时间（秒）

    // 动画相关
    this.scorePopTimer = 0;
    this.screenShake = 0;
  }

  // 初始化游戏
  init() {
    // 创建 Canvas
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');

    // 处理高分屏
    const dpr = wx.getSystemInfoSync().pixelRatio;
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.scale(dpr, dpr);

    // 初始化渲染器
    this.renderer = new Renderer(this.canvas, this.ctx);
    this.renderer.init(width, height, dpr);

    // 初始化玩家
    this.player = new Player();

    // 初始化对象池
    this.obstaclePool = new ObstaclePool(30);
    this.coinPool = new CoinPool(50);

    // 初始化生成器
    this.spawner = new ObstacleSpawner();

    // 初始化输入管理器
    this.inputManager = new InputManager();
    this.inputManager.init(this.canvas);
    this.setupInputCallbacks();

    // 加载最高分
    this.loadHighScore();

    // 启动游戏循环
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // 加载最高分
  loadHighScore() {
    try {
      const saved = wx.getStorageSync(STORAGE_KEYS.HIGH_SCORE);
      if (saved) {
        this.highScore = parseInt(saved, 10) || 0;
      }
      const savedCoins = wx.getStorageSync(STORAGE_KEYS.TOTAL_COINS);
      if (savedCoins) {
        this.totalCoins = parseInt(savedCoins, 10) || 0;
      }
    } catch (e) {
      console.log('Failed to load high score:', e);
    }
  }

  // 保存最高分
  saveHighScore() {
    try {
      if (this.score > this.highScore) {
        this.highScore = Math.floor(this.score);
        wx.setStorageSync(STORAGE_KEYS.HIGH_SCORE, this.highScore.toString());
      }
      this.totalCoins += this.coins;
      wx.setStorageSync(STORAGE_KEYS.TOTAL_COINS, this.totalCoins.toString());
    } catch (e) {
      console.log('Failed to save high score:', e);
    }
  }

  // 设置输入回调
  setupInputCallbacks() {
    this.inputManager.setCallbacks({
      onSwipeLeft: () => {
        if (this.gameState === GAME_STATE.PLAYING) {
          this.player.moveLeft();
        }
      },
      onSwipeRight: () => {
        if (this.gameState === GAME_STATE.PLAYING) {
          this.player.moveRight();
        }
      },
      onSwipeUp: () => {
        if (this.gameState === GAME_STATE.PLAYING) {
          this.player.jump();
        }
      },
      onSwipeDown: () => {
        if (this.gameState === GAME_STATE.PLAYING) {
          this.player.slide();
        }
      },
      onTap: (x, y) => {
        this.handleTap(x, y);
      }
    });
  }

  // 处理点击事件
  handleTap(x, y) {
    const width = this.renderer.width;
    const height = this.renderer.height;
    const centerX = width / 2;
    const centerY = height / 2;

    if (this.gameState === GAME_STATE.START) {
      // 开始按钮
      const btnX = centerX - UI.BUTTON_WIDTH / 2;
      const btnY = centerY + 72.5;
      if (this.isPointInRect(x, y, btnX, btnY, UI.BUTTON_WIDTH, UI.BUTTON_HEIGHT)) {
        this.startGame();
      }
    } else if (this.gameState === GAME_STATE.PLAYING) {
      // 暂停按钮（右上角）
      const pauseX = width - UI.PAUSE_BUTTON_SIZE - 15;
      const pauseY = 15;
      if (this.isPointInRect(x, y, pauseX, pauseY, UI.PAUSE_BUTTON_SIZE, UI.PAUSE_BUTTON_SIZE)) {
        this.pauseGame();
      }
    } else if (this.gameState === GAME_STATE.PAUSED) {
      // 继续按钮
      const btnX = centerX - UI.BUTTON_WIDTH / 2;
      const btnY = centerY - 20;
      if (this.isPointInRect(x, y, btnX, btnY, UI.BUTTON_WIDTH, UI.BUTTON_HEIGHT)) {
        this.resumeGame();
      }
      // 重新开始按钮
      const btnY2 = centerY + 50;
      if (this.isPointInRect(x, y, btnX, btnY2, UI.BUTTON_WIDTH, UI.BUTTON_HEIGHT)) {
        this.startGame();
      }
    } else if (this.gameState === GAME_STATE.GAMEOVER) {
      // 重新开始按钮
      const btnX = centerX - UI.BUTTON_WIDTH / 2;
      const btnY = centerY + 90;
      if (this.isPointInRect(x, y, btnX, btnY, UI.BUTTON_WIDTH, UI.BUTTON_HEIGHT)) {
        this.startGame();
      }
    }
  }

  // 检查点是否在矩形内
  isPointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
  }

  // 开始游戏
  startGame() {
    this.gameState = GAME_STATE.PLAYING;
    this.score = 0;
    this.displayScore = 0;
    this.coins = 0;
    this.speed = INITIAL_SPEED;
    this.roadOffset = 0;
    this.distance = 0;
    this.playTime = 0;
    this.scorePopTimer = 0;
    this.screenShake = 0;
    this.player.reset();
    this.obstaclePool.clear();
    this.coinPool.clear();
    this.spawner.reset();
  }

  // 暂停游戏
  pauseGame() {
    this.gameState = GAME_STATE.PAUSED;
  }

  // 继续游戏
  resumeGame() {
    this.gameState = GAME_STATE.PLAYING;
    this.lastTime = performance.now();
  }

  // 游戏结束
  gameOver() {
    this.gameState = GAME_STATE.GAMEOVER;
    this.screenShake = 10;
    this.saveHighScore();
  }

  // 游戏主循环
  gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.gameState === GAME_STATE.PLAYING) {
      this.update(deltaTime);
    }

    // 更新动画（即使暂停也更新）
    this.updateAnimations(deltaTime);

    this.render();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  // 更新动画效果
  updateAnimations(deltaTime) {
    // 分数动画
    if (this.displayScore < this.score) {
      this.displayScore += (this.score - this.displayScore) * 0.1;
      if (Math.abs(this.displayScore - this.score) < 1) {
        this.displayScore = this.score;
      }
    }

    // 分数弹出效果
    if (this.scorePopTimer > 0) {
      this.scorePopTimer -= deltaTime;
    }

    // 屏幕震动衰减
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.1) {
        this.screenShake = 0;
      }
    }
  }

  // 更新逻辑
  update(deltaTime) {
    // 更新速度
    if (this.speed < MAX_SPEED) {
      this.speed += SPEED_INCREMENT;
    }

    // 更新赛道偏移
    this.roadOffset += this.speed * deltaTime * 60;
    if (this.roadOffset >= ROAD_LENGTH) {
      this.roadOffset -= ROAD_LENGTH;
    }

    // 更新距离和时间
    this.distance += this.speed * deltaTime * 60;
    this.playTime += deltaTime;

    // 更新玩家
    this.player.update(deltaTime);

    // 更新难度
    this.spawner.updateDifficulty(deltaTime, this.speed);

    // 更新障碍物
    this.updateObstacles(deltaTime);

    // 更新金币
    this.updateCoins(deltaTime);

    // 生成新障碍物和金币
    this.spawnObjects();

    // 检测碰撞
    this.checkCollisions();

    // 更新得分
    const newScore = this.distance * SCORE.DISTANCE_MULTIPLIER / 100 + this.coins * SCORE.COIN_VALUE;
    if (newScore > this.score) {
      this.score = newScore;
    }
  }

  // 更新障碍物
  updateObstacles(deltaTime) {
    const obstacles = this.obstaclePool.active;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.update(deltaTime, this.speed);

      if (obs.z < OBSTACLE_DESPAWN_Z) {
        this.obstaclePool.recycle(obs);
      }
    }
  }

  // 更新金币
  updateCoins(deltaTime) {
    const coins = this.coinPool.active;
    for (let i = coins.length - 1; i >= 0; i--) {
      const coin = coins[i];
      coin.update(deltaTime, this.speed);

      if (coin.z < OBSTACLE_DESPAWN_Z || coin.collected) {
        this.coinPool.recycle(coin);
      }
    }
  }

  // 生成障碍物和金币
  spawnObjects() {
    this.spawner.spawnObstacles(this.obstaclePool, OBSTACLE_SPAWN_Z - (OBSTACLE_SPAWN_Z - this.spawner.nextObstacleZ));
    this.spawner.spawnCoins(this.coinPool, OBSTACLE_SPAWN_Z - (OBSTACLE_SPAWN_Z - this.spawner.nextCoinZ));
  }

  // 碰撞检测
  checkCollisions() {
    const playerBounds = this.player.getBounds();

    // 检测障碍物碰撞
    for (const obs of this.obstaclePool.active) {
      if (Math.abs(obs.z - PLAYER_Z) > 15) continue;
      if (obs.lane !== this.player.lane) continue;

      const obsBounds = obs.getBounds();
      if (this.checkAABBCollision(playerBounds, obsBounds)) {
        if (obs.needsJump() && this.player.y > obs.config.height * 0.5) {
          continue;
        }
        if (obs.canSlideAvoid() && this.player.isSliding()) {
          continue;
        }
        this.gameOver();
        return;
      }
    }

    // 检测金币碰撞
    for (const coin of this.coinPool.active) {
      if (coin.collected) continue;
      if (Math.abs(coin.z - PLAYER_Z) > 20) continue;
      if (coin.lane !== this.player.lane) continue;

      const coinBounds = coin.getBounds();
      if (this.checkAABBCollision(playerBounds, coinBounds)) {
        coin.collected = true;
        this.coins++;
        this.scorePopTimer = 0.2;
      }
    }
  }

  // AABB 碰撞检测
  checkAABBCollision(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // 渲染
  render() {
    const ctx = this.ctx;

    // 应用屏幕震动
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    this.renderer.render(
      this.gameState,
      this.player,
      this.obstaclePool.active,
      this.coinPool.active,
      {
        score: this.displayScore,
        coins: this.coins,
        highScore: this.highScore,
        speed: this.speed,
        maxSpeed: MAX_SPEED,
        playTime: this.playTime,
        distance: this.distance,
        scorePop: this.scorePopTimer > 0
      },
      this.roadOffset
    );

    ctx.restore();
  }
}

// 启动游戏
const game = new Game();
game.init();
