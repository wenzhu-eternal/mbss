# 环境变量配置说明

## 📋 概述

本项目使用 `dotenv` 包来管理环境变量，所有配置通过环境变量进行管理，符合12-Factor App安全原则。

## 🔧 配置文件

### 1. `.env` - 环境变量文件

- **用途**: 本地开发环境配置
- **优先级**: 最高
- **状态**: 已创建（不提交到git）
- **安全**: 包含敏感信息，不提交到版本控制

### 2. `.env.example` - 环境变量示例文件

- **用途**: 环境变量模板，供开发者参考
- **优先级**: 不参与实际加载
- **状态**: 已创建（提交到git）
- **安全**: 不包含真实密码和密钥

### 3. `src/config/config.default.ts` - 默认配置

- **用途**: 提供配置默认值和结构
- **优先级**: 最低（被环境变量覆盖）
- **状态**: 已配置
- **安全**: 不包含敏感信息

## 📝 环境变量说明

### 应用配置

| 变量名     | 说明     | 默认值        | 示例                         |
| ---------- | -------- | ------------- | ---------------------------- |
| `NODE_ENV` | 运行环境 | `development` | `development` / `production` |

### 跨域配置

| 变量名         | 说明           | 默认值                  | 示例                                            |
| -------------- | -------------- | ----------------------- | ----------------------------------------------- |
| `ALLOW_ORIGIN` | 允许的跨域来源 | `http://localhost:3000` | `http://localhost:3000` / `https://example.com` |

### JWT 配置

| 变量名       | 说明         | 默认值                | 示例              |
| ------------ | ------------ | --------------------- | ----------------- |
| `JWT_SECRET` | JWT 签名密钥 | `mbss-jwt-secret-key` | `your-secret-key` |

**⚠️ 重要**: 生产环境必须使用强密码！

### Session 配置

| 变量名           | 说明             | 默认值                    | 示例                  |
| ---------------- | ---------------- | ------------------------- | --------------------- |
| `SESSION_SECRET` | Session 签名密钥 | `mbss-session-secret-key` | `your-session-secret` |

**⚠️ 重要**: 生产环境必须使用强密码！

### 文件上传配置

| 变量名          | 说明         | 默认值      | 示例                             |
| --------------- | ------------ | ----------- | -------------------------------- |
| `FILE_DIR_NAME` | 文件上传目录 | `./uploads` | `./uploads` / `/var/www/uploads` |

### MySQL 配置

| 变量名           | 说明           | 默认值      | 示例                      |
| ---------------- | -------------- | ----------- | ------------------------- |
| `MYSQL_HOST`     | MySQL 主机地址 | `127.0.0.1` | `127.0.0.1` / `localhost` |
| `MYSQL_PORT`     | MySQL 端口     | `3306`      | `3306`                    |
| `MYSQL_USERNAME` | MySQL 用户名   | `root`      | `root` / `app_user`       |
| `MYSQL_PASSWORD` | MySQL 密码     | `888888`    | `your-password`           |
| `MYSQL_DATABASE` | MySQL 数据库名 | `mbss`      | `mbss`                    |

**⚠️ 重要**: 生产环境必须修改数据库密码！

### Redis 配置

| 变量名           | 说明           | 默认值      | 示例                      |
| ---------------- | -------------- | ----------- | ------------------------- |
| `REDIS_HOST`     | Redis 主机地址 | `127.0.0.1` | `127.0.0.1` / `localhost` |
| `REDIS_PORT`     | Redis 端口     | `6379`      | `6379`                    |
| `REDIS_PASSWORD` | Redis 密码     | `` (空)     | `your-redis-password`     |

**⚠️ 重要**: 生产环境建议设置 Redis 密码！

## 🚀 使用方法

### 开发环境

1. **使用默认配置**:

   ```bash
   # 推荐使用 pnpm
   pnpm run dev

   # 或使用 npm
   npm run dev
   ```

   - 自动加载 `.env` 文件
   - `NODE_ENV=development`

### 生产环境

**方式一：使用环境变量（推荐）**

1. **设置系统环境变量**:

   ```bash
   export NODE_ENV=production
   export JWT_SECRET=your-production-jwt-secret
   export SESSION_SECRET=your-production-session-secret
   export MYSQL_HOST=your-mysql-host
   export MYSQL_PASSWORD=your-mysql-password
   export REDIS_HOST=your-redis-host
   export REDIS_PASSWORD=your-redis-password
   export ALLOW_ORIGIN=https://your-frontend-domain.com
   ```

2. **构建并运行**:

   ```bash
   # 推荐使用 pnpm
   pnpm run build
   pnpm run dev:prod

   # 或使用 npm
   npm run build
   npm run dev:prod
   ```

**方式二：使用 .env 文件（不推荐生产环境）**

1. **准备环境配置**:

   ```bash
   cp .env.example .env
   ```

