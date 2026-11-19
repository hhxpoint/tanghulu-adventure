// 输入管理器 - 处理触摸事件（支持四方向滑动）

import { SWIPE_THRESHOLD } from './config.js';

export class InputManager {
  constructor() {
    this.startX = 0;
    this.startY = 0;
    this.onSwipeLeft = null;
    this.onSwipeRight = null;
    this.onSwipeUp = null;
    this.onSwipeDown = null;
    this.onTap = null;
  }

  init(canvas) {
    this.canvas = canvas;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.startX = touch.clientX;
      this.startY = touch.clientY;
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const endX = touch.clientX;
      const endY = touch.clientY;

      const dx = endX - this.startX;
      const dy = endY - this.startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // 小于阈值视为点击
      if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
        if (this.onTap) {
          this.onTap(endX, endY);
        }
        return;
      }

      // 判断主要方向
      if (absDx > absDy) {
        // 水平滑动
        if (dx > 0 && this.onSwipeRight) {
          this.onSwipeRight();
        } else if (dx < 0 && this.onSwipeLeft) {
          this.onSwipeLeft();
        }
      } else {
        // 垂直滑动
        if (dy < 0 && this.onSwipeUp) {
          this.onSwipeUp();
        } else if (dy > 0 && this.onSwipeDown) {
          this.onSwipeDown();
        }
      }
    }, { passive: false });

    // PC 端键盘支持（调试用）
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'ArrowLeft':
            if (this.onSwipeLeft) this.onSwipeLeft();
            break;
          case 'ArrowRight':
            if (this.onSwipeRight) this.onSwipeRight();
            break;
          case 'ArrowUp':
            if (this.onSwipeUp) this.onSwipeUp();
            break;
          case 'ArrowDown':
            if (this.onSwipeDown) this.onSwipeDown();
            break;
          case ' ':
            if (this.onTap) this.onTap(0, 0);
            break;
        }
      });
    }
  }

  // 设置回调
  setCallbacks({ onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap }) {
    this.onSwipeLeft = onSwipeLeft;
    this.onSwipeRight = onSwipeRight;
    this.onSwipeUp = onSwipeUp;
    this.onSwipeDown = onSwipeDown;
    this.onTap = onTap;
  }
}
