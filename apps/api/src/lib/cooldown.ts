import { startOfDay } from "./utils";

/** 0 = illimité, ≥1 = reset après N jours calendaires */
export function getNextAvailable(lastDone: Date, cooldownDays: number): Date {
  const next = startOfDay(lastDone);
  next.setDate(next.getDate() + cooldownDays);
  return next;
}

export function getCooldownStatus(
  lastDone: Date | null,
  cooldownDays: number
): { canPerform: boolean; nextAvailableAt: Date; remainingMs: number } {
  if (cooldownDays === 0 || !lastDone) {
    return { canPerform: true, nextAvailableAt: new Date(), remainingMs: 0 };
  }

  const nextAvailableAt = getNextAvailable(lastDone, cooldownDays);
  const remainingMs = Math.max(0, nextAvailableAt.getTime() - Date.now());
  return {
    canPerform: remainingMs === 0,
    nextAvailableAt,
    remainingMs,
  };
}

export function defaultCooldownDays(type: "GOOD" | "BAD"): number {
  return type === "GOOD" ? 1 : 0;
}
