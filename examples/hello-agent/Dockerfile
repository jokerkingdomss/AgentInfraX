FROM node:20-alpine

WORKDIR /app

# Copy the agent script
COPY main.ts ./

# Run with tsx (bundled ts runner) — no build step needed
RUN npm install -g tsx

# Environment variables injected by the control plane at runtime:
#   AGENT_NAME, RUN_ID
CMD ["tsx", "main.ts"]
