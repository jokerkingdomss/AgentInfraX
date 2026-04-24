CREATE TABLE run_logs (
    id          UUID PRIMARY KEY,
    "runId"     UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    level       VARCHAR(16) NOT NULL DEFAULT 'info',
    message     TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_run_logs_run_id_created_at ON run_logs ("runId", "createdAt");
