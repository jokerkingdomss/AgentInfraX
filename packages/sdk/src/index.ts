/**
 * @agentinfra/sdk
 *
 * Minimal SDK for agents running inside AgentInfra containers.
 * Reads configuration from environment variables injected by the control plane:
 *   - AGENTINFRA_CONTROL_PLANE_URL  (default: http://localhost:3001)
 *   - RUN_ID                        (injected by DockerDriver)
 */

export const SDK_VERSION = '0.1.0';

const CONTROL_PLANE_URL =
  process.env.AGENTINFRA_CONTROL_PLANE_URL ?? 'http://localhost:3001';
const RUN_ID = process.env.RUN_ID ?? '';

async function postLog(level: string, message: string): Promise<void> {
  if (!RUN_ID) {
    console.warn('[agentinfra/sdk] RUN_ID not set; log not sent to control plane.');
    return;
  }
  try {
    await fetch(`${CONTROL_PLANE_URL}/api/runs/${RUN_ID}/logs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ level, message }),
    });
  } catch (err) {
    console.warn('[agentinfra/sdk] failed to send log:', (err as Error).message);
  }
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogOptions {
  level?: LogLevel;
}

export async function log(message: string, opts?: LogOptions): Promise<void> {
  const level = opts?.level ?? 'info';
  console.log(`[${level}] ${message}`);
  await postLog(level, message);
}

export function getRunId(): string {
  return RUN_ID;
}

export function getControlPlaneUrl(): string {
  return CONTROL_PLANE_URL;
}
