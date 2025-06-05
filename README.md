
---

# 前端框架详细设计 

## 项目简介

本项目为**网页五子棋在线对战系统**前端，基于 `Vue3` + `Vite` + `Tailwind CSS` 实现，配合 RESTful API 及 WebSocket 实现实时房间、棋局与聊天。
支持注册/登录、游戏大厅、对局房间、观战、实时聊天等功能，适配通用后端服务。

---

## 技术栈

* **核心框架**：Vue3 (Composition API)
* **构建工具**：Vite
* **样式库**：Tailwind CSS 3.x
* **路由管理**：vue-router
* **数据交互**：RESTful API (fetch)，WebSocket（ws）

---

## 主要页面与功能模块

### 1. 登录/注册页面

* 路由：`/login`、`/register`
* 功能：账号注册、登录，输入校验，密码清空提示、登录状态持久化

### 2. 游戏大厅

* 路由：`/lobby`
* 功能：

  * 显示在线用户、房间列表
  * 创建/加入/观战房间
  * 人机对战入口
  * 支持房间密码
  * 实时数据刷新（定时/WS推送）

### 3. 游戏房间

* 路由：`/room/:id`
* 功能：

  * 棋盘绘制与操作（15x15）
  * 随机分配黑白方
  * 准备流程、倒计时、认输
  * 观战模式限制操作
  * 实时棋局同步与聊天
  * 对局结束弹窗与房间状态自动同步

---

## 主要技术要点

### REST API 封装

* 全部请求集中在 `src/utils/api.js`
* 提供 `get(path)`、`post(path, data)` 两个方法，自动拼接服务器地址

### WebSocket 封装

* 单独工具 `src/utils/ws.js`
* 提供 `connectWS(token)`、`sendWSMsg(type, data)`、`onWSMsg(fn)`、`closeWS()`等方法
* 所有房间内的棋盘和聊天事件实时同步

### 状态管理

* 使用 localStorage 存储登录用户/Token信息
* 页面内用 `ref` 管理响应式数据

### 样式与UI

* 使用 Tailwind 设计现代化风格，整体简洁美观
* 所有页面自适应、无图片依赖、支持动画

---

## 运行与部署

1. **依赖安装**

   ```
   npm install
   ```

2. **开发模式运行**

   ```
   npm run dev
   ```

3. **生产打包**

   ```
   npm run build
   ```

   将 `dist/` 下内容部署到任意静态服务器（Nginx/Apache）

4. **环境变量配置**

   * 如需自定义 API 地址，可在 `.env` 配置 `VITE_API_URL`

---

## 数据与交互流程说明

* 登录注册 → 进入大厅 → 获取房间/用户数据（REST） → 加入房间 → 连接 WebSocket（房间内全部交互走ws）→ 离开房间/认输/聊天 → 退出登录（REST+ws）



# 后端接口文档（REST + WebSocket）

以下为推荐/标准的后端接口及ws消息格式，请根据实际代码适配：

---

## 一、RESTful API 设计

### 1. 用户登录/注册/登出

* **POST /api/auth/register**

  * `body`：{ username, password, email }
  * `response`：{ success, message }

* **POST /api/auth/login**

  * `body`：{ username, password }
  * `response`：{ success, user, token, message }

    * token 用于ws/jwt校验

* **POST /api/auth/logout**

  * `body`：{ username }
  * `response`：{ success }

---

### 2. 用户/房间信息

* **GET /api/users/online**

  * `response`：{ users: \[用户名1, 用户名2, ...] }

* **GET /api/rooms**

  * `response`：{ rooms: \[{ id, name, playerCount, hasPassword, status }] }

    * status: "waiting" | "full" | "playing"

---

### 3. 房间管理

* **POST /api/rooms/create**

  * `body`：{ name, password? }
  * `response`：{ success, room: { id, name, ... }, message }

* **POST /api/rooms/join**

  * `body`：{ roomId, password? }
  * `response`：{ success, message }

* **POST /api/rooms/leave**

  * `body`：{ roomId }
  * `response`：{ success }

---

## 二、WebSocket 消息协议

### 1. 通信说明

* 客户端连接：`ws://server:5555/ws?token=xxx`
* 通信全为 JSON 格式
* 连接后，客户端必须发送 `join_room` 消息（roomId+是否观战）

---

### 2. 客户端 → 服务端 消息

| type        | 必选字段             | 说明      |
| ----------- | ---------------- | ------- |
| join\_room  | roomId, spectate | 加入房间/观战 |
| chess\_move | roomId, x, y     | 落子请求    |
| ready       | roomId           | 玩家准备    |
| giveup      | roomId           | 认输      |
| leave\_room | roomId           | 离开房间    |
| chat        | roomId, text     | 聊天消息    |
| timeout     | roomId           | 超时动作    |

---

### 3. 服务端 → 客户端 消息

| type        | 字段（示例）                                                                   | 说明           |
| ----------- | ------------------------------------------------------------------------ | ------------ |
| room\_info  | black, white, currentUser, currentColor, board, started, over, resultMsg | 房间/棋盘初始化/同步  |
| chess\_move | x, y, color, nextColor, nextUser                                         | 某玩家落子        |
| chat        | user, text, time                                                         | 聊天内容         |
| ready       | started                                                                  | 玩家准备，游戏是否已开始 |
| game\_over  | resultMsg                                                                | 游戏结束，胜负原因/说明 |
| user\_join  | user                                                                     | 用户加入房间       |
| user\_leave | user                                                                     | 用户离开房间       |
| giveup      | loser, winner                                                            | 有玩家认输        |
| timeout     | user                                                                     | 有玩家超时        |

---

### 4. 通用约定

* 连接ws时带上token，后端校验身份
* 客户端状态仅做展示，所有棋盘判定与房间/胜负权威状态由服务端广播
* 聊天、棋局、房间人员变化均有对应消息实时同步

---

## 三、典型交互流程举例

1. **用户A登录**（REST），进入大厅，拉取房间/用户列表（REST）
2. **用户A点击加入房间**（REST），跳转房间页面，连接ws，发送`join_room`
3. **房间信息初始化**（ws服务端推送`room_info`），前端渲染棋盘与状态
4. **用户A点“准备”**，发`ready`，所有人都准备服务端推送`room_info`及状态
5. **轮到用户A下棋**，点击棋盘，发`chess_move`，服务端判定后广播`chess_move`
6. **有人发言**，发`chat`，服务端推送所有人`chat`
7. **有人认输/超时/胜负/离开房间**，均发消息，服务端统一广播相关状态

