import { ActionStatus, ActionType } from "@prisma/client";
import { Role } from "@karma/shared";
import { prisma } from "../lib/prisma";
import { adjustKarma } from "./karma.service";
import {
  defaultCooldownDays,
  getCooldownStatus,
} from "../lib/cooldown";

export async function listActiveActions(type?: ActionType) {
  return prisma.action.findMany({
    where: {
      status: ActionStatus.ACTIVE,
      ...(type ? { type } : {}),
    },
    orderBy: [{ points: "asc" }, { label: "asc" }],
  });
}

export async function listPendingActions() {
  return prisma.action.findMany({
    where: { status: ActionStatus.PENDING },
    include: { proposedBy: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllActions() {
  return prisma.action.findMany({
    include: { proposedBy: { select: { username: true } } },
    orderBy: [{ points: "asc" }, { type: "asc" }, { label: "asc" }],
  });
}

export async function createAction(
  label: string,
  points: number,
  type: ActionType,
  validatedById: string,
  cooldownDays?: number
) {
  const days = cooldownDays ?? defaultCooldownDays(type);
  return prisma.action.create({
    data: {
      label,
      points,
      type,
      cooldownDays: days,
      status: ActionStatus.ACTIVE,
      validatedById,
    },
  });
}

export async function proposeAction(
  label: string,
  points: number,
  type: ActionType,
  proposedById: string
) {
  return prisma.action.create({
    data: {
      label,
      points,
      type,
      cooldownDays: defaultCooldownDays(type),
      status: ActionStatus.PENDING,
      proposedById,
    },
  });
}

export async function updateAction(
  id: string,
  data: Partial<{
    label: string;
    points: number;
    type: ActionType;
    cooldownDays: number;
    status: ActionStatus;
  }>,
  validatedById?: string
) {
  return prisma.action.update({
    where: { id },
    data: {
      ...data,
      ...(validatedById ? { validatedById } : {}),
    },
  });
}

export async function deleteAction(id: string) {
  return prisma.action.delete({ where: { id } });
}

async function getLastActionLog(userId: string, actionId: string) {
  return prisma.userActionLog.findFirst({
    where: { userId, actionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function performAction(userId: string, actionId: string) {
  const action = await prisma.action.findUnique({ where: { id: actionId } });
  if (!action || action.status !== ActionStatus.ACTIVE) {
    throw new Error("Action introuvable ou inactive");
  }

  if (action.cooldownDays > 0) {
    const lastLog = await getLastActionLog(userId, actionId);
    const status = getCooldownStatus(
      lastLog?.createdAt ?? null,
      action.cooldownDays
    );
    if (!status.canPerform) {
      throw new Error("Action en cooldown — réessayez plus tard");
    }
  }

  const pointsChange =
    action.type === ActionType.GOOD ? action.points : -action.points;

  await prisma.userActionLog.create({
    data: { userId, actionId },
  });

  const newScore = await adjustKarma(
    userId,
    pointsChange,
    action.type === ActionType.GOOD
      ? `Bonne action : ${action.label}`
      : `Mauvaise action : ${action.label}`,
    actionId
  );

  return { pointsChange, newScore, action };
}

export async function getActionsCooldownStatus(userId: string) {
  const favorites = await getUserFavoriteActionIds(userId);

  const actions = await prisma.action.findMany({
    where: { status: ActionStatus.ACTIVE, cooldownDays: { gt: 0 } },
    select: { id: true, cooldownDays: true },
  });

  if (actions.length === 0) return { cooldowns: {}, favorites };

  const logs = await prisma.userActionLog.groupBy({
    by: ["actionId"],
    where: {
      userId,
      actionId: { in: actions.map((a) => a.id) },
    },
    _max: { createdAt: true },
  });

  const logMap = new Map(logs.map((l) => [l.actionId, l._max.createdAt]));

  const cooldowns: Record<
    string,
    {
      canPerform: boolean;
      nextAvailableAt: string;
      remainingMs: number;
      cooldownDays: number;
    }
  > = {};

  for (const action of actions) {
    const lastDone = logMap.get(action.id) ?? null;
    const status = getCooldownStatus(lastDone, action.cooldownDays);
    if (!status.canPerform) {
      cooldowns[action.id] = {
        canPerform: false,
        nextAvailableAt: status.nextAvailableAt.toISOString(),
        remainingMs: status.remainingMs,
        cooldownDays: action.cooldownDays,
      };
    }
  }

  return { cooldowns, favorites };
}

export async function getUserFavoriteActionIds(userId: string): Promise<string[]> {
  const rows = await prisma.userActionFavorite.findMany({
    where: { userId },
    select: { actionId: true },
  });
  return rows.map((r) => r.actionId);
}

export async function toggleActionFavorite(userId: string, actionId: string) {
  const action = await prisma.action.findUnique({ where: { id: actionId } });
  if (!action || action.status !== ActionStatus.ACTIVE) {
    throw new Error("Action introuvable ou inactive");
  }

  const existing = await prisma.userActionFavorite.findUnique({
    where: { userId_actionId: { userId, actionId } },
  });

  if (existing) {
    await prisma.userActionFavorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }

  await prisma.userActionFavorite.create({ data: { userId, actionId } });
  return { favorited: true };
}

export function canManageActions(role: Role): boolean {
  return [Role.MODERATOR, Role.ADMIN, Role.SUPER_ADMIN].includes(role);
}

export function canValidateProposals(role: Role): boolean {
  return [Role.ADMIN, Role.SUPER_ADMIN].includes(role);
}
