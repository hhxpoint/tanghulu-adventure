# 糖葫芦历险记 · Tanghulu Adventure

> 一个原生 JavaScript + Canvas 2D 的微信小游戏：三车道无尽跑酷，控制可爱的糖葫芦小人左右换道、跳跃、滑铲，躲避障碍、收集金币，挑战最高分。

![WeChat MiniGame](https://img.shields.io/badge/WeChat-MiniGame-07C160?logo=wechat&logoColor=white)
![Canvas 2D](https://img.shields.io/badge/Canvas-2D-BC744A)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-2F6B5F)

![游戏封面](docs/cover.png)

---

## 玩法

- **三车道**：左右滑动切换车道
- **跳跃**：上滑跳过竹子、石头
- **滑铲**：下滑穿过红色路障
- **收集金币**：金币 +10 分
- **距离得分**：跑得越远分数越高
- **难度递增**：速度与障碍密度随距离提升
- **最高分/累计金币**：本地缓存保存
- **暂停/继续/重新开始**：Canvas 内绘制 UI

### 操作

| 操作 | 手机 | 键盘（开发调试） |
|---|---|---|
| 左/右换道 | 左右滑动 | ← / → |
| 跳跃 | 上滑 | ↑ / 空格 |
| 滑铲 | 下滑 | ↓ |
| 暂停 | 点击暂停按钮 | - |

---

## 运行方式

### 环境

- 微信开发者工具（稳定版）
- 小游戏项目，无需 npm 构建

### 步骤

1. 打开微信开发者工具 → 导入项目
2. 项目目录选择本仓库根目录
3. AppID 可先用测试号/游客模式（`project.config.json` 已改为 `touristappid`）
4. 点击“编译”，在模拟器中运行
5. 真机预览：点击“预览”扫码

> 这是**小游戏**项目（`game.js` / `game.json`），不是普通小程序；导入时请确认项目类型为“小游戏”。

---

## 目录结构

```text
tanghulu-adventure/
├── game.js                 # 游戏主入口、状态机、循环
├── game.json               # 小游戏运行配置
├── project.config.json     # 开发者工具项目配置
├── js/
│   ├── config.js           # 车道/速度/障碍/得分配置
│   ├── input.js            # 触摸/键盘输入
│   ├── player.js           # 玩家状态（换道/跳跃/滑铲）
│   ├── obstacle.js         # 障碍物/金币对象池与生成器
│   └── renderer.js         # 透视投影、场景、UI 渲染
├── images/
│   ├── background.png      # 长城公路背景
│   └── tanghulu.png        # 糖葫芦角色
├── docs/
│   └── cover.png           # 项目封面
└── README.md
```

---

## 技术实现

- **Canvas 2D**：`wx.createCanvas()`，按 devicePixelRatio 缩放
- **伪 3D 透视**：`z` 坐标投影到屏幕，车道/障碍/金币按距离缩放
- **对象池**：障碍物与金币复用，减少 GC
- **状态机**：`START → PLAYING → PAUSED → GAMEOVER`
- **输入抽象**：触摸滑动 + 键盘，便于开发调试
- **本地存档**：`wx.setStorageSync` 保存最高分、累计金币

---

## 素材说明

- `images/background.png`：长城公路背景
- `images/tanghulu.png`：糖葫芦角色（AI 生成素材，右下角保留原始水印）
- 如需商用，请自行确认素材授权并替换为你拥有版权的图片

---

## 测试与验收

本项目为 Canvas 小游戏，主要依赖微信运行时；仓库内提供手动验收清单：

- [ ] 编译无报错，进入 START 界面
- [ ] 左右滑动可换道，边界不越界
- [ ] 上滑跳跃、下滑滑铲，动画正常
- [ ] 撞到障碍进入 GAMEOVER，可重新开始
- [ ] 金币加分，最高分/累计金币在重启后保留
- [ ] 暂停/继续正常
- [ ] 真机不同分辨率下 UI 不溢出

---

## License

MIT License，详见 [LICENSE](LICENSE)。游戏素材版权归原作者/生成工具所有，商用前请替换。


---

## 玩法与关卡

- 三车道无尽跑酷：左右滑动/按键切换车道，跳跃躲避障碍
- 收集金币与道具，连击加分
- 速度随分数提升，碰撞结束并支持复活
- Canvas 2D 渲染 + 微信小游戏 API

## 开发环境

- 微信开发者工具（小游戏项目）
- 基础库 2.x+
- 无需额外 npm 依赖

## 常见问题

- 导入后黑屏：确认项目类型为「小游戏」，不是「小程序」。
- 真机无法运行：检查小游戏 AppID/体验权限。
