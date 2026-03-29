# 后端架构设计方案

## 一、整体架构概览

```
mbss/
├── src/
│   ├── common/                    # 公共模块
│   │   ├── validators/            # 自定义验证器
│   │   ├── auth.guard.ts          # 全局权限守卫
│   │   ├── cache.*.ts             # 缓存相关
│   │   ├── errors.ts              # 错误定义
│   │   ├── events.gateway.ts      # WebSocket网关
│   │   ├── http-exception.filter.ts   # 全局异常过滤器
│   │   ├── logger.middleware.ts   # 日志中间件
│   │   ├── mail.service.ts        # 邮件服务
│   │   ├── response.interceptor.ts    # 响应拦截器
│   │   ├── sanitize.*.ts          # XSS清理相关
│   │   ├── tasks.service.ts       # 定时任务服务
│   │   └── validation.pipe.ts     # 验证管道
│   │
│   ├── config/                    # 配置模块
│   │   ├── config.default.ts      # 默认配置
│   │   ├── config.module.ts       # 配置模块
│   │   └── constant.ts            # 常量定义
│   │
│   ├── modules/                   # 业务模块
│   │   ├── controllers/           # 控制器层
│   │   ├── services/              # 服务层
│   │   ├── entities/              # 数据库实体
│   │   ├── dtos/                  # 数据传输对象
│   │   └── index.module.ts        # 模块聚合
│   │
│   ├── templates/                 # 模板文件
│   ├── utils/                     # 工具函数
│   ├── app.module.ts              # 应用根模块
│   └── main.ts                    # 应用入口
│
├── test/                          # 测试目录
│   ├── unit/                      # 单元测试
│   │   ├── common/                # 公共模块单元测试
│   │   └── services/              # 服务层单元测试
│   └── app.e2e-spec.ts            # E2E测试
│
├── .env                           # 环境变量配置
└── package.json                   # 项目配置
```

---

## 二、分层架构

### 2.1 架构分层

```
┌─────────────────────────────────────────────────────────┐
│                    Controller 层                         │
│              (接收请求、参数验证、调用服务)                │
├─────────────────────────────────────────────────────────┤
│                     Service 层                           │
│              (业务逻辑、数据处理、事务管理)                │
├─────────────────────────────────────────────────────────┤
│                     Entity 层                            │
│              (数据库实体、ORM映射、表结构定义)             │
├─────────────────────────────────────────────────────────┤
│                     DTO 层                               │
│              (数据传输对象、参数验证、类型定义)            │
└─────────────────────────────────────────────────────────┘
```

### 2.2 各层职责

| 层级           | 目录           | 职责                                          |
| -------------- | -------------- | --------------------------------------------- |
| **Controller** | `controllers/` | 接收HTTP请求、参数校验、调用Service、返回响应 |
| **Service**    | `services/`    | 业务逻辑处理、数据库操作、事务管理            |
| **Entity**     | `entities/`    | 数据库表映射、字段定义、关联关系              |
| **DTO**        | `dtos/`        | 请求数据结构、参数验证规则、API文档定义       |

---

## 三、模块结构

### 3.1 模块级标准结构

```
modules/
├── controllers/           # 控制器
│   └── [module].ts        # 模块控制器
├── services/              # 服务
│   └── [module].ts        # 模块服务
├── entities/              # 实体
│   └── [module].ts        # 模块实体
├── dtos/                  # 数据传输对象
│   ├── common.ts          # 通用DTO
│   └── [module].ts        # 模块DTO
└── index.module.ts        # 模块聚合
```

### 3.2 模块文件职责

| 文件               | 职责                                      |
| ------------------ | ----------------------------------------- |
| `controllers/`     | 定义API路由、接收请求、参数验证、调用服务 |
| `services/`        | 实现业务逻辑、数据库操作、事务管理        |
| `entities/`        | 定义数据库表结构、字段映射、实体关联      |
| `dtos/`            | 定义请求/响应数据结构、参数验证规则       |
| `index.module.ts`  | 聚合模块所有组件、配置依赖注入            |

---

## 四、控制器层 (Controller)

### 4.1 控制器规范

