// 渲染器 - 神庙逃亡风格的伪3D渲染

import {
  LANE_WIDTH, LANE_COUNT, ROAD_LENGTH,
  CAMERA_DEPTH, CAMERA_HEIGHT, PLAYER_Z,
  PLAYER_WIDTH, PLAYER_HEIGHT,
  GAME_STATE, SCORE
} from './config.js';

export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.horizonY = 0; // 地平线位置
  }

  init(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.horizonY = height * 0.35; // 地平线在屏幕上方35%处
  }

  // 自定义圆角矩形绘制（兼容微信小游戏）
  roundRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  // 3D 透视投影 - 神庙逃亡风格
  project(worldX, worldY, worldZ) {
    const z = Math.max(worldZ, 0.1);
    const scale = CAMERA_DEPTH / z;
    const screenX = this.width / 2 + scale * worldX;
    const screenY = this.horizonY + scale * CAMERA_HEIGHT - scale * worldY;
    return { x: screenX, y: screenY, scale };
  }

  // 清空画布
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  // 绘制天空和远景
  drawBackground() {
    const ctx = this.ctx;

    // 天空渐变
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.horizonY);
    skyGradient.addColorStop(0, '#0d1b2a');
    skyGradient.addColorStop(0.4, '#1b263b');
    skyGradient.addColorStop(0.7, '#415a77');
    skyGradient.addColorStop(1, '#778da9');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, this.width, this.horizonY);

    // 远处的山/建筑轮廓
    ctx.fillStyle = '#1b263b';
    ctx.beginPath();
    ctx.moveTo(0, this.horizonY);
    for (let x = 0; x <= this.width; x += 30) {
      const h = Math.sin(x * 0.02) * 20 + Math.sin(x * 0.05) * 10 + 15;
      ctx.lineTo(x, this.horizonY - h);
    }
    ctx.lineTo(this.width, this.horizonY);
    ctx.closePath();
    ctx.fill();

    // 地面渐变
    const groundGradient = ctx.createLinearGradient(0, this.horizonY, 0, this.height);
    groundGradient.addColorStop(0, '#3d405b');
    groundGradient.addColorStop(0.3, '#2d2d44');
    groundGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, this.horizonY, this.width, this.height - this.horizonY);
  }

  // 绘制赛道
  drawRoad(roadOffset) {
    const ctx = this.ctx;
    const roadHalfWidth = (LANE_COUNT * LANE_WIDTH) / 2 + 20; // 赛道总宽度的一半

    // 绘制赛道地面（从远到近）
    const segments = 60;
    for (let i = 0; i < segments; i++) {
      const z1 = ROAD_LENGTH - (i * ROAD_LENGTH / segments) - (roadOffset % (ROAD_LENGTH / segments));
      const z2 = ROAD_LENGTH - ((i + 1) * ROAD_LENGTH / segments) - (roadOffset % (ROAD_LENGTH / segments));

      if (z1 <= 0 || z2 <= 0) continue;

      const p1 = this.project(0, 0, z1);
      const p2 = this.project(0, 0, z2);

      // 赛道左右边缘
      const left1 = this.project(-roadHalfWidth, 0, z1);
      const right1 = this.project(roadHalfWidth, 0, z1);
      const left2 = this.project(-roadHalfWidth, 0, z2);
      const right2 = this.project(roadHalfWidth, 0, z2);

      // 赛道地面颜色（交替条纹）
      const alpha = 0.15 + (i % 2) * 0.05;
      ctx.fillStyle = `rgba(100, 100, 120, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(left1.x, left1.y);
      ctx.lineTo(right1.x, right1.y);
      ctx.lineTo(right2.x, right2.y);
      ctx.lineTo(left2.x, left2.y);
      ctx.closePath();
      ctx.fill();

      // 赛道边线
      const lineAlpha = Math.max(0.1, 0.8 - z1 / ROAD_LENGTH);
      ctx.strokeStyle = `rgba(255, 200, 100, ${lineAlpha})`;
      ctx.lineWidth = Math.max(1, 3 * p1.scale);

      // 左边线
      ctx.beginPath();
      ctx.moveTo(left1.x, left1.y);
      ctx.lineTo(left2.x, left2.y);
      ctx.stroke();

      // 右边线
      ctx.beginPath();
      ctx.moveTo(right1.x, right1.y);
      ctx.lineTo(right2.x, right2.y);
      ctx.stroke();

      // 赛道分隔线（虚线）
      for (let lane = 1; lane < LANE_COUNT; lane++) {
        const lx = (lane - 1) * LANE_WIDTH;
        const lp1 = this.project(lx, 0, z1);
        const lp2 = this.project(lx, 0, z2);

        const dashAlpha = Math.max(0.05, 0.4 - z1 / ROAD_LENGTH);
        ctx.strokeStyle = `rgba(255, 255, 200, ${dashAlpha})`;
        ctx.lineWidth = Math.max(1, 2 * lp1.scale);

        if (i % 2 === 0) {
          ctx.beginPath();
          ctx.moveTo(lp1.x, lp1.y);
          ctx.lineTo(lp2.x, lp2.y);
          ctx.stroke();
        }
      }
    }
  }

  // 绘制赛道标记（距离提示）
  drawRoadMarkers(roadOffset) {
    const ctx = this.ctx;
    const markerInterval = 100; // 每100单位画一个标记

    for (let i = 0; i < 6; i++) {
      const z = ROAD_LENGTH - i * markerInterval - (roadOffset % markerInterval);
      if (z <= 0 || z >= ROAD_LENGTH) continue;

      const p = this.project(0, 0, z);
      const alpha = Math.max(0, 1 - z / ROAD_LENGTH);
      const size = Math.max(2, 8 * p.scale);

      // 赛道中心标记
      ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.5})`;
      ctx.fillRect(p.x - size / 2, p.y - size / 4, size, size / 2);
    }
  }

  // 绘制玩家（糖葫芦）- 支持动画
  drawPlayer(player) {
    const ctx = this.ctx;
    const params = player.getRenderParams();
    const p = this.project(params.x, params.y, PLAYER_Z);
    const width = PLAYER_WIDTH * p.scale;
    const height = PLAYER_HEIGHT * p.scale * params.scaleY;
    const centerX = p.x;
    const bottomY = p.y;

    ctx.save();
    ctx.translate(centerX, bottomY);
    ctx.rotate(params.rotation);

    // 影子（随高度变化）
    const shadowScale = 1 - (params.y / 100);
    const shadowWidth = width * 1.2 * Math.max(0.3, shadowScale);
    const shadowHeight = 8 * p.scale * Math.max(0.3, shadowScale);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * Math.max(0.2, shadowScale)})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, shadowWidth / 2, shadowHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 竹签
    const stickWidth = 4 * p.scale;
    const stickHeight = height;
    ctx.fillStyle = '#a0522d';
    ctx.fillRect(-stickWidth / 2, -stickHeight, stickWidth, stickHeight);

    // 竹签阴影
    ctx.fillStyle = '#6b3a1f';
    ctx.fillRect(-stickWidth / 2 + stickWidth * 0.6, -stickHeight, stickWidth * 0.3, stickHeight);

    // 糖葫芦球（4个）
    const ballRadius = width / 3.5;
    const ballSpacing = height * 0.18;
    const ballColors = [
      { main: '#e63946', shadow: '#9d0208', highlight: '#ff6b6b' },
      { main: '#e63946', shadow: '#9d0208', highlight: '#ff6b6b' },
      { main: '#e63946', shadow: '#9d0208', highlight: '#ff6b6b' },
      { main: '#e63946', shadow: '#9d0208', highlight: '#ff6b6b' }
    ];

    for (let i = 0; i < 4; i++) {
      const ballY = -stickHeight + ballSpacing * (i + 0.8);
      const color = ballColors[i];

      // 球阴影
      ctx.beginPath();
      ctx.arc(ballRadius * 0.2, ballY + ballRadius * 0.1, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = color.shadow;
      ctx.fill();

      // 球主体
      ctx.beginPath();
      ctx.arc(0, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = color.main;
      ctx.fill();

      // 糖浆光泽
      ctx.beginPath();
      ctx.arc(0, ballY, ballRadius, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        -ballRadius * 0.3, ballY - ballRadius * 0.3, 0,
        0, ballY, ballRadius
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // 高光点
      ctx.beginPath();
      ctx.arc(-ballRadius * 0.35, ballY - ballRadius * 0.35, ballRadius * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
    }

    // 下蹲状态指示（可选）
    if (params.state === 'SLIDING') {
      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, -height / 2, width / 2, height / 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 绘制障碍物
  drawObstacles(obstacles) {
    const ctx = this.ctx;
    const sorted = [...obstacles].sort((a, b) => b.z - a.z);

    for (const obs of sorted) {
      if (obs.z <= 0) continue;

      const p = this.project(obs.x, obs.y, obs.z);
      const width = obs.config.width * p.scale;
      const height = obs.config.height * p.scale;
      const centerX = p.x;
      const bottomY = p.y;

      // 影子
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(centerX, bottomY, width / 2, 4 * p.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      switch (obs.config.type) {
        case 'bamboo':
          this.drawBambooObstacle(centerX, bottomY, width, height, p.scale);
          break;
        case 'puddle':
          this.drawPuddleObstacle(centerX, bottomY, width, height, p.scale);
          break;
        case 'stone':
          this.drawStoneObstacle(centerX, bottomY, width, height, p.scale);
          break;
        case 'barrier':
          this.drawBarrierObstacle(centerX, bottomY, width, height, p.scale);
          break;
      }
    }
  }

  // 绘制竹签障碍
  drawBambooObstacle(x, y, width, height, scale) {
    const ctx = this.ctx;
    const stickCount = 3;
    const stickWidth = width / (stickCount * 2);

    for (let i = 0; i < stickCount; i++) {
      const sx = x - width / 2 + stickWidth * (i * 2 + 0.5);

      // 竹签主体
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(sx, y - height, stickWidth, height);

      // 竹签阴影
      ctx.fillStyle = '#5c3317';
      ctx.fillRect(sx + stickWidth * 0.6, y - height, stickWidth * 0.3, height);

      // 竹签顶部
      ctx.fillStyle = '#6b3a1f';
      ctx.beginPath();
      ctx.moveTo(sx, y - height);
      ctx.lineTo(sx + stickWidth / 2, y - height - 8 * scale);
      ctx.lineTo(sx + stickWidth, y - height);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 绘制水坑障碍
  drawPuddleObstacle(x, y, width, height, scale) {
    const ctx = this.ctx;

    // 水坑主体
    ctx.fillStyle = 'rgba(30, 144, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(x, y - height / 2, width / 2, height, 0, 0, Math.PI * 2);
    ctx.fill();

    // 水坑高光
    ctx.fillStyle = 'rgba(135, 206, 250, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x - width / 6, y - height / 2 - height / 4, width / 4, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 水波纹
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(x, y - height / 2, width / 3 - i * 5 * scale, height / 1.5 - i * 3 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 绘制石块障碍
  drawStoneObstacle(x, y, width, height, scale) {
    const ctx = this.ctx;

    // 石块主体
    ctx.fillStyle = '#696969';
    ctx.beginPath();
    ctx.moveTo(x - width / 2, y);
    ctx.lineTo(x - width / 3, y - height);
    ctx.lineTo(x + width / 4, y - height * 1.1);
    ctx.lineTo(x + width / 2, y - height * 0.7);
    ctx.lineTo(x + width / 2.5, y);
    ctx.closePath();
    ctx.fill();

    // 石块亮面
    ctx.fillStyle = '#808080';
    ctx.beginPath();
    ctx.moveTo(x - width / 3, y - height);
    ctx.lineTo(x + width / 4, y - height * 1.1);
    ctx.lineTo(x + width / 6, y - height * 0.5);
    ctx.lineTo(x - width / 4, y - height * 0.4);
    ctx.closePath();
    ctx.fill();

    // 石块暗面
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.moveTo(x + width / 4, y - height * 1.1);
    ctx.lineTo(x + width / 2, y - height * 0.7);
    ctx.lineTo(x + width / 2.5, y);
    ctx.lineTo(x + width / 6, y - height * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // 绘制路障障碍
  drawBarrierObstacle(x, y, width, height, scale) {
    const ctx = this.ctx;

    // 路障主体（红白条纹）
    const stripeCount = 4;
    const stripeWidth = width / stripeCount;

    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#FF0000' : '#FFFFFF';
      ctx.fillRect(x - width / 2 + i * stripeWidth, y - height, stripeWidth, height);
    }

    // 路障边框
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(x - width / 2, y - height, width, height);

    // 支撑架
    ctx.fillStyle = '#444444';
    ctx.fillRect(x - width / 4, y - height * 0.3, width / 8, height * 0.3);
    ctx.fillRect(x + width / 8, y - height * 0.3, width / 8, height * 0.3);
  }

  // 绘制金币
  drawCoins(coins) {
    const ctx = this.ctx;
    const sorted = [...coins].filter(c => !c.collected).sort((a, b) => b.z - a.z);

    for (const coin of sorted) {
      if (coin.z <= 0) continue;

      const p = this.project(coin.x, 20 + coin.bobOffset, coin.z);
      const size = coin.config.width * p.scale;

      // 金币光晕
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(p.x, p.y - size / 2, size * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 金币主体（旋转效果）
      const rotationScale = Math.abs(Math.cos(coin.rotation));
      const coinWidth = size * rotationScale;

      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - size / 2, coinWidth / 2, size / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 金币边框
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1.5 * p.scale;
      ctx.stroke();

      // 金币高光
      if (rotationScale > 0.3) {
        ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
        ctx.beginPath();
        ctx.ellipse(p.x - coinWidth / 6, p.y - size / 2 - size / 6, coinWidth / 4, size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 金币符号（当正面朝向玩家时）
      if (rotationScale > 0.7) {
        ctx.fillStyle = '#B8860B';
        ctx.font = `bold ${size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', p.x, p.y - size / 2);
      }
    }
  }

  // 绘制得分（包含金币和动画）
  drawScore(score, coins, scorePop) {
    const ctx = this.ctx;

    // 得分背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.roundRect(this.width - 110, 15, 95, 65, 8);
    ctx.fill();

    // 分数弹出效果
    const scale = scorePop ? 1.2 : 1;
    ctx.save();
    ctx.translate(this.width - 62, 42);
    ctx.scale(scale, scale);

    // 得分数字
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${Math.floor(score)}`, 37, 0);

    ctx.restore();

    // SCORE 标签
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'right';
    ctx.fillText('SCORE', this.width - 25, 55);

    // 金币数量
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`$ ${coins}`, this.width - 25, 72);

    ctx.shadowColor = 'transparent';
  }

  // 绘制速度指示器
  drawSpeedIndicator(speed, maxSpeed) {
    const ctx = this.ctx;
    const barWidth = 80;
    const barHeight = 8;
    const x = 15;
    const y = 25;
    const fillPercent = speed / maxSpeed;

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.roundRect(x - 5, y - 15, barWidth + 10, barHeight + 25, 8);
    ctx.fill();

    // 标签
    ctx.font = 'bold 10px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('SPEED', x, y - 3);

    // 进度条背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.roundRect(x, y, barWidth, barHeight, 4);
    ctx.fill();

    // 进度条填充
    const gradient = ctx.createLinearGradient(x, y, x + barWidth * fillPercent, y);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(0.5, '#FFC107');
    gradient.addColorStop(1, '#F44336');
    ctx.fillStyle = gradient;
    this.roundRect(x, y, barWidth * fillPercent, barHeight, 4);
    ctx.fill();
  }

  // 绘制开始界面
  drawStartScreen(gameData) {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 游戏标题
    ctx.font = 'bold 42px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillText('糖葫芦历险记', centerX, centerY - 100);

    // 副标题
    ctx.font = '18px Arial';
    ctx.fillStyle = '#FFA500';
    ctx.shadowBlur = 5;
    ctx.fillText('Tanghulu Adventures', centerX, centerY - 60);
    ctx.shadowColor = 'transparent';

    // 操作说明
    ctx.font = '16px Arial';
    ctx.fillStyle = '#CCCCCC';
    ctx.fillText('← 左右滑动切换赛道 →', centerX, centerY - 10);
    ctx.fillText('↑ 向上滑动跳跃 ↑', centerX, centerY + 20);
    ctx.fillText('↓ 向下滑动下蹲 ↓', centerX, centerY + 50);

    // 开始按钮
    this.drawButton(centerX, centerY + 100, 200, 55, '开始游戏', '#4CAF50', '#388E3C');

    // 最高分显示
    if (gameData && gameData.highScore > 0) {
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`最高分: ${gameData.highScore}`, centerX, centerY + 150);
    }
  }

  // 绘制暂停界面
  drawPauseScreen(gameData) {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 暂停标题
    ctx.font = 'bold 42px Arial';
    ctx.fillStyle = '#FFA500';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 15;
    ctx.fillText('游戏暂停', centerX, centerY - 80);
    ctx.shadowColor = 'transparent';

    // 当前得分
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`当前得分: ${Math.floor(gameData.score)}`, centerX, centerY - 20);

    // 金币数量
    ctx.font = '18px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`金币: ${gameData.coins}`, centerX, centerY + 10);

    // 继续按钮
    this.drawButton(centerX, centerY - 20 + 50, 200, 55, '继续游戏', '#4CAF50', '#388E3C');

    // 重新开始按钮
    this.drawButton(centerX, centerY + 50 + 50, 200, 55, '重新开始', '#FF9800', '#F57C00');
  }

  // 绘制结束界面（增强版）
  drawGameOverScreen(gameData) {
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 游戏结束标题
    ctx.font = 'bold 42px Arial';
    ctx.fillStyle = '#FF4444';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.fillText('游戏结束', centerX, centerY - 120);
    ctx.shadowColor = 'transparent';

    // 最终得分
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.fillText('最终得分', centerX, centerY - 60);

    ctx.font = 'bold 52px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${Math.floor(gameData.score)}`, centerX, centerY);

    // 统计信息
    const statsY = centerY + 40;
    ctx.font = '18px Arial';
    ctx.fillStyle = '#CCCCCC';

    // 金币
    ctx.fillText(`金币: ${gameData.coins}`, centerX, statsY);

    // 游戏时间
    const minutes = Math.floor(gameData.playTime / 60);
    const seconds = Math.floor(gameData.playTime % 60);
    ctx.fillText(`时间: ${minutes}:${seconds.toString().padStart(2, '0')}`, centerX, statsY + 25);

    // 距离
    ctx.fillText(`距离: ${Math.floor(gameData.distance)}m`, centerX, statsY + 50);

    // 最高分标记
    if (gameData.score >= gameData.highScore && gameData.highScore > 0) {
      ctx.font = 'bold 20px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.fillText('新纪录！', centerX, statsY + 80);
    } else if (gameData.highScore > 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#888888';
      ctx.fillText(`最高分: ${gameData.highScore}`, centerX, statsY + 80);
    }

    // 重新开始按钮
    this.drawButton(centerX, centerY + 90 + 50, 200, 55, '重新开始', '#2196F3', '#1976D2');
  }

  // 绘制按钮
  drawButton(x, y, width, height, text, color1, color2) {
    const ctx = this.ctx;
    const btnX = x - width / 2;
    const btnY = y - height / 2;

    // 按钮阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.roundRect(btnX + 3, btnY + 3, width, height, 12);
    ctx.fill();

    // 按钮渐变
    const gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);

    ctx.fillStyle = gradient;
    this.roundRect(btnX, btnY, width, height, 12);
    ctx.fill();

    // 按钮边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 按钮文字
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(text, x, y);
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'transparent';
  }

  // 绘制暂停按钮
  drawPauseButton() {
    const ctx = this.ctx;
    const size = 40;
    const x = this.width - size - 15;
    const y = 15;

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.roundRect(x, y, size, size, 8);
    ctx.fill();

    // 暂停图标（两条竖线）
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 12, y + 10, 6, 20);
    ctx.fillRect(x + 22, y + 10, 6, 20);
  }

  // 绘制游戏时间
  drawPlayTime(playTime) {
    const ctx = this.ctx;
    const minutes = Math.floor(playTime / 60);
    const seconds = Math.floor(playTime % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.fillText(timeStr, 15, 75);
    ctx.shadowColor = 'transparent';
  }

  // 主渲染函数
  render(gameState, player, obstacles, coins, gameData, roadOffset) {
    this.clear();
    this.drawBackground();
    this.drawRoad(roadOffset);
    this.drawRoadMarkers(roadOffset);

    if (gameState === GAME_STATE.PLAYING) {
      this.drawObstacles(obstacles);
      this.drawCoins(coins);
      this.drawPlayer(player);
      this.drawScore(gameData.score, gameData.coins, gameData.scorePop);
      this.drawSpeedIndicator(gameData.speed, gameData.maxSpeed);
      this.drawPlayTime(gameData.playTime);
      this.drawPauseButton();
    } else if (gameState === GAME_STATE.PAUSED) {
      this.drawObstacles(obstacles);
      this.drawCoins(coins);
      this.drawPlayer(player);
      this.drawScore(gameData.score, gameData.coins, false);
      this.drawPauseScreen(gameData);
    } else if (gameState === GAME_STATE.START) {
      this.drawPlayer(player);
      this.drawStartScreen(gameData);
    } else if (gameState === GAME_STATE.GAMEOVER) {
      this.drawObstacles(obstacles);
      this.drawCoins(coins);
      this.drawPlayer(player);
      this.drawGameOverScreen(gameData);
    }
  }
}
