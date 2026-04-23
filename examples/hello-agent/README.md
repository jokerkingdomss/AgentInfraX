# hello-agent

The simplest possible AgentInfra agent. Used for end-to-end testing of the platform.

## What it does

1. Prints 5 structured JSON log lines to stdout (one per second)
2. Exits with code 0

## Build & run manually

```bash
docker build -t agentinfra/hello-agent:0.1.0 .
docker run --rm -e AGENT_NAME=hello -e RUN_ID=test-001 agentinfra/hello-agent:0.1.0
```

## Use via AgentInfra

1. Create agent `hello-agent` in the console
2. Add version `0.1.0` with image `agentinfra/hello-agent:0.1.0`
3. Trigger a run — the control plane will pull and start this container
