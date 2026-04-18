# AgentInfra 个人版：以 Agent 运行时托管 + Sandbox 为主线的 TypeScript 开源项目

一个以 TypeScript 全栈、Docker + 轻量 K8s（kind）为底座、聚焦「Agent 动态拉起与隔离治理」的个人可交付开源作品，MVP 完成后再以薄壳形式挂上 CICD 与可观测模块，本地开发 + 一台云服务器做公开 demo。

## 1. 项目定位与边界

- **核心卖点**：面向个人开发者/小团队的 Agent Infra 平台，解决 "agent 从 demo 到 product-ready" 的托管、隔离、治理问题。
- **差异化**：不是又一个 LangChain 封装；主打 **运行时/Sandbox/治理** 这层 Infra 能力。
- **非目标**（明确不做）：自研 LLM 编排框架、自研存储引擎、做 SaaS 商业化、做多租户计费。
- **技术栈**：
  - 控制面：**TypeScript + NestJS**（API/调度/生命周期管理）
  - 前端控制台：**Next.js + shadcn/ui + TailwindCSS**
  - Agent SDK：**TypeScript**（同时兼容运行 Python agent：通过容器内启动 python 进程）
  - 存储：Postgres（元数据） + Redis（状态/队列） + MinIO（artifact/log 归档）
  - 运行时底座：**Docker（本地/云 MVP）→ kind/k3s（进阶演示）**
  - 观测：OpenTelemetry + Langfuse（agent trace） + Prometheus + Grafana
  - CI：GitHub Actions

## 2. 核心架构（MVP）

```
┌─────────────────────────────────────────────────┐
│  Web Console (Next.js)                          │
└──────────────────┬──────────────────────────────┘
                   │ REST / WebSocket
┌──────────────────▼──────────────────────────────┐
│  Control Plane (NestJS)                         │
│  - Agent Registry  - Scheduler  - Lifecycle Mgr │
│  - Auth (API Key)  - Quota      - Event Bus     │
└──────┬───────────────────┬──────────────────────┘
       │ Docker API /      │            ▲
       │ K8s API           │            │ OTel / logs
┌──────▼─────────┐  ┌──────▼────────┐   │
│ Sandbox Runner │  │ Sandbox Runner│ ──┘
│ (Container)    │  │ (Container)   │
│ + Agent SDK    │  │ + Agent SDK   │
└────────────────┘  └───────────────┘
       │
┌──────▼─────────────────────────────────────────┐
│  Postgres / Redis / MinIO / Langfuse / Grafana │
└────────────────────────────────────────────────┘
```

## 3. 关键模块拆解

### 3.1 Agent Registry（注册/版本）
- Agent 定义通过 YAML manifest：`name / image / entrypoint / env / resources / secrets_ref`
- 支持版本管理（语义化版本 + 自动打 tag）
- CRUD API + Web 列表页

### 3.2 Runtime Orchestrator（动态拉起）
- 抽象 `RuntimeDriver` 接口，两个实现：`DockerDriver`（MVP）/ `K8sDriver`（进阶）
- **冷启动优化**：基础镜像预热、容器池（keep N warm）
- **会话模式**：长驻会话（session-based）+ 一次性任务（job-based）两种调度
- **资源配额**：CPU/内存/磁盘/网络限额，超时自动回收

### 3.3 Sandbox 隔离
- 网络：默认禁外网，通过白名单 egress proxy 放行
- 文件系统：只读 rootfs + 可写 tmpfs/工作目录
- 系统调用：`seccomp` 默认 profile（K8s 阶段）
- 密钥注入：通过环境变量 + 短期 token，不落盘

### 3.4 Agent SDK（TS）
- `@agentinfra/sdk`：提供 `tool()` / `llm()` / `storage()` / `log()` 封装
- 自动把调用 trace 打到 OpenTelemetry → Langfuse
- 模板仓库：`create-agent-app` 脚手架

### 3.5 Web Console
- Agent 列表 / 详情 / 启停
- 实时日志（WebSocket 流）
- Trace 查看（嵌入 Langfuse iframe 或自绘）
- 资源使用图表（嵌入 Grafana）

