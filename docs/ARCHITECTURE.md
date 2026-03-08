# MBSS 架构设计文档

## 📐 架构概览

### 系统定位

MBSS (Middle and Backstage Service) 是一个基于 NestJS 框架构建的企业级后端服务系统，采用模块化、分层架构设计，提供用户管理、权限控制、文件上传、实时通信等核心功能。

### 设计理念

1. **模块化设计**: 功能模块独立，低耦合高内聚
2. **分层架构**: 清晰的 Controller-Service-Repository 分层
3. **类型安全**: 全面的 TypeScript 类型定义
4. **RESTful API**: 标准化的接口设计
5. **安全性**: 多层次的安全防护机制
6. **可扩展性**: 易于扩展和维护的架构

## 🏗️ 架构模式

### 1. 分层架构

```
┌─────────────────────────────────────────┐
│         Client Layer (客户端)          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Presentation Layer (表现层)        │
│  - Controllers (控制器)                 │
│  - DTOs (数据传输对象)                  │
│  - Guards (守卫)                        │
│  - Interceptors (拦截器)                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       Business Layer (业务层)           │
│  - Services (服务)                      │
│  - Business Logic (业务逻辑)            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Data Access Layer (数据访问层)      │
│  - Repositories (仓储)                  │
│  - Entities (实体)                      │
│  - TypeORM (ORM框架)                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Infrastructure Layer (基础设施层)   │
│  - MySQL (数据库)                       │
│  - Redis (缓存)                         │
│  - File System (文件系统)               │
└─────────────────────────────────────────┘
```

### 2. 模块化架构

```
AppModule (根模块)
├── ConfigModule (配置模块)
│   ├── Database Config (数据库配置)
│   ├── Redis Config (Redis配置)
│   ├── JWT Config (JWT配置)
│   └── File Config (文件配置)
├── CommonModule (公共模块)
│   ├── AuthGuard (权限守卫)
│   ├── ResponseInterceptor (响应拦截器)
│   ├── HttpExceptionFilter (异常过滤器)
│   ├── ValidationPipe (验证管道)
│   ├── LoggerMiddleware (日志中间件)
│   └── EventsGateway (WebSocket网关)
└── BusinessModules (业务模块)
    ├── UserModule (用户模块)
    │   ├── UserController (用户控制器)
    │   ├── UserService (用户服务)
    │   ├── UserRepository (用户仓储)
    │   ├── RoleRepository (角色仓储)
    │   └── UserDTOs (用户DTO)
    └── FileModule (文件模块)
        ├── FileController (文件控制器)
        └── FileDTOs (文件DTO)
```

### 3. 依赖注入模式

采用 NestJS 的依赖注入（DI）模式，实现松耦合设计：

```typescript
// Service 依赖 Repository
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly jwtService: JwtService,
  ) {}
}

// Controller 依赖 Service
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
}

// Guard 依赖 Service
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}
}
```

## 🔐 安全架构

### 1. 多层次安全防护

```
┌─────────────────────────────────────────┐
│         外部请求                         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   CORS 跨域防护                          │
│   - 限制允许的来源                       │
│   - 限制允许的请求头                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   LoggerMiddleware (日志中间件)          │
│   - 记录请求日志                         │
│   - 审计追踪                             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   ValidationPipe (验证管道)              │
│   - 数据格式验证                         │
│   - 类型转换                             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   AuthGuard (权限守卫)                   │
│   - 白名单检查                           │
│   - Token 验证                           │
│   - 权限验证                             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   Controller (控制器)                   │
│   - 业务逻辑处理                         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   ResponseInterceptor (响应拦截器)       │
│   - 统一响应格式                         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│   HttpExceptionFilter (异常过滤器)       │
│   - 异常捕获与处理                       │
└─────────────────────────────────────────┘
```

### 2. 认证授权流程

#### JWT 认证机制

```
用户登录
    ↓
验证账号密码
    ↓
生成 JWT Token
    ↓
Token 存储到 Cookie 和 Session
    ↓
后续请求携带 Token
    ↓
AuthGuard 验证 Token
    ↓
解析 Token 获取用户信息
    ↓
检查用户角色权限
    ↓
允许或拒绝请求
```

#### 权限控制机制

```
1. 白名单路由：无需认证
   - /api/user/login
   - /api/user/loginOut
   - /api/file/upload

2. 非白名单路由：需要认证
   - 验证 Token 有效性
   - 检查 Token 是否过期
   - 验证 Session 一致性
   - 检查用户角色权限
```

### 3. 数据安全

- **密码加密**: 数据库中存储加密密码
- **SQL 注入防护**: 使用 TypeORM 参数化查询
- **XSS 防护**: 输入验证和输出编码
- **CSRF 防护**: Cookie 设置 HttpOnly
- **敏感信息过滤**: 响应中不返回密码等敏感信息

## 📡 通信架构

### 1. HTTP 通信

**RESTful API 设计**:

