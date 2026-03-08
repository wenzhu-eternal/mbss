# MBSS 快速入门指南

## 🚀 快速开始

### 环境准备

```bash
# 检查 Node.js 版本
node --version  # 需要 v18.20.3+

# 检查 MySQL 版本
mysql --version  # 需要 v5.7+

# 检查 Redis 版本
redis-cli --version  # 需要 v6.0+
```

### 安装依赖

```bash
# 安装项目依赖
npm install

# 或使用 pnpm
pnpm install
```

### 配置数据库

1. 创建 MySQL 数据库:
```sql
CREATE DATABASE mbss CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 修改配置文件 `src/config/config.default.ts`:
```typescript
mysql: {
  type: 'mysql',
  host: '127.0.0.1',      // 修改为你的数据库地址
  port: 3306,              // 修改为你的数据库端口
  username: 'root',        // 修改为你的数据库用户名
  password: '888888',      // 修改为你的数据库密码
  database: 'mbss',        // 修改为你的数据库名称
}
```

### 启动服务

```bash
# 开发环境
npm run dev

# 生产环境
npm run dev:prod

# 或先构建再启动
npm run build
npm run dev:prod
```

服务将在 `http://localhost:9000` 启动。

## 📖 API 文档

访问 Swagger 文档: `http://localhost:9000/api-doc/`

## 🔑 默认账号

系统启动后会自动创建数据库表，你需要先添加用户：

```bash
# 使用 Swagger 文档或 Postman 添加管理员账号
POST http://localhost:9000/api/user/addUser

{
  "account": "admin",
  "password": "admin123",
  "phone": "13800138000",
  "emil": "admin@example.com",
  "role": 1
}
```

## 🎯 核心功能

### 1. 用户管理

#### 添加用户
```http
POST /api/user/addUser
Content-Type: application/json

{
  "account": "testuser",
  "password": "password123",
  "phone": "13900139000",
  "emil": "test@example.com",
  "role": 1
}
```

#### 查询用户列表
```http
GET /api/user/findUsers?page=1&pageSize=10
```

#### 更新用户
```http
POST /api/user/updataUser
Content-Type: application/json

{
  "id": 1,
  "account": "testuser",
  "password": "newpassword",
  "phone": "13900139000",
  "emil": "test@example.com",
  "role": 1
}
```

#### 启用/禁用用户
```http
GET /api/user/edUser?id=1
```

### 2. 角色管理

#### 添加角色
```http
POST /api/user/addRole
Content-Type: application/json

{
  "name": "管理员",
  "apiRoutes": ["/api/user/addUser", "/api/user/findUsers"]
}
```

#### 查询角色列表
```http
GET /api/user/findRoles?page=1&pageSize=10
```

#### 更新角色
```http
POST /api/user/updataRole
Content-Type: application/json

{
  "id": 1,
  "name": "超级管理员",
  "apiRoutes": ["/api/user/*"]
}
```

#### 启用/禁用角色
```http
GET /api/user/edRole?id=1
```

### 3. 认证登录

#### 用户登录
```http
POST /api/user/login
Content-Type: application/json

{
  "account": "admin",
  "password": "admin123"
}
```

#### 用户登出
```http
GET /api/user/loginOut
```

### 4. 文件上传

#### 上传文件
```http
POST /api/file/upload
Content-Type: multipart/form-data

file: [选择文件]
```

## 🔐 权限控制

### 白名单路由

以下路由无需认证即可访问：
- `/api/user/login` - 用户登录
- `/api/user/loginOut` - 用户登出
- `/api/file/upload` - 文件上传

### 权限配置

1. 创建角色时配置 `apiRoutes` 数组
2. 用户登录后获取 JWT Token
3. 每次请求自动验证用户权限
4. 角色中的 `apiRoutes` 决定用户可访问的接口

### Token 使用

登录成功后，Token 会自动存储在 Cookie 中：
- Cookie 名称: `token`
- 有效期: 7 天
- 存储: HttpOnly Cookie

## 🛠️ 开发命令

```bash
# 启动开发服务器
npm run dev

# 启动生产服务器
npm run dev:prod

# 构建项目
npm run build

# 运行测试
npm run test

# 运行 E2E 测试
npm run test:e2e

# 代码检查
npm run lint

# 代码格式化
npm run format
```

