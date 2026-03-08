# MBSS
基于 NestJS 的后端服务模板项目

## 📋 项目简介

MBSS (Middle and Backstage Service) 是一个功能完整的 NestJS 后端服务模板，提供了用户管理、文件上传、WebSocket 通信等核心功能，适合作为新项目的基础框架。

## 🚀 快速开始

### 作为模板使用

```bash
$ npx create-mb [name]

? 🤓 Which library do you want to use?
  mbs
❯ mbss

 ✨  File Generate Done
```

### 直接克隆使用

```bash
# 克隆项目
git clone <repository-url>
cd mbss

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev
```

服务将在 `http://localhost:9000` 启动，Swagger 文档访问地址：`http://localhost:9000/api-doc/`

## 📚 项目文档

完整的项目文档位于 `docs/` 目录：

- **[文档索引](./docs/README.md)** - 文档导航和 AI 使用指南
- **[模板使用指南](./docs/TEMPLATE_GUIDE.md)** - 如何使用此模板创建新项目
- **[快速入门](./docs/QUICK_START.md)** - 快速上手指南
- **[技术文档](./docs/PROJECT_DOCUMENTATION.md)** - 完整技术文档
- **[架构设计](./docs/ARCHITECTURE.md)** - 系统架构设计
- **[环境变量](./docs/ENVIRONMENT_VARIABLES.md)** - 环境变量配置说明

## 🎯 核心功能

- ✅ 用户管理（增删改查、角色权限）
- ✅ 文件上传管理
- ✅ WebSocket 实时通信
- ✅ JWT 认证授权
- ✅ Redis 缓存支持
- ✅ Swagger API 文档
- ✅ 全局异常处理
- ✅ 日志记录系统
- ✅ 密码加密存储

## 🔧 开发命令

```bash
# 开发环境（带热重载）
npm run dev

# 生产环境
npm run build
npm run dev:prod

# 代码格式化
npm run format

# 代码检查
npm run lint

# 运行测试
npm run test
```

## 🔐 安全特性

- JWT Token 认证
- bcrypt 密码加密
- 环境变量配置
- CORS 跨域控制
- 请求验证管道
- 全局异常过滤

## 📖 更多信息

查看 [docs/](./docs/) 目录获取完整的项目文档。

## 📄 许可证

本项目采用 UNLICENSED 许可证。