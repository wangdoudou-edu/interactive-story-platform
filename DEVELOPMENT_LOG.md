# AI-LOP 开发进度日志

## 📋 项目信息

| 项目名称 | AI-LOP (AI-enabled Learning Orchestration Platform) |
|:---|:---|
| **项目描述** | 多 AI 协作学习平台，支持教师-学生-AI 三方协作的互动叙事设计教学环境 |
| **线上地址** | http://122.152.228.48 |
| **API 地址** | http://122.152.228.48/api |
| **宝塔面板** | http://122.152.228.48:8888 |
| **Git 仓库** | https://github.com/wangdoudou-edu/interactive-story-platform |

---

## 🔑 测试账户

| 角色 | 用户名 | 密码 |
|:---|:---|:---|
| 学生 | student | student123 |
| 教师 | teacher | teacher123 |

---

## 📅 开发日志（按时间倒序）

---

### 2026-02-03 服务器部署上线

#### ✅ 完成内容

**服务器环境搭建**
- 腾讯云服务器 OpenCloudOS 系统
- 宝塔面板安装配置
- Node.js v22.22.0 安装
- PostgreSQL 数据库安装配置
- Nginx 反向代理配置

**后端部署**
- 代码推送至 Gitee 仓库
- 服务器拉取代码
- 环境变量配置 (.env)
- Prisma 数据库表结构迁移
- PM2 进程管理 + 开机自启

**前端部署**
- Vite 生产环境构建
- Nginx 静态文件服务配置
- API 反向代理 (/api → localhost:3000)
- CORS 跨域配置修复

**测试账户创建**
- 运行 create-test-accounts.ts 脚本
- 创建 student/teacher 测试账户

#### 🐛 遇到的问题及解决
1. `npx: command not found` → 设置 PATH 环境变量
2. PostgreSQL 权限问题 → 使用 postgres 超级用户
3. `Failed to fetch` → 修复 API_BASE 配置（从 localhost 改为 /api）
4. CORS 错误 → 添加 CLIENT_URL 环境变量
5. PM2 重启循环 → 手动启动排查问题后重新配置

---

### 2026-02-02 学生任务流程实现

#### ✅ 完成内容

**前端组件开发**
- `TaskFlowPanel` - 任务流程面板
- `EditorPanel` - 富文本编辑器面板
- `DraftPanel` - 草稿管理面板
- `NotePanel` - 笔记面板
- `FileUpload` - 文件上传组件
- `RichTextEditor` - 富文本编辑器

**状态管理 (Zustand Stores)**
- `projectStore` - 项目状态管理
- `chatStore` - 聊天状态管理
- `annotationStore` - 批注状态管理

**后端 API**
- `/api/projects` - 项目 CRUD
- `/api/drafts` - 草稿 CRUD
- `/api/notes` - 笔记 CRUD
- `/api/annotations` - 批注 CRUD

**服务层**
- `conversation.service.ts` - 对话业务逻辑
- `logging.service.ts` - 活动日志记录

---

### 2026-01-31 核心功能开发

#### ✅ 完成内容

**用户认证系统**
- JWT Token 认证机制
- 登录/注册 API
- 角色区分（教师/学生）
- `auth.middleware.ts` - 认证中间件
- `auth.service.ts` - 认证业务逻辑

**多 AI 对话系统**
- `AISelector` - AI 模型选择器组件
- `ChatArea` - 聊天区域组件
- `ChatSidebar` - 聊天侧边栏
- `MessageList` - 消息列表组件
- `/api/ai` - AI 对话 API
- `/api/conversations` - 对话管理 API

**教师端功能**
- `TeacherDashboard` - 教师仪表盘页面
- `/api/teacher` - 教师专用 API

**页面开发**
- `LoginPage` - 登录页面（精美 UI）
- `ChatPage` - 聊天页面

**数据库设计**
- Prisma Schema 设计
- 用户表、对话表、消息表等

---

### 2026-01-31 项目初始化

#### ✅ 完成内容

**项目结构搭建**
- 前端：React + TypeScript + Vite
- 后端：Node.js + Express + TypeScript
- 数据库：PostgreSQL + Prisma ORM
- 状态管理：Zustand

**开发环境配置**
- TypeScript 配置
- ESLint 配置
- 目录结构规划

---

## 🏗️ 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Zustand (状态管理)
- CSS Modules

### 后端
- Node.js
- Express
- TypeScript
- Prisma ORM
- JWT 认证

### 数据库
- PostgreSQL

### 部署
- 腾讯云服务器
- 宝塔面板
- Nginx
- PM2

---

## 📁 项目结构

```
ai-lop/
├── client/                     # 前端应用
│   ├── src/
│   │   ├── components/         # 组件
│   │   │   ├── AISelector.tsx
│   │   │   ├── ChatArea.tsx
│   │   │   ├── ChatSidebar.tsx
│   │   │   ├── DraftPanel.tsx
│   │   │   ├── EditorPanel.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── NotePanel.tsx
│   │   │   ├── RichTextEditor.tsx
│   │   │   └── TaskFlowPanel.tsx
│   │   ├── pages/              # 页面
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   └── TeacherDashboard.tsx
│   │   ├── stores/             # 状态管理
│   │   │   ├── authStore.ts
│   │   │   ├── chatStore.ts
│   │   │   ├── projectStore.ts
│   │   │   └── annotationStore.ts
│   │   ├── services/           # API 服务
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── dist/                   # 构建输出
│   └── package.json
│
├── server/                     # 后端应用
│   ├── src/
│   │   ├── routes/             # API 路由
│   │   │   ├── auth.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   ├── conversation.routes.ts
│   │   │   ├── annotation.routes.ts
│   │   │   ├── draft.routes.ts
│   │   │   ├── note.routes.ts
│   │   │   ├── project.routes.ts
│   │   │   ├── teacher.routes.ts
│   │   │   └── upload.routes.ts
│   │   ├── services/           # 业务逻辑
│   │   │   ├── auth.service.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── conversation.service.ts
│   │   │   └── logging.service.ts
│   │   ├── middleware/         # 中间件
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   └── index.ts            # 入口
│   ├── prisma/                 # 数据库
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── scripts/                # 工具脚本
│   │   ├── create-test-accounts.ts
│   │   └── debug-login.ts
│   ├── .env                    # 环境变量
│   └── package.json
│
├── DEVELOPMENT_LOG.md          # 本文件
└── .gitignore
```

---

## 🚀 待开发功能

- [ ] 前端 UI 优化（样式美化、动画效果）
- [ ] 响应式布局（移动端适配）
- [ ] AI 对话功能完整测试
- [ ] 教师端更多管理功能
- [ ] 文件上传到云存储
- [ ] 数据库定时备份
- [ ] HTTPS 证书配置
- [ ] 域名绑定

---

*最后更新：2026-02-03 08:06*
