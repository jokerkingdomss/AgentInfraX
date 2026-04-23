/*
  Warnings:

  - The primary key for the `agent_versions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `agents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `runs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `agent_versions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `agentId` on the `agent_versions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `agents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `runs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `agentId` on the `runs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `agentVersionId` on the `runs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "agent_versions" DROP CONSTRAINT "agent_versions_agentId_fkey";

-- DropForeignKey
ALTER TABLE "runs" DROP CONSTRAINT "runs_agentId_fkey";

-- DropForeignKey
ALTER TABLE "runs" DROP CONSTRAINT "runs_agentVersionId_fkey";

-- AlterTable
ALTER TABLE "agent_versions" DROP CONSTRAINT "agent_versions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "agentId",
ADD COLUMN     "agentId" UUID NOT NULL,
ADD CONSTRAINT "agent_versions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "agents" DROP CONSTRAINT "agents_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "runs" DROP CONSTRAINT "runs_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "agentId",
ADD COLUMN     "agentId" UUID NOT NULL,
DROP COLUMN "agentVersionId",
ADD COLUMN     "agentVersionId" UUID NOT NULL,
ADD CONSTRAINT "runs_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_versions_agentId_version_key" ON "agent_versions"("agentId", "version");

-- CreateIndex
CREATE INDEX "runs_agentId_createdAt_idx" ON "runs"("agentId", "createdAt");

-- AddForeignKey
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "runs" ADD CONSTRAINT "runs_agentVersionId_fkey" FOREIGN KEY ("agentVersionId") REFERENCES "agent_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
