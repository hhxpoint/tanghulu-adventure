// 玩家类 - 糖葫芦（优化版）

import {
  LANE_WIDTH, LANE_COUNT,
  GRAVITY, JUMP_VELOCITY, LANE_SWITCH_SPEED,
  PLAYER_WIDTH, PLAYER_HEIGHT
} from './config.js';

// 玩家状态
export const PLAYER_STATE = {
  RUNNING: 'RUNNING',
  JUMPING: 'JUMPING',
  SLIDING: 'SLIDING'
};

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    // 位置
    this.lane = 1;              // 当前赛道 0=左, 1=中, 2=右
    this.x = 0;                 // 实际 X 坐标
    this.y = 0;                 // Y 坐标（跳跃高度）
    this.targetX = 0;           // 目标 X 坐标
    this.velocityX = 0;         // X 轴速度（用于平滑移动）
    this.velocityY = 0;         // Y 轴速度

    // 状态
    this.state = PLAYER_STATE.RUNNING;
    this.isAlive = true;

    // 动画参数
    this.rotation = 0;          // 旋转角度（跳跃时倾斜）
    this.scaleY = 1;            // Y轴缩放（下蹲时压缩）
    this.bobOffset = 0;         // 上下浮动偏移（跑步动画）
    this.tiltX = 0;             // 左右倾斜（切换车道时）

    // 计时器
    this.slideTimer = 0;
    this.slideDuration = 0.6;   // 下蹲持续时间（秒）
    this.animTimer = 0;
  }

  // 获取赛道对应的 X 坐标
  getLaneX(lane) {
    return (lane - 1) * LANE_WIDTH;
  }

  // 切换到左边赛道
  moveLeft() {
    if (this.lane > 0 && this.state !== PLAYER_STATE.SLIDING) {
      this.lane--;
      this.targetX = this.getLaneX(this.lane);
      this.tiltX = -0.15; // 左倾斜
    }
  }

  // 切换到右边赛道
  moveRight() {
    if (this.lane < LANE_COUNT - 1 && this.state !== PLAYER_STATE.SLIDING) {
      this.lane++;
      this.targetX = this.getLaneX(this.lane);
      this.tiltX = 0.15; // 右倾斜
    }
  }

  // 跳跃
  jump() {
    if (this.state === PLAYER_STATE.RUNNING) {
      this.state = PLAYER_STATE.JUMPING;
      this.velocityY = JUMP_VELOCITY;
      this.scaleY = 1.1; // 起跳时拉伸
    }
  }

  // 下蹲/滑行
  slide() {
    if (this.state === PLAYER_STATE.RUNNING) {
      this.state = PLAYER_STATE.SLIDING;
      this.slideTimer = this.slideDuration;
      this.scaleY = 0.4; // 压缩高度
    }
  }

  // 更新逻辑
  update(deltaTime) {
    this.animTimer += deltaTime;

    // 更新移动
    this.updateMovement(deltaTime);

    // 更新状态
    this.updateState(deltaTime);

    // 更新动画
    this.updateAnimation(deltaTime);
  }

  // 更新移动
  updateMovement(deltaTime) {
    // 使用速度模拟平滑移动（更自然的物理效果）
    const dx = this.targetX - this.x;
    const moveSpeed = 15; // 移动速度

    if (Math.abs(dx) > 0.1) {
      this.velocityX = dx * moveSpeed;
      this.x += this.velocityX * deltaTime;
    } else {
      this.x = this.targetX;
      this.velocityX = 0;
    }

    // 跳跃物理
    if (this.state === PLAYER_STATE.JUMPING) {
      this.y += this.velocityY;
      this.velocityY -= GRAVITY;

      // 落地检测
      if (this.y <= 0) {
        this.y = 0;
        this.velocityY = 0;
        this.state = PLAYER_STATE.RUNNING;
        this.scaleY = 0.8; // 落地时压缩
      }
    }
  }

  // 更新状态
  updateState(deltaTime) {
    // 下蹲计时
    if (this.state === PLAYER_STATE.SLIDING) {
      this.slideTimer -= deltaTime;
      if (this.slideTimer <= 0) {
        this.state = PLAYER_STATE.RUNNING;
        this.scaleY = 1;
      }
    }
  }

  // 更新动画
  updateAnimation(deltaTime) {
    // 跑步上下浮动
    if (this.state === PLAYER_STATE.RUNNING) {
      this.bobOffset = Math.sin(this.animTimer * 12) * 3;
    } else {
      this.bobOffset *= 0.9;
    }

    // 跳跃时旋转
    if (this.state === PLAYER_STATE.JUMPING) {
      this.rotation = Math.sin(this.animTimer * 8) * 0.1;
    } else {
      this.rotation *= 0.8;
    }

    // 左右倾斜恢复
    this.tiltX *= 0.85;

    // 缩放恢复
    if (this.state === PLAYER_STATE.RUNNING) {
      this.scaleY += (1 - this.scaleY) * 0.15;
    }
  }

  // 获取碰撞边界
  getBounds() {
    const height = this.state === PLAYER_STATE.SLIDING
      ? PLAYER_HEIGHT * 0.4
      : PLAYER_HEIGHT;

    return {
      x: this.x - PLAYER_WIDTH / 2,
      y: this.y,
      width: PLAYER_WIDTH,
      height: height
    };
  }

  // 是否在下蹲
  isSliding() {
    return this.state === PLAYER_STATE.SLIDING;
  }

  // 是否在跳跃
  isJumping() {
    return this.state === PLAYER_STATE.JUMPING;
  }

  // 获取渲染参数
  getRenderParams() {
    return {
      x: this.x,
      y: this.y + this.bobOffset,
      rotation: this.rotation + this.tiltX,
      scaleY: this.scaleY,
      state: this.state
    };
  }
}
