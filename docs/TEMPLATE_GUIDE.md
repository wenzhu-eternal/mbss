# 模板项目使用指南

## 📋 概述

本项目是一个基于 NestJS 的后端服务模板，可以作为新项目的基础框架。

## 🚀 快速开始

### 1. 克隆或下载模板

```bash
# 克隆项目
git clone <repository-url>
cd mbss

# 或下载压缩包并解压
```

### 2. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，修改配置
nano .env
```

### 4. 配置数据库

创建 MySQL 数据库：
```sql
CREATE DATABASE mbss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. 启动项目

```bash
# 开发环境
npm run dev

# 生产环境
npm run build
npm run dev:prod
```

## 📝 自定义项目

### 修改项目名称

#### 1. 修改 package.json

```json
{
  "name": "your-project-name",
  "version": "0.1.0",
  "description": "Your project description"
}
```

#### 2. 修改配置文件

编辑 `src/config/config.default.ts`：

```typescript
export default defineConfig({
  projectName: 'your-project-name',
  // ... 其他配置
});
```

#### 3. 修改数据库名称

编辑 `.env` 文件：

```bash
MYSQL_DATABASE=your-database-name
```

创建新的数据库：

```sql
CREATE DATABASE your-database-name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 修改端口

编辑 `src/main.ts`：

```typescript
await app.listen(3000); // 修改为你想要的端口
```

### 添加新功能模块

#### 创建新模块

```bash
# 使用 NestJS CLI 创建模块
nest g module modules/your-module
nest g controller modules/your-module
nest g service modules/your-module
```

#### 手动创建模块

1. 创建模块目录：
```
src/modules/your-module/
├── your-module.controller.ts
├── your-module.service.ts
├── your-module.dto.ts
├── your-module.entity.ts
└── your-module.module.ts
```

2. 在 `src/modules/index.module.ts` 中导入新模块：

```typescript
import { Module } from '@nestjs/common';
import YourModule from './your-module/your-module.module';

@Module({
  imports: [YourModule],
})
export default class AppModule {}
```

## 🔐 安全配置

### 生产环境必须修改的配置

1. **JWT 密钥**：
```bash
JWT_SECRET=your-very-strong-jwt-secret-key-here
```

2. **Session 密钥**：
```bash
SESSION_SECRET=your-very-strong-session-secret-key-here
```

3. **数据库密码**：
```bash
MYSQL_PASSWORD=your-strong-mysql-password
```

4. **Redis 密钥**（建议）：
```bash
REDIS_PASSWORD=your-strong-redis-password
```

5. **跨域配置**：
```bash
ALLOW_ORIGIN=https://your-frontend-domain.com
```

### 生成强密码

```bash
# 使用 OpenSSL 生成随机密钥
openssl rand -base64 32

# 使用 Node.js 生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📚 项目结构

```
mbss/
├── src/
│   ├── common/              # 公共模块
│   │   ├── apiRoutes.ts   # API 路由生成
│   │   ├── auth.guard.ts  # 认证守卫
│   │   ├── events.gateway.ts  # WebSocket 网关
│   │   ├── http-exception.filter.ts  # 全局异常过滤器
│   │   ├── logger.middleware.ts  # 日志中间件
│   │   ├── request.service.ts  # 请求服务
│   │   ├── response.interceptor.ts  # 响应拦截器
│   │   └── validation.pipe.ts  # 验证管道
│   ├── config/              # 配置模块
│   │   ├── config.default.ts  # 默认配置
│   │   ├── config.module.ts  # 配置模块
│   │   └── util.ts  # 配置工具
│   ├── modules/             # 业务模块
│   │   ├── user/           # 用户管理模块
│   │   ├── file/           # 文件上传模块
│   │   └── index.module.ts  # 模块索引
│   ├── app.module.ts        # 应用模块
│   └── main.ts             # 应用入口
├── docs/                  # 项目文档
│   ├── README.md           # 文档索引
│   ├── QUICK_START.md      # 快速入门
│   ├── PROJECT_DOCUMENTATION.md  # 技术文档
│   ├── ARCHITECTURE.md     # 架构设计
│   └── ENVIRONMENT_VARIABLES.md  # 环境变量配置
├── test/                  # 测试文件
├── .env.example           # 环境变量模板
├── .gitignore            # Git 忽略配置
├── package.json          # 项目配置
├── tsconfig.json        # TypeScript 配置
└── README.md            # 项目说明
```

## 🎯 核心功能

### 已实现功能

1. **用户管理**
   - 用户增删改查
   - 角色权限管理
   - 密码加密存储
   - 登录认证

2. **文件上传**
   - 文件上传功能
   - 文件存储管理

3. **实时通信**
   - WebSocket 支持
   - Redis 缓存连接

4. **安全机制**
   - JWT 认证
   - Session 管理
   - 权限控制
   - 密码加密

5. **API 文档**
   - Swagger 自动生成
   - 在线测试接口

### 可扩展功能

根据项目需求，可以添加：
- 邮件发送功能
- 短信发送功能
- 日志管理系统
- 数据统计功能
- 第三方登录
- 支付功能
- 消息队列

## 📖 文档

完整的项目文档位于 `docs/` 目录：

- **[文档索引](./docs/README.md)** - 文档导航和 AI 使用指南
- **[快速入门](./docs/QUICK_START.md)** - 快速上手指南
- **[技术文档](./docs/PROJECT_DOCUMENTATION.md)** - 完整技术文档
- **[架构设计](./docs/ARCHITECTURE.md)** - 系统架构设计
- **[环境变量](./docs/ENVIRONMENT_VARIABLES.md)** - 环境变量配置说明

## 🔧 开发命令

```bash
# 开发环境（带热重载）
npm run dev

# 开发环境（带调试）
npm run dev:debug

# 生产环境
npm run build
npm run dev:prod

# 代码格式化
npm run format

# 代码检查
npm run lint

# 运行测试
npm run test

# 测试覆盖率
npm run test:cov
```

## 🚢 部署

### 开发环境部署

```bash
npm run dev
```

### 生产环境部署

1. **构建项目**：
```bash
npm run build
```

2. **配置环境变量**：
```bash
# 方式一：通过系统环境变量
export NODE_ENV=production
export JWT_SECRET=your-production-secret
# ... 其他配置

# 方式二：通过 .env 文件
cp .env.example .env
# 编辑 .env 文件
```

3. **启动服务**：
```bash
npm run dev:prod
```

### Docker 部署（可选）

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 9000
CMD ["npm", "run", "dev:prod"]
```

构建并运行：

```bash
docker build -t your-project .
docker run -p 9000:9000 --env-file .env your-project
```

## ⚠️ 注意事项

1. **安全性**：
   - 生产环境必须修改所有默认密钥和密码
   - 不要将 `.env` 文件提交到版本控制
   - 使用 HTTPS 保护 API 接口

2. **数据库**：
   - 定期备份数据
   - 使用连接池优化性能
   - 配置适当的索引

3. **日志**：
   - 配置日志级别
   - 定期清理日志文件
   - 使用日志收集工具

4. **监控**：
   - 配置健康检查接口
   - 监控系统性能
   - 设置告警机制

## 🤝 贡献

如果你在使用过程中发现问题或有改进建议，欢迎提交 Issue 或 Pull Request。

## 📄 许可证

本项目采用 UNLICENSED 许可证。

## 📞 联系方式

如有问题，请通过以下方式联系：

- 提交 Issue
- 发送邮件

---

**模板版本**: v0.3.3  
**最后更新**: 2026-03-08
