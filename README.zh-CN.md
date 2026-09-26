# IRIS Portico — 管理门户

> **Language / 语言**: [English](README.md) · [简体中文](README.zh-CN.md)

**IRIS Portico** 是面向 InterSystems IRIS 的**权限感知（permission-aware）管理门户**。

IRIS Portico 为管理员提供一个统一、安全、按角色感知的控制台，用于管理 IRIS SysAdmin API
（`/api/admin`）所暴露的一切，并重点覆盖现有门户普遍服务不足的两大领域：**安全与密钥
（security & secrets）** 以及统一的**日志中心（Log Center）**。

> **从零构建**，基于公开的
> [`sysadmin-api-specification`](https://github.com/intersystems-community/sysadmin-api-specification)
> 规范开发。

---

## 功能概览

本门户覆盖全部**六个核心功能领域**，并映射到 SysAdmin API：

| 功能领域 | 能做什么 | 对应 API |
|-----------|-----------------|-------------|
| **Web 应用与 REST** | 列出 / 创建 / 启用 Web 应用，查看 PCT 访问，管理 Web 会话与命名空间 | `/v2/web-apps`、`/v2/web-sessions`、`/v2/namespaces` |
| **权限管理** | 管理用户、角色、资源、服务、SQL 权限、Web 认证 | `/v2/security/users`、`/roles`、`/resources`、`/services`、`/sql-privileges` |
| **安全与密钥** | 钱包、X.509 凭据、OAuth 2.0（服务器 / 客户端 / 资源服务器）、SSL、加密、MFT/LDAP、superserver | `/v2/wallet`、`/v2/security/x509-credentials`、`/oauth2`、`/ssl-configurations` … |
| **任务管理** | 创建 / 编辑 / 删除定时任务，运行 / 挂起 / 恢复，查看历史与即将运行的计划，控制任务管理器 | `/v2/tasks`、`/v2/task`（CRUD）、`/v2/task/history`、`/v2/task/upcoming` |
| **系统管理** | 查看与控制进程、设备、系统用量、锁、数据库 | `/v2/processes`、`/v2/devices`、`/v2/monitor/*`、`/v2/locks`、`/v2/databases` |
| **日志** | **统一日志中心**，将系统状态 + 安全审计 + 日志（journal）活动聚合为一条按时间排序的流；并提供 **journal**（文件、文件详情、异步记录浏览器、设置）与 **audit**（启用开关、事件定义、异步记录查询、清理）的深入操作 | `/v2/journal/*`、`/v2/security/audit/*`、`/v2/monitor/*` |

此外还有一个专门的**异步任务中心（Async Task Center）**，用于长时运行操作
（`202 + Location` 模式），支持取消 / 暂停 / 恢复；以及一整套管理页面：

- **数据库（Databases）** — 本地数据库目录（`/v2/database-dir*`）：列出、
  配置、卷、运行时信息（异步）、维护（压缩 / 去碎片 / 完整性检查 / 挂载 /
  卸载）与容量管理（截断 / 扩容 / 卷扩容 / 创建 / 删除），外加
  config-database 的 CRUD（`/v2/database`）。
- **命名空间（Namespaces）**（`/v2/namespace*`）— 列出、详情、创建 / 删除，以及全部
  三类映射（routine / global / package：列出、详情、创建、删除），外加复制映射
  与启用 interop。
- **许可证（License）**（`/v2/license/*`）— 许可证密钥信息 / 校验 / 激活，
  许可证服务器列表 / 详情 / upsert / 删除，以及用量。
- **WQM**（`/v2/wqm-category*`）— 等待队列分类的列表、详情、upsert、删除。
- **ECP**（外部客户端协议，`/v2/ecp/*`）— 设置、数据服务器
  （详情、数据库、断开 / 禁用 / 常规操作、创建 / 删除）、应用服务器、
  SSL 连接（授权 / 拒绝 / 移除）。
- **语言服务器（Language Servers）**（外部语言服务器，`/v2/ext-lang-server*`）—
  列表、详情（绑定地址、资源、超时、共享内存、SSL）、活动、启动 / 停止，
  以及创建 / 删除。

**系统（System）**页面还覆盖设备详情 + 设置 + 子类型 CRUD 以及进程
**广播（broadcast）**；**任务（Tasks）**页面覆盖完整的任务 CRUD；
**安全（Security）**页面覆盖完整的写操作块：用户 / 角色 / 资源 /
服务 CRUD、SQL 管理员 + 列权限的授予 / 回收、钱包密钥 upsert、X.509 凭据 CRUD、
MFT / LDAP / superserver CRUD、特权例程 CRUD、Web 认证 SMTP 密码、审计事件 CRUD、
加密密钥文件管理，以及 OAuth 2.0 AS / 客户端 / 资源服务器配置。

### 国际化与主题

- **两种语言 — 中文 / English。** 运行时 `I18nService`（约 1026 个字符串，
  `core/i18n/en.ts` + `core/i18n/zh.ts`），顶部栏可切换。选择结果持久化在
  `localStorage`，默认取 `navigator.language`。刻意**没有**采用 `@angular/localize`：
  它需要按语言区（locale）构建的流水线，而运行时字典方案保持单一构建、运行时切换。
- **两种主题 — 深色 / 浅色。** 所有颜色都是 `:root` 上的 CSS 自定义属性；
  浅色主题是 `:root[data-theme='light']` 下的一组完整 token 覆盖。
  `ThemeService` 翻转该属性、持久化选择，并默认跟随操作系统的
  `prefers-color-scheme`。

### 权限感知（by design）

SysAdmin API 对每个操作都以 `%Admin_*` 权限做门禁。IRIS Portico 从
`GET /info` 读取当前用户的权限，并**据此启用或隐藏每个操作**——一个没有
`%Admin_Secure` 的用户根本看不到用户 / 角色管理控件。顶部栏显示当前会话
持有多少权限。

### API 覆盖（276 个操作的 v2 面）

IRIS 2026.2 的 SysAdmin API 在 39 个功能领域共暴露 **276 个操作**
（`mainspec_v2.json`）。本门户现已使用其中 **265 个（96.0%）**——每个功能领域
都有对应页面。完整目录按操作标注 ✅/—，并附与官方 IRIS 管理门户
（`%CSP.UI.Portal`）的功能对齐对比，见
**[`docs/API-CATALOG.md`](docs/API-CATALOG.md)**。

剩余 11 个未使用的操作价值较低：三个 SQL 权限 `HEAD` 探测、
`POST /v2/security/oauth2/revoke`、四个 `v2/fs-access-purpose` 变更端点
（门户将文件系统访问保持只读），以及两个 `v2/monitor` 仪表盘子端点
（`dashboard/ecp`、`dashboard/globals-and-routines`）。

---

## 架构

```
┌──────────────────────────────────────────────────────────────────────┐
│  浏览器 — Angular 18（独立组件，单一构建）                              │
│                                                                    │
│   /login  ── 独立登录页（无外壳 chrome）                             │
│                                                                    │
│   '' (authGuard) ── ShellComponent                                 │
│     ├─ 侧边栏（可折叠）或顶部导航（可切换）：14 项                   │
│     ├─ 顶部栏：中文/EN 切换 · 🌙/☀️ 主题切换 · 用户框               │
│     └─ router-outlet ── 14 个屏幕：dashboard + webapps,            │
│        permissions, security, tasks, system, databases, logs,     │
│        async, ecp, ext-lang-servers, namespaces, license, wqm     │
│                                                                    │
│   I18nService（运行时 zh/en 字典）                                   │
│   ThemeService（<html> 上的 data-theme，CSS 自定义属性）            │
└──────────────┬──────────────────────────────────┬───────────────────┘
                │  同源（端口 80）                 │  附加（IRIS :52773）
                ▼                                  ▼
   ┌────────────────────────────────┐   ┌──────────────────────────────┐
   │  nginx  (端口 80)             │   │  /csp/portico-api (BFF)      │
   │  · 提供 Angular SPA          │   │  ObjectScript：health +       │
   │  · 代理 /api/admin → IRIS    │   │  服务端日志聚合               │
   └───────────────┬────────────────┘   └──────────────────────────────┘
                   │
                   ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  /api/admin（IRIS 系统 API，端口 52773）                        │
   │  276 个操作 · JWT（POST /login）+ Basic 认证                   │
   └────────────────────────────────────────────────────────────────┘
                   ▲
                   │  共享、框架无关
   ┌────────────────────────────────────────────────────────────────┐
   │  @iris-portico/api-client  (TypeScript)                       │
   │  142 个生成类型 · 认证（JWT + basic）· 信封解包               │
   │  错误映射 · 13 个领域分组 · 异步辅助                           │
   └────────────────────────────────────────────────────────────────┘
```

有两个设计决策尤为突出。

**1. 框架无关的 API 客户端。** 所有难点——认证
（带 basic 回退的 JWT）、`BaseResponse` 信封解包、错误
映射（401/403/404/409）、142 个生成类型、13 个领域分组——都位于
`@iris-portico/api-client` 中。Angular 应用只是其上的薄层。
正因如此，之后**推出 React 或 Vue 变体**才会如此轻松：它们只需消费同一个客户端。

**2. nginx 位于 IRIS 之前。** 前端由 nginx 作为静态 SPA 提供，位于端口 80，
同时把 `/api/admin` 代理到 IRIS 内建 Web 服务器的 52773 端口。由于 SPA 与
API 同源（端口 80），浏览器直接用 **JWT** 调用 `/api/admin`（从 `POST /login`
获取，旧实例回退到 Basic 认证），不涉及 CORS。这刻意将前端交付与 IRIS
Web 应用注册解耦——即使 ObjectScript BFF 从未加载，门户也能工作。

**3. 外壳是一个组件，而非应用根。** `app.component.ts` 只是一个裸的
`<router-outlet />`。认证后的 chrome（侧边栏 + 顶部栏）位于一个独立的
`ShellComponent` 中，它是受 `CanActivateFn` 守卫保护的 `''` 路由的
`loadComponent`，因此未认证访客**只**会看到登录页——没有侧边栏、没有导航、
没有任何可点击的东西。直接访问受保护 URL（例如 `/tasks`）会被守卫重定向到
`/login`。

**4. 会话能扛过访问令牌 60 秒的 TTL。** IRIS 2026.2 签发短时效 JWT：
**访问令牌约 60 秒后过期**，而**刷新令牌约 15 分钟**。门户从不要求用户在该窗口内
重新登录——首个 `401` 时客户端调用 `POST /refresh`，换入新的访问令牌并重试一次
（用户看不到错误）。完整认证状态（访问**和**刷新令牌）持久化到 `localStorage`，
因此页面刷新恢复的是一个*可刷新*的会话，而非一个死会话。刷新是单飞（single-flight）
（并发的 `401` 共享同一次 `/refresh` 调用）。当会话最终失效（刷新令牌过期、被轮换
或被服务器重启作废）时，客户端清除状态**并导航到 `/login`**——用户绝不会被
困在一个满是 `401` 错误的页面上（路由守卫只在导航时运行，无法响应页面中途的令牌
失效；`AuthService` 监听认证标志，在"已认证 → 未认证"的跳变时重定向）。

> **需要 IRIS 2026.2 或更高版本。** `v2` SysAdmin API（276 个 `/v2/*` 操作
> 以及 JWT `POST /login` 端点）只在 2026.2+ 中存在。在 2026.1 上，API 报告
> `apiVersion: 1`，`/v2/*` 路径返回 `404`，因此六个功能领域屏幕将无 API 可调。
> Dockerfile 为此固定为 `intersystemsdc/iris-community:2026.2`。

## 快速开始（Docker，一条命令）

```bash
docker compose up --build
```

然后打开：

```
http://localhost:80/
```

用容器创建的凭据登录：

```
用户名: Portico
密码: Portico123
```

该容器会：
1. 构建 Angular 前端（Node 阶段），
2. 启动 **nginx**（在 `:80` 提供 SPA，把 `/api/admin` 代理到 IRIS `:52773`），
3. 创建 `Portico` 用户（使 `/api/admin` 的 **JWT + Basic 认证**可用），
4. 直接注册 Web 应用（一个会持久化的安全操作），并尽力供给 ObjectScript BFF
   （`/csp/portico-api/` — health + 服务端日志聚合）。

> BFF 是**可选组件**。即使它加载失败，门户也完全可用——日志中心回退到客户端聚合，
> 所有 CRUD + 认证都直连 `/api/admin`（经 nginx 代理）。

### 手动（不用 Docker）

1. **启动 IRIS Community Edition 2026.2 或更高版本**（`v2` SysAdmin API——
   276 个 `/v2/*` 操作 + JWT `POST /login`——只在 2026.2 起内建）。
2. **构建前端：**
   ```bash
   cd api-client && npm install && npm run build
   cd ../src/web && npm install && npm run build:prod
   ```
3. **加载 BFF**（在 `iris` 终端中）：
   ```
   create namespace portico
   set $namespace = "portico"
   load <path>/src/cls/portico/Install.cls
   load <path>/src/cls/portico/Web/Api.cls
   load <path>/src/cls/portico/Service/LogAggregator.cls
   do ##class(portico.Install).Run()
   ```
   将 `portico` Web 应用的 ppath 指向 `dist/portico-web/browser`。
4. 打开 `http://localhost:52773/csp/portico/`。

> BFF 是**可选组件**。跳过它，门户也完全可用——日志中心回退到客户端聚合，
> 所有 CRUD + 认证都直连 `/api/admin`。

### 演示模式（极简——仅 IRIS 内建 Web 服务器）

为了最小足迹的演示，完全跳过 nginx，让 IRIS 内建 Web 服务器提供一切：

```bash
docker compose -f docker-compose.demo.yml up --build
```

然后打开：

```
http://localhost:52773/csp/portico/
```

用同样的 `Portico / Portico123` 凭据登录。

在此模式下，`portico` Web 应用把 Angular SPA 作为静态文件提供
（`ServeFiles` Web 应用设置默认开启，使 IRIS 内建 Web 服务器能从应用的
物理路径提供文件），前端在同源上直接调用 `/api/admin`——没有代理、没有额外
软件包。`Dockerfile` 的构建参数 `INSTALL_NGINX=0` 会跳过 nginx 安装；默认的
`docker-compose.yml` 保持生产布局（nginx 在 `:80`）。前端的
`<base href="auto">` 在两种模式下都能正确解析资源路径。

> **演示模式的一个限制：** IRIS Web 应用定义（`Security.Applications`）没有
> "回退（fallback）"设置，因此内建 Web 服务器不会自动把 SPA 深度链接
> （例如 `/csp/portico/tasks`）重定向到 `index.html`。请从应用根进入——
> `http://localhost:52773/csp/portico/`——它会提供 `index.html`，随后客户端
> 路由处理所有应用内导航。（在生产模式下，nginx 的
> `try_files ... /index.html` 提供回退，因此深度链接在那里可用。）

---

## 仓库结构

```
├── Dockerfile / docker-compose.yml   一条命令运行（nginx + IRIS，生产）
├── docker-compose.demo.yml           演示模式（仅 IRIS 内建 Web 服务器）
├── nginx-portico.conf                SPA 在 :80 + /api/admin 代理
├── portico-setup.sh                  容器启动时的供给（用户 + BFF）
├── iris.script                       命名空间 + 类加载 + Web 应用设置
├── mainspec_v2.json                  SysAdmin OpenAPI 3.0 规范（事实来源）
├── api-client/                       框架无关的 TS 客户端（共享基础）
│   ├── scripts/gen-types.js          规范 → 142 个 TS 类型
│   ├── src/types/index.ts            生成类型
│   ├── src/client/                   AdminClient、AuthManager、13 个领域分组、错误
│   └── test/client.test.js           13 个单元测试（node:test，mock fetch）
├── src/cls/portico/                 ObjectScript BFF
│   ├── Install.cls                   一次性、幂等的 Web 应用设置
│   ├── Web/Api.cls                   %CSP 入口（health + 日志中心）
│   ├── Service/LogAggregator.cls     服务端日志聚合
│   └── UnitTest.cls                  %UnitTest 用例（在 IRIS 内运行）
└── src/web/                          Angular 18 前端（独立组件）
    └── src/app/
        ├── core/                     AdminService、AuthService、PermissionService、
        │                               ThemeService、I18nService、coalesce、认证守卫
        ├── core/i18n/                en.ts + zh.ts 运行时字典（约 1026 个键）
        ├── areas/                    全部 14 个屏幕：dashboard + 6 个功能领域 + async、
        │                               databases、ecp、ext-lang-servers、namespaces、
        │                               license、wqm
        ├── login/                    独立登录页
        ├── shell.component.ts        认证外壳（侧边栏 + 顶部栏 + outlet）
        ├── app.component.ts          裸 <router-outlet />
        └── app.routes.ts             守卫保护的 '' 路由 + 独立 /login
```

---

## 运行测试

```bash
# API 客户端（13 个单元测试，mock fetch）
cd api-client && npm install && npm test

# 类型检查客户端
cd api-client && npm run typecheck

# 构建前端（生产）
cd src/web && npm install && npm run build:prod
```

ObjectScript 单元测试（`portico.UnitTest`）在 IRIS 内运行：

```
set $namespace = "portico"
do ##class(%UnitTest.Run).Run("portico.UnitTest")
```

---

## 许可证

[MIT](./LICENSE)
