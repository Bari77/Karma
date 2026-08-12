import { ActionStatus, ActionType, PrismaClient, Role } from "@prisma/client";
import { BAD_ACTIONS, GOOD_ACTIONS, OBSOLETE_LABELS, sortByPoints } from "./seed-data";

async function resolveValidatorId(
  prisma: PrismaClient,
  preferredId?: string
): Promise<string | null> {
  if (preferredId) return preferredId;

  const admin = await prisma.user.findFirst({
    where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
    orderBy: { createdAt: "asc" },
  });

  return admin?.id ?? null;
}

async function upsertActions(
  prisma: PrismaClient,
  items: { label: string; points: number }[],
  type: ActionType,
  validatedById: string | null
) {
  for (const action of items) {
    const existing = await prisma.action.findFirst({
      where: { label: action.label },
    });

    if (!existing) {
      await prisma.action.create({
        data: {
          label: action.label,
          points: action.points,
          type,
          cooldownDays: 0,
          status: ActionStatus.ACTIVE,
          validatedById,
        },
      });
    } else {
      await prisma.action.update({
        where: { id: existing.id },
        data: {
          points: action.points,
          type,
          cooldownDays: 0,
          status: ActionStatus.ACTIVE,
        },
      });
    }
  }
}

export async function seedActions(prisma: PrismaClient, validatedById?: string) {
  const validatorId = await resolveValidatorId(prisma, validatedById);

  await upsertActions(
    prisma,
    [...GOOD_ACTIONS].sort(sortByPoints),
    ActionType.GOOD,
    validatorId
  );
  await upsertActions(
    prisma,
    [...BAD_ACTIONS].sort(sortByPoints),
    ActionType.BAD,
    validatorId
  );

  await prisma.action.updateMany({
    where: { label: { in: OBSOLETE_LABELS } },
    data: { status: ActionStatus.REJECTED },
  });

  return { good: GOOD_ACTIONS.length, bad: BAD_ACTIONS.length };
}

async function runStandalone() {
  const prisma = new PrismaClient();
  try {
    const result = await seedActions(prisma);
    console.log(`Seed actions OK — ${result.good} bonnes, ${result.bad} mauvaises`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("prisma/seed-actions.ts");
if (isDirectRun) {
  void runStandalone();
}
