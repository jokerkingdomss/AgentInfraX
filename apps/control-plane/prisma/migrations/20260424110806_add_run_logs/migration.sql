-- CreateTable
CREATE TABLE "run_logs" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "run_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "run_logs_runId_createdAt_idx" ON "run_logs"("runId", "createdAt");

-- AddForeignKey
ALTER TABLE "run_logs" ADD CONSTRAINT "run_logs_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
