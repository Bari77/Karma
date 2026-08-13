"use client";

import clsx from "clsx";
import type { QuestProgression } from "@karma/shared";
import { ActionCard } from "@/components/ActionCard";
import { ActionCardSkeleton } from "@/components/Skeleton";
import { ActionCooldownStatus, ActionType, MAX_QUEST_RANK_TITLE } from "@karma/shared";

interface QuestAction {
  id: string;
  label: string;
  points: number;
  type: string;
  cooldownDays: number;
}

interface QuestSectionProps {
  quest: QuestProgression["currentQuest"];
  maxLevelReached?: boolean;
  goodActions: QuestAction[];
  loading: boolean;
  cooldowns: Record<string, ActionCooldownStatus>;
  loadingId: string | null;
  onPerform: (actionId: string) => void;
}

function actionMatchesQuest(
  action: QuestAction,
  objective: NonNullable<QuestProgression["currentQuest"]>["objectives"][number]
) {
  if (objective.completed) return false;
  if (objective.actionId) return objective.actionId === action.id;
  if (objective.minPoints != null && action.points < objective.minPoints) return false;
  return true;
}

function objectiveProgressPercent(currentCount: number, targetCount: number) {
  if (targetCount <= 0) return 0;
  return Math.min(100, (currentCount / targetCount) * 100);
}

export function QuestSection({
  quest,
  maxLevelReached = false,
  goodActions,
  loading,
  cooldowns,
  loadingId,
  onPerform,
}: QuestSectionProps) {
  if (maxLevelReached) {
    return (
      <section className="card-gaming mb-8 p-6 text-center">
        <h2 className="font-game mb-2 text-lg text-theme-good">Bien joué !</h2>
        <p className="text-sm text-theme-muted">
          Vous avez atteint le niveau maximum, vous êtes un « {MAX_QUEST_RANK_TITLE} ».
        </p>
      </section>
    );
  }

  if (!quest) {
    return (
      <section className="card-gaming mb-8 p-6 text-center">
        <h2 className="font-game mb-2 text-lg text-theme-from">Quête</h2>
        <p className="text-sm text-theme-muted">Aucune quête disponible pour le moment.</p>
      </section>
    );
  }

  if (quest.completed) {
    return (
      <section className="card-gaming mb-8 p-6 text-center">
        <h2 className="font-game mb-2 text-lg text-theme-good">Quête accomplie !</h2>
        <p className="text-sm text-theme-muted">
          Niveau {quest.level} terminé — continue sur le chemin du karma.
        </p>
      </section>
    );
  }

  const activeObjective = quest.objectives.find((o) => !o.completed) ?? quest.objectives[0];
  const questActions = goodActions.filter((a) =>
    quest.objectives.some((o) => !o.completed && actionMatchesQuest(a, o))
  );

  return (
    <section className="card-gaming mb-8 p-5 sm:p-6">
      <div className="mb-4">
        <p className="font-game text-xs uppercase tracking-wider text-theme-muted-soft">
          Quête · Niveau {quest.level}
        </p>
        <h2 className="font-game text-xl font-bold text-theme-from">{quest.title}</h2>
        {quest.description && (
          <p className="mt-1 text-sm text-theme-muted">{quest.description}</p>
        )}
      </div>

      <ul className="mb-5 space-y-3">
        {quest.objectives.map((objective) => {
          const progressPercent = objectiveProgressPercent(
            objective.currentCount,
            objective.targetCount
          );

          return (
          <li key={objective.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span
                className={clsx(
                  objective.completed ? "text-theme-good line-through" : "text-white"
                )}
              >
                {objective.label}
              </span>
              <span className="shrink-0 text-theme-muted-soft">
                {objective.currentCount}/{objective.targetCount}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-karma-bg">
              <div
                className={clsx(
                  "h-full min-w-0 rounded-full transition-all duration-500",
                  objective.completed
                    ? "bg-[color:var(--theme-good)]"
                    : "karma-progress-fill"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </li>
          );
        })}
      </ul>

      <div>
        <h3 className="mb-3 font-game text-sm font-semibold text-theme-good">
          Actions pour « {activeObjective?.label ?? quest.title} »
        </h3>
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <ActionCardSkeleton key={i} />)
            : questActions.length > 0
              ? questActions.map((a) => {
                  const cd = cooldowns[a.id];
                  const onCooldown = !!cd && !cd.canPerform;
                  return (
                    <ActionCard
                      key={a.id}
                      {...a}
                      type={a.type as ActionType}
                      onPerform={onPerform}
                      loading={loadingId === a.id}
                      disabled={onCooldown}
                      nextAvailableAt={cd?.nextAvailableAt}
                      remainingMs={cd?.remainingMs}
                      hideLeadingIcon
                    />
                  );
                })
              : (
                <p className="py-4 text-center text-sm text-theme-muted">
                  Aucune action correspondante disponible.
                </p>
              )}
        </div>
      </div>
    </section>
  );
}
