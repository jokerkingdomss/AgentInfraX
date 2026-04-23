/**
 * hello-agent — The simplest possible AgentInfra agent.
 *
 * Prints structured log lines to stdout (which the control plane will capture),
 * then exits with code 0.
 */

const AGENT_NAME = process.env.AGENT_NAME ?? 'hello-agent';
const RUN_ID = process.env.RUN_ID ?? 'unknown';

function log(message: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    agent: AGENT_NAME,
    runId: RUN_ID,
    message,
    ...meta,
  };
  console.log(JSON.stringify(entry));
}

async function main() {
  log('starting', { version: '0.1.0' });

  // Simulate some work
  for (let i = 1; i <= 5; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    log(`working step ${i}/5`, { progress: i / 5 });
  }

  log('done — all steps completed');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log('fatal error', { error: String(err) });
    process.exit(1);
  });
