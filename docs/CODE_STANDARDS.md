# 代码规范文档 (CODE_STANDARDS)

本文档定义了项目的代码规范，确保代码风格一致性、可维护性和高质量。

## 目录

- [导入顺序规范](#导入顺序规范)
- [命名规范](#命名规范)
- [代码风格规范](#代码风格规范)
- [TypeScript 最佳实践](#typescript-最佳实践)
- [NestJS 最佳实践](#nestjs-最佳实践)
- [注释规范](#注释规范)
- [错误处理规范](#错误处理规范)
- [测试规范](#测试规范)
- [ESLint 和 Prettier 配置](#eslint-和-prettier-配置)

---

## 导入顺序规范

### 导入分组顺序

导入语句必须按照以下顺序排列（使用 `simple-import-sort` 插件自动管理）：

1. **外部依赖** - Node.js 内置模块和第三方 npm 包
2. **内部模块** - 项目内部的模块（使用 `@/` 别名）
3. **相对路径** - 同级或上级目录的文件

### 示例

```typescript
// 1. 外部依赖（Node.js 内置模块和第三方包）
import { Controller, Get, Post, Body } from '@nestjs/common';
import { Injectable } from '@nestjs/core';
import { IsString, IsEmail } from 'class-validator';
import axios from 'axios';
import { join } from 'path';

// 2. 内部模块（使用别名）
import { UserService } from '@/modules/user/user.service';
import { AuthService } from '@/modules/auth/auth.service';
import { LoggerMiddleware } from '@/common/logger.middleware';

// 3. 相对路径
import { UserDto } from './user.dto';
import { UserEntity } from './user.entity';
```

### 导入规则

- ✅ 使用 `eslint-plugin-simple-import-sort` 自动排序
- ✅ 每个分组之间用空行分隔
- ✅ 同一分组内按字母顺序排列
- ❌ 禁止重复导入同一模块
- ❌ 禁止使用无用的路径片段（如 `./../file` 应改为 `../file`）

### 导出规范

- 使用命名导出（Named Exports）而非默认导出
- 导出语句应按字母顺序排列
- 使用 `simple-import-sort/exports` 规则自动排序

---

## 命名规范

### 文件命名

- 使用 **kebab-case**（短横线命名法）
- 示例：`user.service.ts`、`auth.controller.ts`、`api-routes.ts`

### 类命名

- 使用 **PascalCase**（帕斯卡命名法）
- 示例：`UserService`、`AuthController`、`HttpExceptionFilter`

### 接口命名

- 使用 **PascalCase**，并以 `I` 前缀开头
- 示例：`IUserRepository`、`IAuthService`

### 函数/方法命名

- 使用 **camelCase**（驼峰命名法）
- 使用动词开头，描述函数行为
- 示例：`getUserById()`、`createUser()`、`validateEmail()`

### 变量命名

- 使用 **camelCase**
- 布尔值变量应以 `is`、`has`、`can`、`should` 开头
- 示例：`userName`、`isActive`、`hasPermission`

### 常量命名

- 使用 **SCREAMING_SNAKE_CASE**（大写下划线命名法）
- 示例：`MAX_RETRY_COUNT`、`DEFAULT_TIMEOUT`

### 私有成员命名

- 使用 **camelCase**，并以 `_` 前缀开头
- 示例：`_privateMethod()`、`_privateProperty`

### DTO 命名

- 使用 **PascalCase**，以 `Dto` 后缀结尾
- 示例：`CreateUserDto`、`UpdateUserDto`

### Entity 命名

- 使用 **PascalCase**，以 `Entity` 后缀结尾
- 示例：`UserEntity`、`RoleEntity`

---

## 代码风格规范

### 基本规则

- 使用 **2 空格缩进**，不使用 Tab
- 使用 **单引号** `'` 而非双引号 `"`
- 语句末尾必须添加 **分号** `;`
- 每行最大长度 **100 字符**
- 使用 **LF** 换行符（Unix 风格）

### 空格和空行

- 操作符前后添加空格：`a + b`、`x = 5`
- 逗号后添加空格：`[1, 2, 3]`
- 函数参数之间添加空格：`function(a, b, c)`
- 代码块之间添加一个空行
- 文件末尾不添加空行

### 对象和数组

- 对象属性使用简写：`{ name, age }` 而非 `{ name: name, age: age }`
- 对象方法使用简写：`{ method() {} }` 而非 `{ method: function() {} }`
- 数组和对象解构优先使用对象解构

### 条件语句

- 始终使用大括号，即使只有一行代码
- 使用 `===` 和 `!==` 而非 `==` 和 `!=`
- 避免嵌套三元运算符
- 避免不必要的 `else-return`

### 函数

- 优先使用箭头函数
- 使用模板字符串而非字符串拼接
- 避免使用 `var`，使用 `const` 或 `let`
- 优先使用 `const`，只有在需要重新赋值时使用 `let`

### 箭头函数括号规则

- **Prettier 配置**：`arrowParens: "avoid"`
- **ESLint 规则**：`arrow-parens: "off"`（已关闭，避免与 Prettier 冲突）
- 单个参数的箭头函数不需要括号：`x => x + 1`
- 多个参数的箭头函数需要括号：`(x, y) => x + y`

### 示例

```typescript
// ✅ 好的示例
const getUserById = async (id: string): Promise<UserEntity> => {
  const user = await this.userRepository.findOne(id);
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;
};

// ✅ 箭头函数括号示例（Prettier 自动格式化）
const add = (a: number, b: number): number => a + b;
const double = (x: number): number => x * 2;

// ❌ 不好的示例
function getUserById(id) {
  var user = this.userRepository.findOne(id);
  if (user == null) {
    throw new NotFoundException("User not found");
  }
  return user;
}
```

---

## TypeScript 最佳实践

### 类型定义

- 优先使用接口（Interface）定义对象类型
- 使用类型别名（Type Alias）定义联合类型、交叉类型
- 避免使用 `any` 类型，使用 `unknown` 替代
- 使用泛型提高代码复用性

### 类型注解

- 函数参数和返回值必须添加类型注解
- 复杂对象使用接口定义
- 使用枚举（Enum）定义固定常量集

### 类型守卫

- 使用类型守卫（Type Guards）进行类型检查
- 使用 `is` 关键字定义类型谓词

### 示例

```typescript
// ✅ 好的示例
interface User {
  id: string;
  name: string;
  email: string;
}

type UserRole = 'admin' | 'user' | 'guest';

function isAdmin(user: User): user is User & { role: 'admin' } {
  return user.role === 'admin';
}

// ❌ 不好的示例
function getUser(id: any): any {
  return { id, name: 'John' };
}
```

### 严格模式

- 启用 TypeScript 严格模式
- 配置 `noUnusedLocals` 和 `noUnusedParameters`
- 使用 `strictNullChecks` 检查空值

---

## NestJS 最佳实践

### 模块组织

- 按功能模块组织代码
- 每个模块包含：`controller`、`service`、`dto`、`entity`
- 使用 `@Module` 装饰器定义模块

### 依赖注入

- 使用构造函数注入依赖
- 使用 `@Injectable()` 装饰器标记服务
- 使用 `@Inject()` 装饰器注入自定义提供者

### 控制器

- 使用装饰器定义路由：`@Get()`、`@Post()`、`@Put()`、`@Delete()`
- 使用 DTO 进行请求体验证
- 使用 `@UseGuards()` 装饰器添加守卫
- 使用 `@UseInterceptors()` 装饰器添加拦截器

### 服务

- 服务类使用 `@Injectable()` 装饰器
- 业务逻辑放在服务层
- 使用 `@InjectRepository()` 注入 TypeORM 仓库

### 异常处理

- 使用 NestJS 内置异常类
- 创建自定义异常过滤器
- 使用 `@Catch()` 装饰器捕获异常

### 示例

```typescript
// ✅ 好的示例
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserEntity> {
    return this.userService.findOne(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.userService.create(createUserDto);
  }
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
```

---

## 注释规范

### JSDoc 注释

- 为公共 API 添加 JSDoc 注释
- 描述函数用途、参数、返回值
- 使用 `@param`、`@returns`、`@throws` 标签

### 行内注释

- 只在必要时添加行内注释
- 注释应解释"为什么"而非"是什么"
- 保持注释简洁明了

### TODO 注释

- 使用 `// TODO:` 标记待办事项
- 包含责任人或截止日期

### 示例

```typescript
/**
 * 根据用户 ID 获取用户信息
 * @param id - 用户 ID
 * @returns 用户实体
 * @throws NotFoundException - 用户不存在时抛出
 */
async findOne(id: string): Promise<UserEntity> {
  const user = await this.userRepository.findOne({ where: { id } });
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return user;
}

// TODO: 添加缓存机制以提高性能 - @张三 2024-01-01
```

---

## 错误处理规范

### 异常处理

- 使用 `try-catch` 捕获同步和异步错误
- 使用 `async/await` 处理异步操作
- 抛出有意义的异常信息

### 异常类型

- 使用 NestJS 内置异常类
- 创建自定义异常类
- 使用 HTTP 状态码

### 日志记录

- 使用 NestJS Logger 记录错误
- 记录错误堆栈信息
- 区分不同日志级别

### 示例

```typescript
async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
  try {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  } catch (error) {
    this.logger.error(`Failed to create user: ${error.message}`, error.stack);
    throw new InternalServerErrorException('Failed to create user');
  }
}
```

---

## 测试规范

### 单元测试

- 使用 Jest 框架
- 测试文件以 `.spec.ts` 结尾
- 使用 `describe`、`it`、`expect` 组织测试

### 测试覆盖率

- 目标覆盖率：80% 以上
- 关键业务逻辑覆盖率：100%

### 测试命名

- 使用描述性的测试名称
- 格式：`should [期望行为] when [条件]`

### 示例

```typescript
describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a user when user exists', async () => {
    const user = await service.findOne('1');
    expect(user).toBeDefined();
    expect(user.id).toBe('1');
  });
});
```

---

## ESLint 和 Prettier 配置

### 配置文件

- **ESLint 配置**：`eslint.config.mjs`（ESLint 9.x flat config 格式）
- **Prettier 配置**：`.prettierrc`

### 已安装的插件

- `@typescript-eslint/eslint-plugin` - TypeScript 支持
- `eslint-plugin-prettier` - Prettier 集成
- `eslint-plugin-simple-import-sort` - 导入排序

### 已关闭的规则（避免与 Prettier 冲突）

以下规则已关闭，让 Prettier 负责格式化：

1. **`no-confusing-arrow`** - 关闭，避免与箭头函数格式冲突
2. **`arrow-body-style`** - 关闭，允许 Prettier 处理箭头函数体
3. **`prefer-arrow-callback`** - 关闭，避免与回调函数格式冲突
4. **`arrow-parens`** - 关闭，让 Prettier 的 `arrowParens: "avoid"` 控制括号

### Prettier 配置详解

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "quoteProps": "as-needed"
}
```

### 配置说明

- **`printWidth: 100`** - 每行最大 100 字符，适合现代显示器和代码审查
- **`arrowParens: "avoid"`** - 箭头函数括号规则：
  - 单个参数不需要括号：`x => x + 1`
  - 多个参数需要括号：`(x, y) => x + y`
- **`trailingComma: "all"`** - 在对象和数组的最后一项也添加逗号
- **`singleQuote: true`** - 使用单引号而非双引号
- **`semi: true`** - 语句末尾添加分号
- **`tabWidth: 2`** - 使用 2 空格缩进
- **`endOfLine: "lf"`** - 使用 Unix 风格换行符

### 冲突处理原则

当 ESLint 和 Prettier 规则冲突时：
1. **优先 Prettier** - 负责代码格式化
2. **关闭 ESLint 格式化规则** - 避免冲突
3. **保留 ESLint 代码质量规则** - 检查潜在问题和错误

---

## 自动化工具

### ESLint

- 使用 ESLint 进行代码检查
- 配置文件：`eslint.config.mjs`
- 运行命令：`pnpm lint`

### Prettier

- 使用 Prettier 进行代码格式化
- 配置文件：`.prettierrc`
- 运行命令：`pnpm format`

### Git Hooks

- 使用 Husky 配置 Git hooks
- Pre-commit hook 自动运行 lint 和 format
- 自动修复可修复的问题

### 运行命令

```bash
# 检查代码规范
pnpm lint

# 自动修复代码问题
pnpm lint -- --fix

# 格式化代码
pnpm format
```

---

## 边缘案例和测试建议

### 导入顺序测试

- 测试混合导入（外部、内部、相对）
- 测试动态导入
- 测试类型导入

### 命名规范测试

- 测试各种命名约定
- 测试私有成员命名
- 测试常量命名

### 代码风格测试

- 测试空格和缩进
- 测试引号使用
- 测试分号使用

### TypeScript 类型测试

- 测试类型推断
- 测试泛型使用
- 测试类型守卫

### NestJS 最佳实践测试

- 测试依赖注入
- 测试装饰器使用
- 测试异常处理

### 箭头函数测试

- 测试单个参数箭头函数：`x => x + 1`
- 测试多个参数箭头函数：`(x, y) => x + y`
- 测试箭头函数作为回调：`array.map(x => x * 2)`

---

## 总结

遵循本规范可以确保代码质量、可维护性和团队协作效率。所有代码在提交前必须通过 ESLint 和 Prettier 检查，并符合本规范要求。

如有疑问或建议，请联系团队负责人。
