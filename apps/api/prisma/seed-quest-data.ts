import { GOOD_ACTIONS, sortByPoints } from "./seed-data";

export const TOTAL_QUEST_LEVELS = 100;

const TIER_TITLES: { minPoints: number; title: string }[] = [
  { minPoints: 10, title: "Héroïsme" },
  { minPoints: 7, title: "Grand engagement" },
  { minPoints: 5, title: "Altruisme" },
  { minPoints: 3, title: "Bienveillance" },
  { minPoints: 0, title: "Gestes du quotidien" },
];

function tierTitle(points: number) {
  return TIER_TITLES.find((t) => points >= t.minPoints)?.title ?? "Quête";
}

export interface QuestLevelSeed {
  level: number;
  title: string;
  description: string;
  objectives: { actionLabel: string; targetCount: number }[];
}

/** Génère 100 niveaux à partir du catalogue GOOD_ACTIONS, difficulté croissante. */
export function buildQuestLevels(): QuestLevelSeed[] {
  const sorted = [...GOOD_ACTIONS].sort(sortByPoints);
  const levels: QuestLevelSeed[] = [];

  for (let level = 1; level <= TOTAL_QUEST_LEVELS; level++) {
    const lap = Math.floor((level - 1) / sorted.length);
    const idxInLap = (level - 1) % sorted.length;
    const difficultyOffset = Math.min(sorted.length - 1, lap * 6);
    const actionIdx = Math.min(sorted.length - 1, idxInLap + difficultyOffset);
    const action = sorted[actionIdx];
    const targetCount = 1 + lap;

    const objectives: QuestLevelSeed["objectives"] = [
      { actionLabel: action.label, targetCount },
    ];

    if (level >= 12 && level % 6 === 0) {
      const secondIdx = Math.min(
        sorted.length - 1,
        actionIdx + 2 + Math.floor(level / 15)
      );
      if (secondIdx !== actionIdx) {
        objectives.push({ actionLabel: sorted[secondIdx].label, targetCount: 1 });
      }
    }

    const title = `${tierTitle(action.points)} · ${level}`;
    const description =
      targetCount > 1
        ? `Réalise « ${action.label} » ${targetCount} fois pour progresser.`
        : `Réalise : ${action.label}`;

    levels.push({ level, title, description, objectives });
  }

  return levels;
}