```typescript
@ApiTags('用户')
@Controller('user')
export default class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: '添加用户' })
  @Post('addUser')
  async addUser(@Body() addUserDto: AddUserDto): Promise<unknown>;

  @ApiOperation({ summary: '查看所有用户' })
  @Get('findUsers')
  async findUsers(@Query() pageDto: PageDto): Promise<unknown>;

  @ApiOperation({ summary: '登录' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Req() request, @Res() response, @Body() loginDto: LoginDto): Promise<unknown>;
}
```

### 4.2 控制器规范要点

| 规范           | 说明                                        |
| -------------- | ------------------------------------------- |
| **装饰器**     | 使用 `@ApiTags` 标注模块名称                |
| **路由前缀**   | 使用 `@Controller('xxx')` 定义路由前缀      |
| **API文档**    | 使用 `@ApiOperation` 描述接口功能           |
| **参数装饰器** | `@Body()`、`@Query()`、`@Param()`、`@Req()` |
| **限流**       | 敏感接口使用 `@Throttle()` 装饰器           |

### 4.3 常用装饰器

| 装饰器        | 用途         | 示例                    |
| ------------- | ------------ | ----------------------- |
| `@Get()`      | GET请求      | `@Get('findUsers')`     |
| `@Post()`     | POST请求     | `@Post('addUser')`      |
| `@Body()`     | 获取请求体   | `@Body() dto: AddUserDto` |
| `@Query()`    | 获取查询参数 | `@Query() dto: PageDto` |
| `@Param()`    | 获取路径参数 | `@Param('id') id: number` |
| `@Throttle()` | 限流         | `@Throttle({ default: { limit: 5, ttl: 60000 } })` |

### 4.4 API 定义规范

#### 4.4.1 路由命名规范

| 操作类型  | 命名格式                 | 示例                       |
| --------- | ------------------------ | -------------------------- |
| 查询列表  | `find{Resource}s`        | `findUsers`、`findRoles`   |
| 查询单条  | `find{Resource}`         | `findUser`、`findRole`     |
| 添加      | `add{Resource}`          | `addUser`、`addRole`       |
| 更新      | `update{Resource}`       | `updateUser`、`updateRole` |
| 启用/禁用 | `toggle{Resource}Status` | `toggleUserStatus`         |
| 删除      | `delete{Resource}`       | `deleteUser`               |

#### 4.4.2 HTTP 方法选择

| 操作类型  | HTTP 方法 | 说明                |
| --------- | --------- | ------------------- |
| 查询      | `GET`     | 参数通过 Query 传递 |
| 添加      | `POST`    | 参数通过 Body 传递  |
| 更新      | `POST`    | 参数通过 Body 传递  |
| 启用/禁用 | `GET`     | 参数通过 Query 传递 |

#### 4.4.3 响应格式规范

```typescript
// 成功响应
{ statusCode: 0, message: '请求成功', data: { ... } }

// 失败响应
{ statusCode: 400, message: '用户名不能重复' }
```

---

## 五、服务层 (Service)

### 5.1 服务规范

```typescript
@Injectable()
export default class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async addUser(addUserDto: AddUserDto): Promise<boolean>;
  async findUsers(pageDto: PageDto): Promise<{ list: User[], total: number }>;
  async toggleUserStatus(id: number): Promise<boolean>;
}
```

### 5.2 服务规范要点

| 规范         | 说明                                  |
| ------------ | ------------------------------------- |
| **装饰器**   | 使用 `@Injectable()` 标注为可注入服务 |
| **依赖注入** | 通过 `constructor` 注入 Repository    |
| **错误处理** | 使用 `HttpException` 抛出标准错误     |
| **事务**     | 复杂操作使用 `@Transaction()` 装饰器  |

### 5.3 常用 Repository 方法

| 方法                   | 用途          |
| ---------------------- | ------------- |
| `findOne()`            | 查询单条记录  |
| `find()`               | 查询多条记录  |
| `findAndCount()`       | 分页查询      |
| `save()`               | 保存/更新记录 |
| `update()`             | 更新记录      |

### 5.4 软删除规范

项目采用**软删除**机制，通过 `isDisable` 字段控制记录状态。

| 方式      | 字段                 | 说明                          |
| --------- | -------------------- | ----------------------------- |
| 启用/禁用 | `isDisable: boolean` | `false` = 启用，`true` = 禁用 |

**查询时必须检查启用状态：**