2. **修改配置**:

   ```bash
   # 编辑 .env 文件，设置生产环境配置：
   # - NODE_ENV=production
   # - JWT_SECRET (必须修改为强密码)
   # - SESSION_SECRET (必须修改为强密码)
   # - MYSQL_PASSWORD (必须修改)
   # - REDIS_PASSWORD (建议修改)
   # - ALLOW_ORIGIN (修改为实际的前端域名)
   # - MYSQL_HOST (修改为实际的数据库地址)
   # - REDIS_HOST (修改为实际的 Redis 地址)
   ```

3. **构建并运行**:

   ```bash
   # 推荐使用 pnpm
   pnpm run build
   pnpm run dev:prod

   # 或使用 npm
   npm run build
   npm run dev:prod
   ```

## 🔒 安全建议

### 1. 密码安全

**JWT_SECRET 和 SESSION_SECRET**:

- 生产环境必须使用强密码（至少 32 位随机字符）
- 不要使用默认值
- 不要在代码中硬编码
- 不要提交到版本控制系统

**生成强密码的方法**:

```bash
# 使用 OpenSSL 生成随机密钥
openssl rand -base64 32

# 使用 Node.js 生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. 数据库安全

- 使用强密码
- 限制数据库访问权限
- 使用 SSL 连接（生产环境）
- 定期备份数据

### 3. Redis 安全

- 设置 Redis 密码
- 限制 Redis 访问权限
- 使用 Redis 6.0+ 的 ACL 功能
- 不要暴露 Redis 端口到公网

### 4. 文件权限

确保 `.env` 文件权限正确：

```bash
chmod 600 .env
```

## 📦 配置加载顺序

dotenv 默认按以下顺序加载环境变量：

1. `.env` 文件
2. 系统环境变量
3. 代码中的默认值

**优先级**: 系统环境变量 > `.env` 文件 > 代码默认值

## 🧪 测试环境变量

创建测试脚本验证环境变量是否正确加载：

```javascript
// test-env.js
require('dotenv').config();
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MYSQL_HOST:', process.env.MYSQL_HOST);
```

运行测试：

```bash
node test-env.js
```

## 📝 配置示例

### 开发环境示例 (.env)

```bash
NODE_ENV=development
ALLOW_ORIGIN=http://localhost:3000
JWT_SECRET=mbss-jwt-secret-key-dev
SESSION_SECRET=mbss-session-secret-key-dev
FILE_DIR_NAME=./uploads
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USERNAME=root
MYSQL_PASSWORD=888888
MYSQL_DATABASE=mbss
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 生产环境示例 (.env)

```bash
NODE_ENV=production
ALLOW_ORIGIN=https://your-frontend-domain.com
JWT_SECRET=your-very-strong-jwt-secret-key-here
SESSION_SECRET=your-very-strong-session-secret-key-here
FILE_DIR_NAME=./uploads
MYSQL_HOST=your-production-mysql-host
MYSQL_PORT=3306
MYSQL_USERNAME=app_user
MYSQL_PASSWORD=your-strong-mysql-password
MYSQL_DATABASE=mbss
REDIS_HOST=your-production-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-strong-redis-password
```

## ⚠️ 常见问题

### 1. 环境变量未生效

**原因**:

- `.env` 文件不存在
- `.env` 文件格式错误
- `dotenv.config()` 未在应用启动时调用

**解决方法**:

- 确保 `.env` 文件存在
- 检查 `.env` 文件格式（不要有空格）
- 确认 `main.ts` 中调用了 `dotenv.config()`

### 2. 生产环境配置错误

**原因**:

- 使用了开发环境的配置
- 密码使用默认值

**解决方法**:

- 复制 `.env.production` 为 `.env`
- 修改所有敏感配置

### 3. 数据库连接失败

**原因**:

- 环境变量配置错误
- 数据库服务未启动
- 网络连接问题

**解决方法**:

- 检查 `.env` 中的数据库配置
- 确认数据库服务正在运行
- 测试数据库连接

## 📚 相关文档

- [dotenv 官方文档](https://github.com/motdotla/dotenv)
- [项目优化报告](./OPTIMIZATION_REPORT.md)
- [快速入门指南](./QUICK_START.md)
- [项目文档](./PROJECT_DOCUMENTATION.md)

## 🔄 更新日志

### 2026-03-08

- ✅ 添加 `dotenv` 包
- ✅ 在 `main.ts` 中配置环境变量加载
- ✅ 创建 `.env.example` 模板文件
- ✅ 创建 `.env.development` 开发环境配置
- ✅ 创建 `.env.production` 生产环境配置
- ✅ 更新 `.gitignore` 忽略环境变量文件
- ✅ 创建环境变量配置说明文档

---

**文档版本**: v1.0.0  
**最后更新**: 2026-03-08
