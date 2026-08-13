import { ActionType } from "./types";

export type QuestNodeStatus = "completed" | "current" | "locked";

export interface QuestObjectiveProgress {
  id: string;
  label: string;
  targetCount: number;
  currentCount: number;
  completed: boolean;
  actionId: string | null;
  actionType: ActionType;
  minPoints: number | null;
}

export interface QuestLevelNode {
  level: number;
  title: string;
  status: QuestNodeStatus;
}

export interface QuestProgression {
  currentLevel: number;
  maxLevel: number;
  maxLevelReached: boolean;
  currentQuest: {
    level: number;
    title: string;
    description: string | null;
    objectives: QuestObjectiveProgress[];
    completed: boolean;
  } | null;
  path: QuestLevelNode[];
}

export interface QuestProgressUpdate {
  objectiveId: string;
  currentCount: number;
  targetCount: number;
  objectiveCompleted: boolean;
  levelCompleted: boolean;
  newLevel: number | null;
  maxLevelReached: boolean;
}
