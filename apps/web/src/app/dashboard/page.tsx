"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { ActionCard } from "@/components/ActionCard";
import { QuestPath } from "@/components/QuestPath";
import { QuestSection } from "@/components/QuestSection";
import { ActionCardSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import {
  ActionCooldownStatus,
  ActionType,
  QuestProgression,
  QuestProgressUpdate,
  MAX_QUEST_RANK_TITLE,
} from "@karma/shared";

interface Action {
  id: string;
  label: string;
  points: number;
  type: string;
  cooldownDays: number;
}

function filterActions(actions: Action[], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return actions;
  return actions.filter((a) => a.label.toLowerCase().includes(q));
}

function sortActionsWithFavorites(actions: Action[], favorites: Set<string>) {
  return [...actions].sort((a, b) => {
    const aFav = favorites.has(a.id);
    const bFav = favorites.has(b.id);
    if (aFav !== bFav) return aFav ? -1 : 1;
    if (a.points !== b.points) return a.points - b.points;
    return a.label.localeCompare(b.label, "fr");
  });
}

function ActionSearchInput({
  value,
  onChange,
  placeholder,
  accent,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  accent: "good" | "bad";
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={clsx(
        "input-gaming py-2 text-sm",
        accent === "good"
          ? "focus:border-[color:var(--theme-good)] focus:ring-[color:var(--theme-good)]/20"
          : "focus:border-[color:var(--theme-bad)] focus:ring-[color:var(--theme-bad)]/20"
      )}
    />
  );
}

function MobileActionsPanel({
  active,
  onChange,
  search,
  onSearchChange,
}: {
  active: "good" | "bad";
  onChange: (tab: "good" | "bad") => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 lg:hidden">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("bad")}
          className={clsx(
            "flex-1 rounded-xl border px-3 py-2.5 font-game text-sm font-semibold transition",
            active === "bad"
              ? "border-[color:var(--theme-bad)]/40 bg-[color:var(--theme-bad)]/15 text-theme-bad"
              : "border-theme bg-karma-card/40 text-theme-muted-soft hover:text-white"
          )}
        >
          💀 Mauvaises
        </button>
        <button
          type="button"
          onClick={() => onChange("good")}
          className={clsx(
            "flex-1 rounded-xl border px-3 py-2.5 font-game text-sm font-semibold transition",
            active === "good"
              ? "border-[color:var(--theme-good)]/40 bg-[color:var(--theme-good)]/15 text-theme-good"
              : "border-theme bg-karma-card/40 text-theme-muted-soft hover:text-white"
          )}
        >
          ✨ Bonnes actions
        </button>
      </div>
      <ActionSearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={
          active === "bad"
            ? "Rechercher une mauvaise action…"
            : "Rechercher une bonne action…"
        }
        accent={active}
      />
    </div>
  );
}

function ActionsColumn({
  title,
  subtitle,
  accent,
  search,
  onSearchChange,
  searchPlaceholder,
  loading,
  actions,
  favorites,
  emptyMessage,
  renderAction,
  hideTitle,
  hideSearch,
}: {
  title: string;
  subtitle: string;
  accent: "good" | "bad";
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  loading: boolean;
  actions: Action[];
  favorites: Set<string>;
  emptyMessage: string;
  renderAction: (a: Action) => ReactNode;
  hideTitle?: boolean;
  hideSearch?: boolean;
}) {
  const titleClass = accent === "good" ? "text-theme-good" : "text-theme-bad";
  const filtered = filterActions(
    sortActionsWithFavorites(actions, favorites),
    search
  );

  const MAX_VISIBLE_ACTIONS = 5;
  const ACTION_ITEM_HEIGHT_PX = 72;
  const ACTION_LIST_GAP_PX = 8;
  const listMaxHeight =
    MAX_VISIBLE_ACTIONS * ACTION_ITEM_HEIGHT_PX +
    (MAX_VISIBLE_ACTIONS - 1) * ACTION_LIST_GAP_PX;

  return (
    <section className="flex flex-col">
      {(!hideTitle || !hideSearch) && (
        <div className="shrink-0 pb-3 pt-1">
          {!hideTitle && (
            <>
              <h2 className={`font-game mb-1 text-lg md:text-xl ${titleClass}`}>{title}</h2>
              <p className="mb-3 text-xs text-theme-muted">{subtitle}</p>
            </>
          )}
          {!hideSearch && (
            <ActionSearchInput
              value={search}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              accent={accent}
            />
          )}
        </div>
      )}
      <div
        className="actions-scroll mt-3 space-y-2 overflow-y-auto pr-1"
        style={{ maxHeight: listMaxHeight }}
      >
        {loading
          ? Array.from({ length: MAX_VISIBLE_ACTIONS }).map((_, i) => (
              <ActionCardSkeleton key={i} />
            ))
          : filtered.map(renderAction)}
        {!loading && filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-theme-muted">
            {actions.length === 0 ? emptyMessage : "Aucun résultat pour cette recherche"}
          </p>
        )}
      </div>
      {!loading && actions.length > 0 && (
        <p className="mt-2 text-xs text-theme-muted-soft">
          {filtered.length} / {actions.length} action{actions.length > 1 ? "s" : ""}
        </p>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const { user, setUser } = useAuth();
  const userId = user?.id;
  const loadedForUserRef = useRef<string | null>(null);
  const [questProgress, setQuestProgress] = useState<QuestProgression | null>(null);
  const [pulseLevel, setPulseLevel] = useState<number | null>(null);
  const [goodActions, setGoodActions] = useState<Action[]>([]);
  const [badActions, setBadActions] = useState<Action[]>([]);
  const [cooldowns, setCooldowns] = useState<Record<string, ActionCooldownStatus>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ msg: string; positive: boolean } | null>(null);
  const [goodSearch, setGoodSearch] = useState("");
  const [badSearch, setBadSearch] = useState("");
  const [mobileActionTab, setMobileActionTab] = useState<"good" | "bad">("bad");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!userId) return;
    const silent = opts?.silent ?? loadedForUserRef.current === userId;
    if (!silent) setInitialLoading(true);
    try {
      const [quest, good, bad, status] = await Promise.all([
        api.questProgression(),
        api.activeActions("GOOD"),
        api.activeActions("BAD"),
        api.actionsMyStatus(),
      ]);
      setQuestProgress(quest);
      setGoodActions(good);
      setBadActions(bad);
      setCooldowns(status.cooldowns);
      setFavorites(new Set(status.favorites));
      loadedForUserRef.current = userId;
    } finally {
      if (!silent) setInitialLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      loadedForUserRef.current = null;
      return;
    }
    load();
  }, [userId, load]);

  const triggerQuestPulse = (update: QuestProgressUpdate | null | undefined) => {
    if (!update) return;
    const level = update.maxLevelReached
      ? questProgress?.maxLevel ?? questProgress?.currentLevel ?? null
      : update.levelCompleted && update.newLevel
        ? update.newLevel
        : questProgress?.currentLevel ?? null;
    setPulseLevel(level);
    window.setTimeout(() => setPulseLevel(null), 700);
  };

  const handlePerform = async (actionId: string) => {
    if (!user) return;
    setLoadingId(actionId);
    try {
      const res = await api.performAction(actionId);
      setFlash({
        msg: `${res.pointsChange > 0 ? "+" : ""}${res.pointsChange} karma !`,
        positive: res.pointsChange > 0,
      });
      setUser({ ...user, karmaScore: res.karmaScore });
      triggerQuestPulse(res.questUpdate);
      const [quest, status] = await Promise.all([
        api.questProgression(),
        api.actionsMyStatus(),
      ]);
      setQuestProgress(quest);
      setCooldowns(status.cooldowns);
      setFavorites(new Set(status.favorites));
      if (res.questUpdate?.maxLevelReached) {
        setFlash({
          msg: `Bien joué, vous avez atteint le niveau maximum, vous êtes un « ${MAX_QUEST_RANK_TITLE} ».`,
          positive: true,
        });
      } else if (res.questUpdate?.levelCompleted) {
        setFlash({
          msg: res.questUpdate.newLevel
            ? `Niveau ${res.questUpdate.newLevel} débloqué !`
            : "Quête terminée !",
          positive: true,
        });
      }
      window.setTimeout(() => setFlash(null), 2500);
    } catch (err) {
      setFlash({
        msg: err instanceof Error ? err.message : "Erreur",
        positive: false,
      });
      window.setTimeout(() => setFlash(null), 3000);
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleFavorite = async (actionId: string) => {
    try {
      const res = await api.toggleActionFavorite(actionId);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (res.favorited) next.add(actionId);
        else next.delete(actionId);
        return next;
      });
    } catch (err) {
      setFlash({
        msg: err instanceof Error ? err.message : "Erreur favoris",
        positive: false,
      });
      window.setTimeout(() => setFlash(null), 3000);
    }
  };

  const renderAction = (a: Action) => {
    const cd = cooldowns[a.id];
    const onCooldown = !!cd && !cd.canPerform;
    return (
      <ActionCard
        key={a.id}
        {...a}
        type={a.type as ActionType}
        onPerform={handlePerform}
        loading={loadingId === a.id}
        disabled={onCooldown}
        nextAvailableAt={cd?.nextAvailableAt}
        remainingMs={cd?.remainingMs}
        isFavorite={favorites.has(a.id)}
        onToggleFavorite={handleToggleFavorite}
      />
    );
  };

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-8 pt-4">
        <AnimatePresence>
          {flash && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`fixed inset-x-0 top-20 z-50 mx-auto w-max max-w-[90vw] rounded-xl px-6 py-3 text-center font-game text-lg font-bold shadow-lg ${
                flash.positive
                  ? "bg-[color:var(--theme-good)]/20 text-theme-good shadow-[0_0_24px_var(--theme-shadow-to)]"
                  : "bg-[color:var(--theme-bad)]/20 text-theme-bad shadow-[0_0_24px_var(--theme-shadow-from)]"
              }`}
            >
              {flash.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {questProgress && (
          <QuestPath
            path={questProgress.path}
            currentLevel={questProgress.currentLevel}
            pulseLevel={pulseLevel}
            maxLevelReached={questProgress.maxLevelReached}
          />
        )}

        <QuestSection
          quest={questProgress?.currentQuest ?? null}
          maxLevelReached={questProgress?.maxLevelReached}
          goodActions={goodActions}
          loading={initialLoading}
          cooldowns={cooldowns}
          loadingId={loadingId}
          onPerform={handlePerform}
        />

        <div className="mb-4 lg:hidden">
          <MobileActionsPanel
            active={mobileActionTab}
            onChange={setMobileActionTab}
            search={mobileActionTab === "bad" ? badSearch : goodSearch}
            onSearchChange={mobileActionTab === "bad" ? setBadSearch : setGoodSearch}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
          <div className={clsx(isMobile && mobileActionTab !== "bad" && "hidden lg:block")}>
            <ActionsColumn
              title="💀 Mauvaises actions"
              subtitle="Illimitées par défaut — cooldown configurable"
              accent="bad"
              search={badSearch}
              onSearchChange={setBadSearch}
              searchPlaceholder="Rechercher une mauvaise action…"
              loading={initialLoading}
              actions={badActions}
              favorites={favorites}
              emptyMessage="Aucune mauvaise action disponible"
              renderAction={renderAction}
              hideTitle={isMobile}
              hideSearch={isMobile}
            />
          </div>
          <div className={clsx(isMobile && mobileActionTab !== "good" && "hidden lg:block")}>
            <ActionsColumn
              title="✨ Bonnes actions"
              subtitle="Cooldown configurable par action (min. 1 jour)"
              accent="good"
              search={goodSearch}
              onSearchChange={setGoodSearch}
              searchPlaceholder="Rechercher une bonne action…"
              loading={initialLoading}
              actions={goodActions}
              favorites={favorites}
              emptyMessage="Aucune bonne action disponible"
              renderAction={renderAction}
              hideTitle={isMobile}
              hideSearch={isMobile}
            />
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
