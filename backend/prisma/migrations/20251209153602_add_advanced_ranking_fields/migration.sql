-- AlterTable
ALTER TABLE "indicator_definitions" ADD COLUMN     "excludedCollaboratorIds" JSONB,
ADD COLUMN     "includedCollaboratorIds" JSONB,
ADD COLUMN     "perRankOperations" JSONB,
ADD COLUMN     "rankingMode" TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN     "selectedRanks" JSONB;
