-- AlterTable
ALTER TABLE "Action" ADD COLUMN "cooldownDays" INTEGER NOT NULL DEFAULT 1;

-- Mauvaises actions existantes : illimitées par défaut
UPDATE "Action" SET "cooldownDays" = 0 WHERE "type" = 'BAD';
