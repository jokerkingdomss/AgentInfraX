/**
 * @agentinfra/sdk — Placeholder.
 *
 * In M1+ this will expose:
 *   - log()    — structured logging to control plane
 *   - tool()   — register a callable tool
 *   - llm()    — thin LLM client with tracing
 *   - storage()— scoped MinIO/S3 helper
 */

export const SDK_VERSION = '0.0.1';

export function hello(name = 'agent'): string {
  return `hello, ${name} — agentinfra sdk v${SDK_VERSION}`;
}
