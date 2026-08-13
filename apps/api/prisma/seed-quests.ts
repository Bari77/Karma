import { ActionStatus, ActionType, PrismaClient } from "@prisma/client";
import { buildQuestLevels, TOTAL_QUEST_LEVELS } from "./seed-quest-data";

async function buildActionLabelMap(prisma: PrismaClient) {
  const actions = await prisma.action.findMany({
    where: { type: ActionType.GOOD, status: ActionStatus.ACTIVE },
    select: { id: true, label: true },
  });
  const map = new Map<string, string>();
  for (const action of actions) {
    map.set(action.label, action.id);
  }
  return map;
}

function resolveGoodActionId(map: Map<string, string>, label: string) {
  const id = map.get(label);
  if (!id) {
    throw new Error(`Action GOOD introuvable pour la quête : « ${label} »`);
  }
  return id;
}

export async function seedQuests(prisma: PrismaClient) {
  const questLevels = buildQuestLevels();
  const actionMap = await buildActionLabelMap(prisma);

  await prisma.questLevel.deleteMany({
    where: { level: { gt: TOTAL_QUEST_LEVELS } },
  });

  for (const quest of questLevels) {
    const level = await prisma.questLevel.upsert({
      where: { level: quest.level },
      create: {
        level: quest.level,
        title: quest.title,
        description: quest.description,
      },
      update: {
        title: quest.title,
        description: quest.description,
      },
    });

    await prisma.questObjective.deleteMany({ where: { levelId: level.id } });

    for (let i = 0; i < quest.objectives.length; i++) {
      const obj = quest.objectives[i];
      const actionId = resolveGoodActionId(actionMap, obj.actionLabel);
      await prisma.questObjective.create({
        data: {
          levelId: level.id,
          sortOrder: i,
          label: obj.actionLabel,
          targetCount: obj.targetCount,
          actionId,
          actionType: ActionType.GOOD,
        },
      });
    }
  }

  return { levels: questLevels.length };
}

async function runStandalone() {
  const prisma = new PrismaClient();
  try {
    const result = await seedQuests(prisma);
    console.log(`Quêtes : ${result.levels} niveaux`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void runStandalone();
}
