# AgentInfra

> A self-hostable, lightweight platform for the **full lifecycle management of AI agents** — development, sandboxed execution, deployment, and observability.

**AgentInfra** focuses on the *infrastructure* layer of agents, not yet another LLM orchestration framework. It aims to shorten the path from agent *demo* to *product-ready* with dynamic runtime provisioning, isolated sandboxes, quotas, and observability — all in a single open-source TypeScript stack.

## Status

Early work in progress. Roadmap in [`docs/ROADMAP.md`](./docs/ROADMAP.md).

Current milestone: **M0 — scaffolding**.

## Quick start (after M0)

```bash
pnpm install
docker compose -f deploy/docker-compose.yml up -d
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) for the console and [http://localhost:3001](http://localhost:3001) for the control plane.

## Repo layout

```
apps/
  control-plane/   NestJS API + scheduler + lifecycle manager
  console/         Next.js web UI
packages/
  sdk/             @agentinfra/sdk — the TS SDK used inside agent containers
  shared-types/    Shared DTOs / zod schemas
  runtime-drivers/ DockerDriver (MVP) / K8sDriver (later)
examples/          Example agents
deploy/            docker-compose / kind / cloud deploy assets
docs/              Architecture & roadmap
```

## Differentiation

Compared to existing projects (E2B, Dify, Coze Studio, LangServe, …):

- **Self-hosted & lightweight** — a single `docker compose up` away.
- **TS-native** — control plane, console, and SDK are all TypeScript; Python agents run inside containers.
- **Infra-first** — the core value is runtime/sandbox/quota/observability, not LLM orchestration.

## License

MIT — see [`LICENSE`](./LICENSE).