```
资源: 用户 (User)
├── POST   /api/user/addUser      # 创建用户
├── GET    /api/user/findUsers    # 查询用户列表
├── POST   /api/user/updataUser   # 更新用户
├── GET    /api/user/edUser       # 启用/禁用用户
├── POST   /api/user/login        # 用户登录
└── GET    /api/user/loginOut     # 用户登出

资源: 角色 (Role)
├── POST   /api/user/addRole      # 创建角色
├── GET    /api/user/findRoles    # 查询角色列表
├── POST   /api/user/updataRole   # 更新角色
└── GET    /api/user/edRole       # 启用/禁用角色

资源: 文件 (File)
└── POST   /api/file/upload       # 上传文件
```

### 2. WebSocket 通信

**实时通信架构**:

```
客户端
    ↓
建立 WebSocket 连接
    ↓
EventsGateway 处理连接
    ↓
存储连接信息到 Redis
    ↓
支持实时消息推送
    ↓
客户端断开连接
    ↓
清理 Redis 中的连接信息
```

**WebSocket 事件**:

```typescript
// 客户端发送
{
  event: 'addSocket',
  data: { userId: 1 }
}

// 服务端响应
{
  event: 'message',
  data: { content: 'Hello' }
}
```

### 3. 响应格式

**统一响应结构**:

```typescript
// 成功响应
{
  statusCode: 0,                    // 0 表示成功
  timestamp: "2026-03-01T10:38:48.038Z",
  path: "/api/user/findUsers",
  message: "请求成功",
  data: {
    // 业务数据
  }
}

// 错误响应
{
  statusCode: 400,                  // 非 0 表示失败
  timestamp: "2026-03-01T10:38:48.038Z",
  path: "/api/user/findUsers",
  message: "请求失败",
  data: "页码必须是数字"              // 错误详情
}
```

## 💾 数据架构

### 1. 数据库设计

**关系型数据库 (MySQL)**:

```
用户表 (user)
├── id (主键)
├── account (账号)
├── password (密码)
├── phone (电话)
├── email (邮箱)
├── roleId (外键 -> role.id)
├── createTime (创建时间)
├── updateTime (更新时间)
├── lastLoginTime (最后登录时间)
└── isDisable (是否禁用)

角色表 (role)
├── id (主键)
├── name (角色名称)
├── apiRoutes (API路由权限 JSON)
├── createTime (创建时间)
├── updateTime (更新时间)
└── isDisable (是否禁用)

关系: user.roleId -> role.id (N:1)
```

### 2. ORM 映射

**TypeORM 实体映射**:

```typescript
// 用户实体
@Entity({ name: 'user' })
export default class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  account: string;

  @Column({ select: false }) // 查询时不返回密码
  password: string;

  @ManyToOne(() => RoleEntity)
  role: RoleEntity; // 关联角色

  // ... 其他字段
}

// 角色实体
@Entity({ name: 'role' })
export default class RoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  users: UserEntity[]; // 关联用户

  // ... 其他字段
}
```

### 3. 缓存架构

**Redis 缓存策略**:

```
Redis 数据结构:
├── Hash: socket
│   └── { userId: JSON.stringify({ socketId: string }) }
└── 可扩展:
    ├── 用户会话缓存
    ├── API 响应缓存
    └── 权限缓存
```

## 🔄 请求处理流程

### 1. HTTP 请求流程

```
客户端请求
    ↓
CORS 跨域检查
    ↓
LoggerMiddleware (记录日志)
    ↓
ValidationPipe (数据验证)
    ↓
AuthGuard (权限验证)
    ↓
Controller (控制器)
    ↓
Service (业务逻辑)
    ↓
Repository (数据访问)
    ↓
Database (数据库)
    ↓
Repository (返回数据)
    ↓
Service (处理数据)
    ↓
Controller (返回结果)
    ↓
ResponseInterceptor (统一格式)
    ↓
HttpExceptionFilter (异常处理)
    ↓
客户端响应
```

### 2. WebSocket 连接流程

```
客户端连接
    ↓
EventsGateway 接收连接
    ↓
客户端发送 addSocket 事件
    ↓
验证用户信息
    ↓
存储连接信息到 Redis
    ↓
建立双向通信
    ↓
客户端发送 deleteSocket 事件
    ↓
清理 Redis 连接信息
    ↓
关闭连接
```

## 🎯 设计模式

### 1. 单例模式

NestJS 的 Provider 默认为单例，确保全局唯一：

```typescript
@Injectable()
export class UserService {
  // 整个应用只有一个实例
}
```

### 2. 工厂模式

使用工厂函数动态创建配置：

```typescript
TypeOrmModule.forRootAsync({
  useFactory: (config: ConfigService) => config.get('config.default').mysql,
  inject: [ConfigService],
});
```

### 3. 策略模式

不同的验证策略：

```typescript
// 白名单验证
if (this.hasUrl(this.urlList, request.url)) {
  return true;
}

// 权限验证
return await this.userService.AuthService(request);
```

