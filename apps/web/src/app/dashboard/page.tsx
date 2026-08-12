"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
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
  headerSticky,
  stickyTopPx,
  compactScroll,
  hideTitle,
  embeddedInPanel,
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
  headerSticky?: boolean;
  stickyTopPx?: number;
  compactScroll?: boolean;
  hideTitle?: boolean;
  embeddedInPanel?: boolean;
}) {
  const titleClass = accent === "good" ? "text-theme-good" : "text-theme-bad";
  const filtered = filterActions(
    sortActionsWithFavorites(actions, favorites),
    search
  );

  return (
    <section
      className={clsx(
        "flex min-h-0 flex-col",
        embeddedInPanel && "min-h-0 flex-1 overflow-hidden",
        !embeddedInPanel &&
          headerSticky &&
          compactScroll &&
          "sticky z-30 overflow-hidden border-b border-theme bg-karma-bg shadow-[0_8px_16px_-8px_rgba(15,10,30,0.9)] backdrop-blur-md"
      )}
      style={
        !embeddedInPanel && headerSticky && stickyTopPx !== undefined && compactScroll
          ? {
              top: stickyTopPx,
              maxHeight: `calc(100dvh - ${stickyTopPx + 24}px)`,
            }
          : undefined
      }
    >
      <div className={clsx("shrink-0 pb-3", embeddedInPanel ? "pt-0" : "pt-1")}>
        {!hideTitle && (
          <>
            <h2 className={`font-game mb-1 text-lg md:text-xl ${titleClass}`}>{title}</h2>
            <p className="mb-3 text-xs text-theme-muted">{subtitle}</p>
          </>
        )}
        <ActionSearchInput
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          accent={accent}
        />
      </div>
      <div
        className={clsx(
          "actions-scroll relative z-0 min-h-0 flex-1 overflow-y-auto pr-1",
          compactScroll ? "mt-0 pt-1" : "mt-3 space-y-2",
          !compactScroll && "actions-list-default"
        )}
      >
        <div className="space-y-2">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ActionCardSkeleton key={i} />)
          : filtered.map(renderAction)}
        {!loading && filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-theme-muted">
            {actions.length === 0 ? emptyMessage : "Aucun résultat pour cette recherche"}
          </p>
        )}
        </div>
      </div>
      {!loading && actions.length > 0 && (
        <p className="mt-2 text-xs text-theme-muted-soft">
          {filtered.length} / {actions.length} action{actions.length > 1 ? "s" : ""}
        </p>
      )}
    </section>
  );
}