```typescript
// 查询单条时，必须检查 isDisable 状态
const user = await this.userRepository.findOne({
  where: { id: userId, isDisable: false },
});

// 管理后台查询 - 不过滤状态，展示所有记录
const [users, total] = await this.userRepository.findAndCount({ skip, take: pageSize });
```

**禁止物理删除：**

```typescript
// 错误：物理删除
await this.userRepository.delete(id);

// 正确：软删除
await this.userRepository.update({ id }, { isDisable: true, updateTime: new Date() });
```

---

## 六、实体层 (Entity)

### 6.1 实体规范

```typescript
@Entity({ name: 'user' })
export default class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ comment: '账号' })
  account: string;

  @Column({ select: false })
  password: string;

  @ManyToOne(() => RoleEntity, role => role.users)
  role: RoleEntity;

  @Column({ readonly: true })
  createTime: Date;

  @Column({ nullable: true })
  updateTime: Date;

  @Index()
  @Column({ default: false })
  isDisable: boolean;
}
```

### 6.2 实体规范要点

| 规范           | 说明                                          |
| -------------- | --------------------------------------------- |
| **表名**       | 使用 `@Entity({ name: 'xxx' })` 定义          |
| **主键**       | 使用 `@PrimaryGeneratedColumn()`              |
| **索引**       | 使用 `@Index()` 标注需要索引的字段            |
| **关联关系**   | `@ManyToOne`、`@OneToMany`、`@OneToOne`       |
| **敏感字段**   | 使用 `select: false` 隐藏（如密码）           |
| **软删除字段** | 每个实体必须包含 `isDisable` 字段             |

### 6.3 常用装饰器

| 装饰器                      | 用途         |
| --------------------------- | ------------ |
| `@Entity()`                 | 定义数据库表 |
| `@PrimaryGeneratedColumn()` | 自增主键     |
| `@Column()`                 | 普通字段     |
| `@Index()`                  | 索引         |
| `@ManyToOne()`              | 多对一关系   |
| `@OneToMany()`              | 一对多关系   |

### 6.4 实体修改的线上兼容方案

| 步骤 | 操作       | 说明                               |
| ---- | ---------- | ---------------------------------- |
| 1    | 新增字段   | 设置 `nullable: true` 或 `default` |
| 2    | 部署代码   | 确保新字段不影响旧功能             |
| 3    | 数据迁移   | 编写脚本迁移旧数据到新字段         |
| 4    | 切换逻辑   | 代码切换到使用新字段               |
| 5    | 删除旧字段 | 确认无问题后，下个版本删除旧字段   |

**禁止事项：**

| 禁止操作           | 替代方案              |
| ------------------ | --------------------- |
| 直接删除字段       | 标记废弃，保留字段    |
| 直接修改字段类型   | 新增字段，迁移数据    |
| 修改必填字段为非空 | 保持 `nullable: true` |

---

## 七、DTO层 (Data Transfer Object)

### 7.1 DTO规范

```typescript
export class AddUserDto {
  @ApiProperty({ description: '用户名' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(3, 20)
  readonly account: string;

  @ApiPropertyOptional({ description: '密码' })
  @IsOptional()
  readonly password?: string;

  @ApiProperty({ description: '权限ID' })
  @IsNotEmpty()
  @IsNumber()
  readonly roleId: number;
}

export class UpdateUserDto extends PartialType(AddUserDto) {
  @ApiProperty({ description: '用户ID' })
  @IsNotEmpty()
  readonly id: number;
}
```

### 7.2 DTO规范要点

| 规范           | 说明                                   |
| -------------- | -------------------------------------- |
| **API文档**    | 使用 `@ApiProperty()` 描述字段         |
| **验证装饰器** | 使用 `class-validator` 装饰器验证参数  |
| **继承**       | 相似DTO使用继承减少重复代码            |
| **只读属性**   | 使用 `readonly` 确保数据不可变         |

### 7.3 常用验证装饰器

| 装饰器          | 用途       |
| --------------- | ---------- |
| `@IsNotEmpty()` | 非空验证   |
| `@IsOptional()` | 可选字段   |
| `@IsString()`   | 字符串类型 |
| `@IsNumber()`   | 数字类型   |
| `@IsEmail()`    | 邮箱格式   |
| `@Length()`     | 长度范围   |

### 7.4 通用 DTO