## 📁 项目结构

```
mbss/
├── src/
│   ├── common/          # 通用组件
│   │   ├── auth.guard.ts        # 权限守卫
│   │   ├── events.gateway.ts    # WebSocket
│   │   ├── http-exception.filter.ts  # 异常处理
│   │   ├── logger.middleware.ts  # 日志中间件
│   │   ├── response.interceptor.ts # 响应拦截
│   │   └── validation.pipe.ts   # 数据验证
│   ├── config/          # 配置文件
│   ├── modules/         # 业务模块
│   │   ├── file/        # 文件上传
│   │   └── user/        # 用户管理
│   ├── app.module.ts    # 主模块
│   └── main.ts          # 入口文件
└── package.json
```

## 🔧 配置说明

### 环境配置

```bash
# 开发环境
NODE_ENV=development

# 生产环境
NODE_ENV=production
```

### 数据库配置

修改 `src/config/config.default.ts`:

```typescript
mysql: {
  type: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: 'your_password',
  database: 'mbss',
  entities: ['**/*.entity{.ts,.js}'],
  synchronize: true,  // 自动同步数据库结构
  logging: true,       // 显示 SQL 日志
}
```

### Redis 配置

```typescript
redis: {
  config: {
    port: 6379,
    host: '127.0.0.1',
    password: '',  // 如果有密码请填写
  },
}
```

### 跨域配置

```typescript
cors: {
  credentials: true,
  origin: 'http://localhost:3000',  // 前端地址
  allowedHeaders: ['Content-Type', 'Accept'],
}
```

## 🐛 常见问题

### 数据库连接失败

**错误**: `connect ECONNREFUSED ::1:3306`

**解决**:
1. 检查 MySQL 服务是否启动
2. 确认配置中的数据库地址和端口
3. 尝试使用 `127.0.0.1` 代替 `localhost`

### Redis 连接失败

**错误**: Redis 连接超时

**解决**:
1. 检查 Redis 服务是否启动
2. 确认 Redis 配置正确
3. 检查防火墙设置

### Token 验证失败

**错误**: `没有授权，请先登录`

**解决**:
1. 确保已登录并获取 Token
2. 检查 Token 是否过期（7天有效期）
3. 清除浏览器 Cookie 重新登录

### 权限不足

**错误**: `您的账号没有此接口权限`

**解决**:
1. 检查用户角色的 `apiRoutes` 配置
2. 确认当前请求路径在权限列表中
3. 联系管理员分配相应权限

## 📊 数据库表结构

### 用户表 (user)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 主键 |
| account | string | 账号 |
| password | string | 密码 |
| phone | string | 电话 |
| emil | string | 邮箱 |
| roleId | number | 角色ID |
| createTime | datetime | 创建时间 |
| updataTime | datetime | 更新时间 |
| lastLoginTime | datetime | 最后登录时间 |
| isDisable | boolean | 是否禁用 |

### 角色表 (role)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | number | 主键 |
| name | string | 角色名称 |
| apiRoutes | text | API路由权限(JSON数组) |
| createTime | datetime | 创建时间 |
| updataTime | datetime | 更新时间 |
| isDisable | boolean | 是否禁用 |

## 🔍 调试技巧

### 查看日志

应用启动后会显示详细的日志信息：
- 路由映射日志
- 数据库连接日志
- SQL 查询日志
- 错误信息

### 使用 Swagger 测试

1. 访问 `http://localhost:9000/api-doc/`
2. 展开需要测试的接口
3. 点击 "Try it out"
4. 填写参数
5. 点击 "Execute" 执行请求

### 数据库查询

```bash
# 连接数据库
mysql -u root -p

# 选择数据库
USE mbss;

# 查看用户
SELECT * FROM user;

# 查看角色
SELECT * FROM role;
```

## 📚 更多文档

- [完整技术文档](./PROJECT_DOCUMENTATION.md)
- [依赖升级报告](./DEPENDENCY_UPGRADE_REPORT.md)
- [NestJS 官方文档](https://docs.nestjs.com/)
- [TypeORM 官方文档](https://typeorm.io/)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目为私有项目，未经授权不得使用。

---

**快速入门指南 v1.0.0**  
**最后更新**: 2026-03-01
