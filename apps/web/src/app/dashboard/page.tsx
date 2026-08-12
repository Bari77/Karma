"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { KarmaGauge } from "@/components/KarmaGauge";
import { ActionCard } from "@/components/ActionCard";
import { KarmaGaugeSkeleton, ActionCardSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { ActionCooldownStatus, ActionType, KarmaStats } from "@karma/shared";

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
  accent: "cyan" | "rose";
}) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`input-gaming py-2 text-sm ${
        accent === "cyan"
          ? "focus:border-cyan-400/60 focus:ring-cyan-400/20"
          : "focus:border-rose-400/60 focus:ring-rose-400/20"
      }`}
    />
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
}: {
  title: string;
  subtitle: string;
  accent: "cyan" | "rose";
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  loading: boolean;
  actions: Action[];
  favorites: Set<string>;
  emptyMessage: string;
  renderAction: (a: Action) => ReactNode;
}) {
  const titleClass = accent === "cyan" ? "text-cyan-400" : "text-rose-400";
  const filtered = filterActions(
    sortActionsWithFavorites(actions, favorites),
    search
  );

  return (
    <section className="flex flex-col">
      <h2 className={`font-game mb-1 text-lg md:text-xl ${titleClass}`}>{title}</h2>
      <p className="mb-3 text-xs text-purple-300/50">{subtitle}</p>
      <ActionSearchInput
        value={search}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        accent={accent}
      />
      <div className="actions-scroll mt-3 max-h-[min(520px,55vh)] space-y-2 overflow-y-auto pr-1">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ActionCardSkeleton key={i} />)
          : filtered.map(renderAction)}
        {!loading && filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-purple-300/50">
            {actions.length === 0 ? emptyMessage : "Aucun résultat pour cette recherche"}
          </p>
        )}
      </div>
      {!loading && actions.length > 0 && (
        <p className="mt-2 text-xs text-purple-300/40">
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
  const [stats, setStats] = useState<KarmaStats | null>(null);
  const [goodActions, setGoodActions] = useState<Action[]>([]);
  const [badActions, setBadActions] = useState<Action[]>([]);
  const [cooldowns, setCooldowns] = useState<Record<string, ActionCooldownStatus>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ msg: string; positive: boolean } | null>(null);
  const [goodSearch, setGoodSearch] = useState("");
  const [badSearch, setBadSearch] = useState("");

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!userId) return;
    const silent = opts?.silent ?? loadedForUserRef.current === userId;
    if (!silent) setInitialLoading(true);
    try {
      const [s, good, bad, status] = await Promise.all([
        api.karmaStats(),
        api.activeActions("GOOD"),
        api.activeActions("BAD"),
        api.actionsMyStatus(),
      ]);
      setStats(s);
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

  const handlePerform = async (actionId: string) => {
    if (!user) return;
    setLoadingId(actionId);
    try {
      const res = await api.performAction(actionId);
      setFlash({
        msg: `${res.pointsChange > 0 ? "+" : ""}${res.pointsChange} karma !`,
        positive: res.pointsChange > 0,
      });
      setStats((prev) =>
        prev
          ? {
              ...prev,
              karmaScore: res.karmaScore,
              percentFull: Math.round((res.karmaScore / prev.maxKarma) * 100),
            }
          : prev
      );
      setUser({ ...user, karmaScore: res.karmaScore });
      const status = await api.actionsMyStatus();
      setCooldowns(status.cooldowns);
      setFavorites(new Set(status.favorites));
      setTimeout(() => setFlash(null), 2500);
    } catch (err) {
      setFlash({
        msg: err instanceof Error ? err.message : "Erreur",
        positive: false,
      });
      setTimeout(() => setFlash(null), 3000);
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
      setTimeout(() => setFlash(null), 3000);
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
                  ? "bg-cyan-900/90 text-cyan-300 shadow-cyan-500/30"
                  : "bg-rose-900/90 text-rose-300 shadow-rose-500/30"
              }`}
            >
              {flash.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8">
          {initialLoading ? (
            <KarmaGaugeSkeleton />
          ) : stats ? (
            <KarmaGauge
              score={stats.karmaScore}
              max={stats.maxKarma}
              dailyDecay={stats.dailyDecay}
            />
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
          <ActionsColumn
            title="✨ Bonnes actions"
            subtitle="Cooldown configurable par action (min. 1 jour)"
            accent="cyan"
            search={goodSearch}
            onSearchChange={setGoodSearch}
            searchPlaceholder="Rechercher une bonne action…"
            loading={initialLoading}
            actions={goodActions}
            favorites={favorites}
            emptyMessage="Aucune bonne action disponible"
            renderAction={renderAction}
          />
          <ActionsColumn
            title="💀 Mauvaises actions"
            subtitle="Illimitées par défaut — cooldown configurable"
            accent="rose"
            search={badSearch}
            onSearchChange={setBadSearch}
            searchPlaceholder="Rechercher une mauvaise action…"
            loading={initialLoading}
            actions={badActions}
            favorites={favorites}
            emptyMessage="Aucune mauvaise action disponible"
            renderAction={renderAction}
          />
        </div>
      </main>
    </AuthGuard>
  );
}
