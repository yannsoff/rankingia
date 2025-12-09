/*
  Warnings:

  - You are about to drop the column `perRankOperations` on the `indicator_definitions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "indicator_definitions" DROP COLUMN "perRankOperations",
ADD COLUMN     "specialOperations" JSONB;
