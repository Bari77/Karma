export function formatCooldownCompact(remainingMs: number): string {
  if (remainingMs <= 0) return "0m";

  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days}j ${hours}h` : `${days}j`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatCooldown(remainingMs: number, nextAvailableAt?: string): string {
  if (remainingMs <= 0) return "Disponible maintenant";

  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    const parts = [`${days}j`];
    if (hours > 0) parts.push(`${hours}h`);
    return `Disponible dans ${parts.join(" ")}`;
  }

  if (hours > 0) {
    return minutes > 0
      ? `Disponible dans ${hours}h ${minutes}min`
      : `Disponible dans ${hours}h`;
  }

  if (minutes > 0) {
    return `Disponible dans ${minutes}min`;
  }

  if (nextAvailableAt) {
    const date = new Date(nextAvailableAt);
    return `Disponible le ${date.toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return "Bientôt disponible";
}

export function formatCooldownDays(days: number): string {
  if (days === 0) return "Illimité";
  if (days === 1) return "1 jour (reset journalier)";
  return `${days} jours`;
}
