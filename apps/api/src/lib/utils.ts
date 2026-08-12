import { User } from "@prisma/client";
import { UserPublic } from "@karma/shared";

export function toUserPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as UserPublic["role"],
    karmaScore: user.karmaScore,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

export function getKarmaConfig() {
  return {
    dailyDecay: parseInt(process.env.KARMA_DAILY_DECAY || "5", 10),
    maxKarma: parseInt(process.env.KARMA_MAX || "100", 10),
  };
}

export function clampKarma(score: number, max: number): number {
  return Math.max(0, Math.min(max, score));
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  const startA = startOfDay(a).getTime();
  const startB = startOfDay(b).getTime();
  return Math.floor((startB - startA) / (1000 * 60 * 60 * 24));
}
