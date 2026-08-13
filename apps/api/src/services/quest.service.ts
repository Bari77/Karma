import { Action, ActionType } from "@prisma/client";
import type {
  QuestObjectiveProgress,
  QuestProgression,
  QuestProgressUpdate,
} from "@karma/shared";
import { ActionType as SharedActionType, getQuestRankTitle } from "@karma/shared";
import { prisma } from "../lib/prisma";

type ProgressMap = Record<string, number>;

function parseProgress(raw: unknown): ProgressMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: ProgressMap = {};
  for (const [key, val] of Object.entries(raw)) {
    if (typeof val === "number" && val >= 0) out[key] = val;
  }
  return out;
}

async function getOrCreateProgress(userId: string) {
  return prisma.userQuestProgress.upsert({
    where: { userId },
    create: { userId, currentLevel: 1, objectiveProgress: {} },
    update: {},
  });
}

export async function getUserQuestLevel(userId: string) {
  const progress = await getOrCreateProgress(userId);
  const level = progress.currentLevel;
  return { level, title: getQuestRankTitle(level) };
}

export async function getUserQuestLevels(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, { level: number; title: string }>();

  const progresses = await prisma.userQuestProgress.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, currentLevel: true },
  });
  const byUser = new Map(progresses.map((p) => [p.userId, p.currentLevel]));

  return new Map(
    userIds.map((userId) => {
      const level = byUser.get(userId) ?? 1;
      return [userId, { level, title: getQuestRankTitle(level) }];
    })
  );
}

function objectiveMatchesAction(
  objective: {
    actionId: string | null;
    actionType: ActionType;
    minPoints: number | null;
  },
  action: Action
): boolean {
  if (action.type !== ActionType.GOOD) return false;
  if (objective.actionType !== ActionType.GOOD) return false;
  if (objective.actionId && objective.actionId !== action.id) return false;
  if (objective.minPoints != null && action.points < objective.minPoints) return false;
  return true;
}

function buildObjectiveProgress(
  objectives: Array<{
    id: string;
    label: string;
    targetCount: number;
    actionId: string | null;
    actionType: ActionType;
    minPoints: number | null;
  }>,
  progress: ProgressMap
): QuestObjectiveProgress[] {
  return objectives.map((o) => {
    const currentCount = Math.min(progress[o.id] ?? 0, o.targetCount);
    return {
      id: o.id,
      label: o.label,
      targetCount: o.targetCount,
      currentCount,
      completed: currentCount >= o.targetCount,
      actionId: o.actionId,
      actionType: o.actionType as SharedActionType,
      minPoints: o.minPoints,
    };
  });
}

export async function getQuestProgression(userId: string): Promise<QuestProgression> {
  const [levels, userProgress] = await Promise.all([
    prisma.questLevel.findMany({
      include: { objectives: { orderBy: { sortOrder: "asc" } } },
      orderBy: { level: "asc" },
    }),
    getOrCreateProgress(userId),
  ]);

  const progress = parseProgress(userProgress.objectiveProgress);
  const maxLevel = levels.length > 0 ? levels[levels.length - 1].level : 1;

  if (userProgress.maxLevelCompleted) {
    return {
      currentLevel: maxLevel,
      maxLevel,
      maxLevelReached: true,
      currentQuest: null,
      path: levels.map((l) => ({
        level: l.level,
        title: l.title,
        status: "completed" as const,
      })),
    };
  }

  const currentLevelDef = levels.find((l) => l.level === userProgress.currentLevel) ?? null;

  const path = levels.map((l) => ({
    level: l.level,
    title: l.title,
    status:
      l.level < userProgress.currentLevel
        ? ("completed" as const)
        : l.level === userProgress.currentLevel
          ? ("current" as const)
          : ("locked" as const),
  }));

  if (!currentLevelDef) {
    return {
      currentLevel: userProgress.currentLevel,
      maxLevel,
      maxLevelReached: false,
      currentQuest: null,
      path,
    };
  }

  const objectives = buildObjectiveProgress(currentLevelDef.objectives, progress);
  const completed = objectives.length > 0 && objectives.every((o) => o.completed);

  return {
    currentLevel: userProgress.currentLevel,
    maxLevel,
    maxLevelReached: false,
    currentQuest: {
      level: currentLevelDef.level,
      title: currentLevelDef.title,
      description: currentLevelDef.description,
      objectives,
      completed,
    },
    path,
  };
}

export async function recordQuestActionProgress(
  userId: string,
  action: Action
): Promise<QuestProgressUpdate | null> {
  const userProgress = await getOrCreateProgress(userId);

  if (userProgress.maxLevelCompleted) return null;

  const levelDef = await prisma.questLevel.findUnique({
    where: { level: userProgress.currentLevel },
    include: { objectives: { orderBy: { sortOrder: "asc" } } },
  });

  if (!levelDef || levelDef.objectives.length === 0) return null;

  const progress = parseProgress(userProgress.objectiveProgress);
  let updatedObjectiveId: string | null = null;
  let updated = false;

  for (const objective of levelDef.objectives) {
    const current = progress[objective.id] ?? 0;
    if (current >= objective.targetCount) continue;
    if (!objectiveMatchesAction(objective, action)) continue;

    progress[objective.id] = current + 1;
    updatedObjectiveId = objective.id;
    updated = true;
    break;
  }

  if (!updated || !updatedObjectiveId) return null;

  const objective = levelDef.objectives.find((o) => o.id === updatedObjectiveId)!;
  const currentCount = progress[updatedObjectiveId];
  const objectiveCompleted = currentCount >= objective.targetCount;

  const allDone = levelDef.objectives.every(
    (o) => (progress[o.id] ?? 0) >= o.targetCount
  );

  let levelCompleted = false;
  let newLevel: number | null = null;
  let maxLevelReached = false;

  if (allDone) {
    const nextLevel = await prisma.questLevel.findFirst({
      where: { level: { gt: userProgress.currentLevel } },
      orderBy: { level: "asc" },
    });
    levelCompleted = true;

    if (nextLevel) {
      newLevel = nextLevel.level;
      await prisma.userQuestProgress.update({
        where: { userId },
        data: {
          currentLevel: newLevel,
          objectiveProgress: {},
        },
      });
    } else {
      maxLevelReached = true;
      await prisma.userQuestProgress.update({
        where: { userId },
        data: {
          maxLevelCompleted: true,
          objectiveProgress: progress,
        },
      });
    }
  } else {
    await prisma.userQuestProgress.update({
      where: { userId },
      data: { objectiveProgress: progress },
    });
  }

  return {
    objectiveId: updatedObjectiveId,
    currentCount,
    targetCount: objective.targetCount,
    objectiveCompleted,
    levelCompleted,
    newLevel: levelCompleted && !maxLevelReached ? newLevel : null,
    maxLevelReached,
  };
}
