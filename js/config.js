// 游戏配置常量

// Canvas 相关
export const DESIGN_WIDTH = 375;
export const DESIGN_HEIGHT = 667;

// 游戏状态
export const GAME_STATE = {
  START: 'START',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER'
};

// 赛道配置
export const LANE_COUNT = 3;
export const LANE_WIDTH = 80;
export const ROAD_LENGTH = 600;

// 透视投影配置
export const CAMERA_DEPTH = 300;
export const CAMERA_HEIGHT = 150;
export const PLAYER_Z = 30;

// 玩家配置
export const PLAYER_WIDTH = 40;
export const PLAYER_HEIGHT = 80;
export const GRAVITY = 0.6;
export const JUMP_VELOCITY = 12;
export const LANE_SWITCH_SPEED = 0.15;

// 障碍物配置
export const OBSTACLE_TYPES = {
  BAMBOO: { type: 'bamboo', width: 30, height: 100, color: '#8B4513', canJump: true, canSlide: true },
  PUDDLE: { type: 'puddle', width: 70, height: 15, color: '#4169E1', canJump: false, canSlide: false },
  STONE: { type: 'stone', width: 50, height: 40, color: '#696969', canJump: true, canSlide: false },
  BARRIER: { type: 'barrier', width: 80, height: 60, color: '#8B0000', canJump: false, canSlide: true }
};

export const OBSTACLE_SPAWN_Z = 550;
export const OBSTACLE_DESPAWN_Z = -50;
export const OBSTACLE_MIN_GAP = 80;

// 金币配置
export const COIN_CONFIG = {
  width: 20,
  height: 20,
  color: '#FFD700',
  value: 10
};
export const COIN_SPAWN_Z = 550;
export const COIN_DESPAWN_Z = -50;

// 难度配置
export const DIFFICULTY = {
  INITIAL_OBSTACLE_DENSITY: 0.5,
  MAX_OBSTACLE_DENSITY: 0.85,
  DENSITY_INCREMENT: 0.002,
  INITIAL_MIN_GAP: 100,
  MIN_GAP_LIMIT: 60,
  GAP_DECREMENT: 0.1
};

// 速度配置
export const INITIAL_SPEED = 3;
export const MAX_SPEED = 10;
export const SPEED_INCREMENT = 0.001;

// 输入配置
export const SWIPE_THRESHOLD = 30;

// 得分配置
export const SCORE = {
  DISTANCE_MULTIPLIER: 10,
  COIN_VALUE: 10
};

// UI 配置
export const UI = {
  BUTTON_WIDTH: 200,
  BUTTON_HEIGHT: 55,
  PAUSE_BUTTON_SIZE: 40
};

// 本地存储键名
export const STORAGE_KEYS = {
  HIGH_SCORE: 'tanghulu_high_score',
  TOTAL_COINS: 'tanghulu_total_coins'
};