### 4. 装饰器模式

使用装饰器声明元数据：

```typescript
@Controller('user')          // 路由装饰器
@ApiOperation({ summary: '添加用户' })  // API 文档装饰器
@Post('addUser')             // 方法装饰器
async addUser(@Body() addUserDto: AddUserDto) {
  // ...
}
```

### 5. 中间件模式

请求处理链：

```
Request → Middleware1 → Middleware2 → ... → Controller
```

## 🚀 性能优化架构

### 1. 数据库优化

```
查询优化:
├── 索引优化 (主键、唯一键)
├── 分页查询 (skip, take)
├── 关联查询优化 (relations)
├── 查询缓存 (cache: true)
└── 连接池管理
```

### 2. 缓存策略

```
缓存层次:
├── Redis 缓存
│   ├── Socket 连接信息
│   ├── 用户会话
│   └── API 响应缓存 (可扩展)
└── 应用缓存
    ├── 实体缓存
    └── 查询结果缓存
```

### 3. 异步处理

```
异步操作:
├── 异步数据库查询
├── 异步文件操作
├── 异步 Redis 操作
└── 异步 HTTP 请求
```

## 📦 模块设计原则

### 1. 单一职责原则

每个模块只负责一个业务领域：

- UserModule: 用户管理
- FileModule: 文件上传
- CommonModule: 通用功能

### 2. 开闭原则

对扩展开放，对修改关闭：

- 新增模块不影响现有模块
- 通过装饰器扩展功能
- 配置驱动而非硬编码

### 3. 依赖倒置原则

依赖抽象而非具体实现：

```typescript
// 依赖 Repository 接口而非具体实现
@InjectRepository(UserEntity)
private readonly userRepository: Repository<UserEntity>
```

### 4. 接口隔离原则

DTO 设计遵循接口隔离：

```typescript
// 不同的 DTO 用于不同的场景
export class AddUserDto {}
export class UpdataUserDto {}
export class GetUsersDto {}
```

## 🔧 可扩展性设计

### 1. 水平扩展

```
应用服务器:
├── 实例 1 (端口 9000)
├── 实例 2 (端口 9001)
└── 实例 N (端口 900N)

负载均衡:
└── Nginx / HAProxy
```

### 2. 垂直扩展

```
数据库:
├── 读写分离
├── 主从复制
└── 分库分表

缓存:
├── Redis 集群
└── 分片策略
```

### 3. 功能扩展

```
新增模块:
1. 创建 Module
2. 定义 Entity
3. 创建 Controller
4. 实现 Service
5. 注册到 AppModule
```

## 📊 监控与日志

### 1. 日志系统

```
日志级别:
├── ERROR (错误)
├── WARN (警告)
├── INFO (信息)
└── LOG (调试)

日志内容:
├── 请求日志
├── 响应日志
├── 错误日志
└── SQL 日志
```

### 2. 监控指标

```
性能指标:
├── 响应时间
├── 请求量
├── 错误率
└── 资源使用率

业务指标:
├── 用户活跃度
├── API 调用量
└── 文件上传量
```

## 🎨 代码组织

### 1. 目录结构

```
src/
├── common/              # 公共组件
│   ├── guards/          # 守卫
│   ├── interceptors/    # 拦截器
│   ├── filters/         # 过滤器
│   ├── pipes/           # 管道
│   ├── middlewares/     # 中间件
│   └── gateways/        # 网关
├── config/              # 配置
├── modules/             # 业务模块
│   └── {module}/
│       ├── controllers/
│       ├── services/
│       ├── entities/
│       └── dtos/
├── app.module.ts        # 主模块
└── main.ts              # 入口
```

### 2. 命名规范

```
文件命名:
├── *.controller.ts     # 控制器
├── *.service.ts        # 服务
├── *.entity.ts         # 实体
├── *.dto.ts            # 数据传输对象
├── *.guard.ts          # 守卫
├── *.interceptor.ts    # 拦截器
├── *.filter.ts         # 过滤器
├── *.pipe.ts           # 管道
├── *.middleware.ts     # 中间件
└── *.gateway.ts        # 网关

类命名:
├── PascalCase          # 类名
├── camelCase           # 变量和方法
├── UPPER_CASE          # 常量
└── kebab-case          # 文件名
```

## 🌟 架构优势

### 1. 可维护性

- 清晰的分层结构
- 模块化设计
- 统一的代码规范

### 2. 可扩展性

- 易于添加新功能
- 支持水平扩展
- 灵活的配置管理

### 3. 可测试性

- 依赖注入便于测试
- 单元测试友好
- 集成测试支持

### 4. 安全性

- 多层次安全防护
- 完善的权限控制
- 数据安全保护

### 5. 性能

- 数据库优化
- 缓存策略
- 异步处理

---

**架构设计文档 v1.0.0**  
**最后更新**: 2026-03-08  
**架构师**: Development Team
