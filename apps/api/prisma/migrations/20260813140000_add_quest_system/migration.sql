-- CreateTable
CREATE TABLE "QuestLevel" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "QuestLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestObjective" (
    "id" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "targetCount" INTEGER NOT NULL DEFAULT 1,
    "actionId" TEXT,
    "actionType" "ActionType" NOT NULL DEFAULT 'GOOD',
    "minPoints" INTEGER,

    CONSTRAINT "QuestObjective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuestProgress" (
    "userId" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "objectiveProgress" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserQuestProgress_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestLevel_level_key" ON "QuestLevel"("level");

-- CreateIndex
CREATE INDEX "QuestObjective_levelId_idx" ON "QuestObjective"("levelId");

-- AddForeignKey
ALTER TABLE "QuestObjective" ADD CONSTRAINT "QuestObjective_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "QuestLevel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestObjective" ADD CONSTRAINT "QuestObjective_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "Action"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestProgress" ADD CONSTRAINT "UserQuestProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