### 3.6 CICD 薄壳（MVP 后）
- 绑定 GitHub 仓库 → webhook → 触发构建 → 推镜像 → 创建新版本 → 金丝雀替换
- 用 GitHub Actions 做实际构建，平台只做编排与状态追踪

### 3.7 可观测薄壳（MVP 后）
- 每个 agent 调用自动生成 trace（模型、token、耗时、成本）
- 成本聚合页面（按 agent / 按时间）
- 简单评测：保存 golden set，手动触发批量跑分

## 4. 里程碑（建议节奏，按周为单位，个人业余时间）

| 阶段 | 周期 | 产出 |
|------|------|------|
| **M0 脚手架** | 1-2 周 | Monorepo（pnpm + turbo）、NestJS 骨架、Next.js 骨架、Postgres/Redis/MinIO docker-compose、CI lint/test 跑通 |
| **M1 最小闭环** | 2-3 周 | 能通过 API 注册一个 hello-world agent，DockerDriver 拉起容器，SDK 打一条 log，Console 看到状态 |
| **M2 运行时增强** | 3-4 周 | 容器池/冷启动优化、资源配额、超时回收、WebSocket 日志流、session + job 双模式 |
| **M3 Sandbox 强化** | 2 周 | egress 白名单代理、只读 rootfs、secret 注入、一个"恶意 agent"演示被拦截 |
| **M4 可观测** | 2 周 | 集成 OpenTelemetry + Langfuse，成本/trace 页面 |
| **M5 CICD 薄壳** | 2 周 | GitHub webhook → 自动构建发布流水线 |
| **M6 K8s Driver** | 2-3 周 | 切换到 kind 跑通，写对比文档（Docker vs K8s 两种底座） |
| **M7 打磨发布** | 2 周 | README、架构图、demo 视频、一键部署脚本、云服务器 demo 站 |

**合计：约 16–20 周**（业余每周 10–15 小时）。MVP（M0–M2）能在 5–7 周内拿到一个可演示版本。

## 5. 仓库结构建议（monorepo）

```
AgentInfra/
├── apps/
│   ├── control-plane/      # NestJS
│   ├── console/            # Next.js
│   └── runner-agent/       # 容器内守护进程（可选）
├── packages/
│   ├── sdk/                # @agentinfra/sdk
│   ├── shared-types/       # 共享 DTO / schema
│   └── runtime-drivers/    # DockerDriver / K8sDriver
├── examples/
│   ├── hello-agent/
│   └── rag-agent/
├── deploy/
│   ├── docker-compose.yml
│   ├── kind/
│   └── cloud-vps/
└── docs/
    ├── architecture.md
    ├── design-decisions.md
    └── demo.md
```

## 6. 开源作品关键要素

- **一条命令起服务**：`pnpm install && docker compose up` → 打开 localhost:3000 看到 Console
- **一条命令建 agent**：`npx create-agent-app my-bot && agentctl deploy`
- **录一个 3 分钟 demo 视频**：注册 agent → 拉起 → 看 trace → 触发配额拦截
- **架构图 + 设计决策文档**（哪怕你不面试也是 star 杀手）
- **Badge 齐全**：CI 状态、License、Discord/微信群（可选）
- **Good first issue**：预埋 5–10 个标签，降低社区贡献门槛

## 7. 风险与对策

- **范围爆炸**：每个里程碑结束前必须发一个 tag，不做完不开新模块。
- **云服务器性能一般**：M7 部署时只跑 control-plane + console + Postgres + 1 个 runner，重型观测栈（Grafana/Loki）只在本地跑。
- **K8s 学习曲线**：M6 才切 K8s，前期用 Docker 稳住进度；若时间紧可降级为"设计文档 + 接口预留"。
- **和已有项目撞车**（E2B、Dify、Coze Studio 等）：在 README 顶部明确差异化（个人/自托管/轻量/TS 原生/聚焦 Infra 层）。

## 8. 执行顺序（M0）

1. 初始化 monorepo 脚手架（pnpm workspace + turbo + tsconfig/eslint/prettier）
2. 拉起 docker-compose 基础设施（Postgres + Redis + MinIO）
3. 生成 NestJS 骨架，定义 Agent / Run / Version 三个核心实体的 DB schema
4. 生成 Next.js 骨架，接一个 health 页面
5. 提交首个 commit + CI 配置
