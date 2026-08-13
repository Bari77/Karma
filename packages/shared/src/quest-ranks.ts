export const MAX_QUEST_LEVEL = 100;
export const MAX_QUEST_RANK_TITLE = "Maître du karma";

/** Titres de rang joueur selon le niveau de quête (1–100). */
const QUEST_RANK_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 91, title: MAX_QUEST_RANK_TITLE },
  { minLevel: 81, title: "Sage bienveillant" },
  { minLevel: 71, title: "Champion du karma" },
  { minLevel: 61, title: "Héros du quotidien" },
  { minLevel: 51, title: "Pilier du groupe" },
  { minLevel: 41, title: "Altruiste confirmé" },
  { minLevel: 31, title: "Gardien de lumière" },
  { minLevel: 21, title: "Compagnon du quotidien" },
  { minLevel: 11, title: "Apprenti bienveillant" },
  { minLevel: 1, title: "Novice du karma" },
];

export function getQuestRankTitle(level: number): string {
  const safe = Math.max(1, Math.floor(level));
  return QUEST_RANK_TITLES.find((t) => safe >= t.minLevel)?.title ?? "Novice du karma";
}

export function formatQuestRank(level: number, title?: string): string {
  const rankTitle = title ?? getQuestRankTitle(level);
  return `Niv. ${level} · ${rankTitle}`;
}