```typescript
// dtos/common.ts
export class PageDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  readonly page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  readonly pageSize?: number;
}

export class IdDto {
  @ApiProperty({ description: 'ID' })
  @IsNotEmpty()
  @IsNumber()
  readonly id: number;
}
```

---

## 八、公共模块 (Common)

### 8.1 公共模块结构

```
common/
├── validators/                # 自定义验证器
├── auth.guard.ts              # 全局权限守卫
├── cache.*.ts                 # 缓存相关（装饰器、拦截器、服务）
├── errors.ts                  # 错误定义
├── events.gateway.ts          # WebSocket网关
├── http-exception.filter.ts   # 全局异常过滤器
├── logger.middleware.ts       # 日志中间件
├── mail.service.ts            # 邮件服务
├── response.interceptor.ts    # 响应拦截器
├── sanitize.*.ts              # XSS清理相关
├── tasks.service.ts           # 定时任务服务
└── validation.pipe.ts         # 验证管道
```

### 8.2 公共组件职责

| 组件                       | 职责                                    |
| -------------------------- | --------------------------------------- |
| `auth.guard.ts`            | 全局权限守卫，验证Token、检查路由白名单 |
| `http-exception.filter.ts` | 全局异常过滤器，统一错误响应格式        |
| `response.interceptor.ts`  | 响应拦截器，统一响应格式                |
| `logger.middleware.ts`     | 日志中间件，记录请求日志                |
| `validation.pipe.ts`       | 验证管道，自动验证请求参数              |
| `sanitize.pipe.ts`         | XSS清理管道，防止XSS攻击                |
| `cache.service.ts`         | 缓存服务，Redis缓存封装                 |
| `mail.service.ts`          | 邮件服务，发送通知邮件                  |
| `events.gateway.ts`        | WebSocket网关，实时通信                 |
| `tasks.service.ts`         | 定时任务服务，数据库备份                |

### 8.3 权限守卫

```typescript
@Injectable()
export default class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // 白名单路由直接放行
    if (this.isWhitelisted(request.url)) return true;
    // 验证Token
    return await this.authService.validateToken(request);
  }
}
```

---

## 九、配置模块 (Config)

### 9.1 配置结构

```typescript
export default defineConfig({
  projectName: 'mbs',

  // CORS配置
  allowOrigin: process.env.ALLOW_ORIGIN?.split(',') || 'http://localhost:3000',

  // 路由白名单（无需登录）
  routerWhitelist: ['user/login', 'user/weappLogin', 'error-log/reportError'],

  // JWT配置
  jwtSecret: {
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '7d' },
  },

  // MySQL配置
  mysql: {
    type: 'mysql',
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  },

  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});
```

### 9.2 配置项说明

| 配置项            | 说明                       |
| ----------------- | -------------------------- |
| `allowOrigin`     | CORS 允许的域名            |
| `routerWhitelist` | 无需登录的路由白名单       |
| `jwtSecret`       | JWT 密钥和过期时间         |
| `mysql`           | MySQL 数据库连接配置       |
| `redis`           | Redis 连接配置             |
| `session`         | Session 配置               |
| `mailer`          | 邮件服务配置               |

---

## 十、应用入口 (main.ts)

### 10.1 应用启动配置

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀
  app.setGlobalPrefix('api');

  // 启用 CORS
  app.enableCors({ origin: config.allowOrigin, credentials: true });

  // 全局管道（验证、XSS清理）
  app.useGlobalPipes(new ValidationPipe(), new SanitizePipe());

  // 全局过滤器、拦截器
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 静态资源
  app.useStaticAssets(join(__dirname, 'public'));

  await app.listen(9001);
}
```

---

## 十一、架构优势

| 特性           | 说明                                       |
| -------------- | ------------------------------------------ |
| **分层清晰**   | Controller-Service-Entity-DTO 四层架构     |
| **类型安全**   | 完整的 TypeScript 类型定义                 |
| **统一响应**   | 响应拦截器统一处理响应格式                 |
| **统一错误**   | 异常过滤器统一处理错误响应                 |
| **参数验证**   | DTO + class-validator 自动验证             |
| **XSS防护**    | 管道和中间件双重 XSS 清理                  |
| **权限控制**   | 全局守卫统一验证 Token                     |
| **缓存机制**   | Redis 缓存提升性能                         |
| **软删除**     | 数据安全，支持恢复                         |
| **API文档**    | Swagger 自动生成 API 文档                  |
