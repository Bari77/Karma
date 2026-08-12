import { User, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { clampKarma, daysBetween, getKarmaConfig } from "../lib/utils";

export async function applyDailyDecay(user: User): Promise<User> {
  const { dailyDecay, maxKarma } = getKarmaConfig();
  const now = new Date();
  const days = daysBetween(user.lastDecayAt, now);

  if (days <= 0) return user;

  const totalDecay = days * dailyDecay;
  const newScore = clampKarma(user.karmaScore - totalDecay, maxKarma);

  if (totalDecay > 0) {
    await prisma.karmaLog.create({
      data: {
        userId: user.id,
        pointsChange: -totalDecay,
        reason: `Décroissance quotidienne (${days} jour${days > 1 ? "s" : ""} × ${dailyDecay})`,
      },
    });
  }

  return prisma.user.update({
    where: { id: user.id },
    data: {
      karmaScore: newScore,
      lastDecayAt: now,
    },
  });
}

export async function adjustKarma(
  userId: string,
  pointsChange: number,
  reason: string,
  actionId?: string
): Promise<number> {
  const { maxKarma } = getKarmaConfig();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const newScore = clampKarma(user.karmaScore + pointsChange, maxKarma);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { karmaScore: newScore },
    }),
    prisma.karmaLog.create({
      data: { userId, actionId, pointsChange, reason },
    }),
  ]);

  return newScore;
}

const HISTORY_PAGE_SIZE = 20;

function getHistoryPeriodStart(period: "week" | "month" | "all"): Date | null {
  if (period === "all") return null;
  const days = period === "week" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function decodeHistoryCursor(cursor: string): { createdAt: Date; id: string } {
  const sep = cursor.indexOf("|");
  if (sep === -1) throw new Error("Cursor invalide");
  const createdAt = new Date(cursor.slice(0, sep));
  const id = cursor.slice(sep + 1);
  if (Number.isNaN(createdAt.getTime()) || !id) throw new Error("Cursor invalide");
  return { createdAt, id };
}

function encodeHistoryCursor(createdAt: Date, id: string): string {
  return `${createdAt.toISOString()}|${id}`;
}

export async function getKarmaHistory(
  userId: string,
  opts: { period: "week" | "month" | "all"; limit?: number; cursor?: string }
) {
  const limit = opts.limit ?? HISTORY_PAGE_SIZE;
  const periodStart = getHistoryPeriodStart(opts.period);

  const baseWhere: Prisma.KarmaLogWhereInput = {
    userId,
    ...(periodStart && { createdAt: { gte: periodStart } }),
  };

  let where: Prisma.KarmaLogWhereInput = baseWhere;
  if (opts.cursor) {
    const { createdAt, id } = decodeHistoryCursor(opts.cursor);
    where = {
      AND: [
        baseWhere,
        {
          OR: [
            { createdAt: { lt: createdAt } },
            { createdAt, id: { lt: id } },
          ],
        },
      ],
    };
  }

  const logs = await prisma.karmaLog.findMany({
    where,
    include: { action: { select: { label: true, type: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
  });

  const hasMore = logs.length > limit;
  const page = hasMore ? logs.slice(0, limit) : logs;
  const last = page[page.length - 1];

  return {
    items: page.map((log) => ({
      id: log.id,
      pointsChange: log.pointsChange,
      reason: log.reason,
      actionId: log.actionId,
      createdAt: log.createdAt.toISOString(),
      action: log.action,
    })),
    nextCursor: hasMore && last ? encodeHistoryCursor(last.createdAt, last.id) : null,
    hasMore,
  };
}