function MobileActionTabs({
  active,
  onChange,
  sticky,
  stickyTopPx,
  embedded,
}: {
  active: "good" | "bad";
  onChange: (tab: "good" | "bad") => void;
  sticky?: boolean;
  stickyTopPx?: number;
  embedded?: boolean;
}) {
  return (
    <div
      className={clsx(
        "flex shrink-0 gap-2 lg:hidden",
        embedded ? "mb-2" : "mb-3",
        sticky &&
          "sticky z-[35] -mx-4 border-b border-theme bg-karma-bg px-4 py-2 shadow-[0_8px_16px_-8px_rgba(15,10,30,0.9)] backdrop-blur-md"
      )}
      style={sticky && stickyTopPx !== undefined ? { top: stickyTopPx } : undefined}
    >
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
    </div>
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
  const [mobileActionTab, setMobileActionTab] = useState<"good" | "bad">("good");
  const [isMobile, setIsMobile] = useState(false);
  const [gaugeSticky, setGaugeSticky] = useState(false);
  const gaugeStickyRef = useRef(false);
  const gaugeMeasureRef = useRef<HTMLDivElement>(null);
  const compactBarMeasureRef = useRef<HTMLDivElement>(null);
  const [gaugeFullHeight, setGaugeFullHeight] = useState(0);
  const [compactBarHeight, setCompactBarHeight] = useState(88);

  const NAVBAR_OFFSET_PX = 68;
  const STICKY_STACK_TOP_PX = 5;
  const STICKY_ON_PX = 64;
  const STICKY_OFF_PX = 8;

  const compactStackTopPx = NAVBAR_OFFSET_PX + compactBarHeight;
  const stickyBelowGaugePx = compactStackTopPx + STICKY_STACK_TOP_PX;
  const mobileTabsStickyTopPx = stickyBelowGaugePx;
  const columnHeaderStickyTopPx = stickyBelowGaugePx;
  const mobileCompactPanel = isMobile && gaugeSticky;

  const activeSlotHeight = gaugeFullHeight > 0 ? gaugeFullHeight : undefined;
  const actionsPullUpPx =
    gaugeSticky && gaugeFullHeight > 0
      ? Math.max(0, gaugeFullHeight - compactBarHeight)
      : 0;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    gaugeStickyRef.current = gaugeSticky;
  }, [gaugeSticky]);

  useLayoutEffect(() => {
    const fullEl = gaugeMeasureRef.current;
    if (!fullEl) return;

    const measure = () => setGaugeFullHeight(fullEl.offsetHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(fullEl);
    return () => ro.disconnect();
  }, [stats, initialLoading]);

  useLayoutEffect(() => {
    const compactEl = compactBarMeasureRef.current;
    if (!compactEl) return;

    const measure = () => setCompactBarHeight(compactEl.offsetHeight);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(compactEl);
    return () => ro.disconnect();
  }, [stats, initialLoading]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const prev = gaugeStickyRef.current;
      let next = prev;
      if (!prev && y > STICKY_ON_PX) next = true;
      else if (prev && y < STICKY_OFF_PX) next = false;
      if (next !== prev) {
        gaugeStickyRef.current = next;
        setGaugeSticky(next);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      <main className="relative mx-auto max-w-6xl overflow-anchor-none px-4 pb-8 pt-4">
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

        {stats && !initialLoading && (
          <div
            ref={compactBarMeasureRef}
            className="pointer-events-none absolute left-0 top-0 -z-10 w-full opacity-0"
            aria-hidden
          >
            <div className="mx-auto max-w-6xl px-4 py-2">
              <KarmaGauge
                score={stats.karmaScore}
                max={stats.maxKarma}
                dailyDecay={stats.dailyDecay}
                variant="horizontal"
                bare
              />
            </div>
          </div>
        )}

        {gaugeSticky && stats && !initialLoading && (
          <div
            className="fixed inset-x-0 z-40"
            style={{ top: NAVBAR_OFFSET_PX }}
          >
            <div className="mx-auto max-w-6xl px-4 py-2">
              <KarmaGauge
                score={stats.karmaScore}
                max={stats.maxKarma}
                dailyDecay={stats.dailyDecay}
                variant="horizontal"
                bare
              />
            </div>
          </div>
        )}

        <div
          className={clsx(
            "dashboard-gauge-slot relative",
            gaugeSticky ? "mb-4" : "mb-8"
          )}
          style={activeSlotHeight !== undefined ? { height: activeSlotHeight } : undefined}
          aria-hidden={gaugeSticky}
        >
          <div
            ref={gaugeMeasureRef}
            className={clsx(gaugeSticky && "invisible")}
          >
            {initialLoading ? (
              <KarmaGaugeSkeleton />
            ) : stats ? (
              <KarmaGauge
                score={stats.karmaScore}
                max={stats.maxKarma}
                dailyDecay={stats.dailyDecay}
                variant="full"
              />
            ) : null}
          </div>
        </div>

        <div
          className={clsx(
            "grid grid-cols-1 transition-[margin] duration-300 ease-out lg:grid-cols-2 lg:gap-8 lg:items-start",
            gaugeSticky && "relative z-10",
            !isMobile && "gap-6"
          )}
          style={
            actionsPullUpPx > 0 ? { marginTop: -actionsPullUpPx } : undefined
          }
        >
          {mobileCompactPanel ? (
            <div
              className="sticky z-30 flex min-h-0 flex-col overflow-hidden border-b border-theme bg-karma-bg shadow-[0_8px_16px_-8px_rgba(15,10,30,0.9)] backdrop-blur-md"
              style={{
                top: mobileTabsStickyTopPx,
                maxHeight: `calc(100dvh - ${mobileTabsStickyTopPx + 24}px)`,
              }}
            >
              <MobileActionTabs
                active={mobileActionTab}
                onChange={setMobileActionTab}
                embedded
              />
              <div
                className={clsx(
                  "flex min-h-0 flex-1 flex-col",
                  mobileActionTab !== "good" && "hidden"
                )}
              >
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
                  compactScroll
                  hideTitle
                  embeddedInPanel
                />
              </div>
              <div
                className={clsx(
                  "flex min-h-0 flex-1 flex-col",
                  mobileActionTab !== "bad" && "hidden"
                )}
              >
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
                  compactScroll
                  hideTitle
                  embeddedInPanel
                />
              </div>
            </div>
          ) : (
            <>
              <MobileActionTabs
                active={mobileActionTab}
                onChange={setMobileActionTab}
                sticky={gaugeSticky && isMobile}
                stickyTopPx={mobileTabsStickyTopPx}
              />

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
                  headerSticky={gaugeSticky}
                  stickyTopPx={columnHeaderStickyTopPx}
                  compactScroll={gaugeSticky}
                  hideTitle={isMobile}
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
                  headerSticky={gaugeSticky}
                  stickyTopPx={columnHeaderStickyTopPx}
                  compactScroll={gaugeSticky}
                  hideTitle={isMobile}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
