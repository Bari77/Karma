"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AuthGuard } from "@/components/AuthGuard";
import { Navbar } from "@/components/Navbar";
import { HistoryItemSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { KarmaHistoryPeriod, KarmaLogEntry } from "@karma/shared";

const PERIOD_OPTIONS: { value: KarmaHistoryPeriod; label: string }[] = [
  { value: "week", label: "Semaine passée" },
  { value: "month", label: "Mois passé" },
  { value: "all", label: "Depuis le début" },
];

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<KarmaHistoryPeriod>("week");
  const [logs, setLogs] = useState<KarmaLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(
    async (opts: { reset: boolean; cursor?: string }) => {
      if (!user) return;
      const isReset = opts.reset;
      if (isReset) setLoading(true);
      else {
        setLoadingMore(true);
        loadingMoreRef.current = true;
      }

      try {
        const page = await api.karmaHistory({
          period,
          limit: PAGE_SIZE,
          cursor: opts.cursor,
        });

        setLogs((prev) => (isReset ? page.items : [...prev, ...page.items]));
        setNextCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } finally {
        if (isReset) setLoading(false);
        else {
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [user, period]
  );

  useEffect(() => {
    if (!user) return;
    setLogs([]);
    setNextCursor(null);
    setHasMore(false);
    loadPage({ reset: true });
  }, [user, period, loadPage]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          nextCursor &&
          !loadingMoreRef.current
        ) {
          loadPage({ reset: false, cursor: nextCursor });
        }
      },
      { rootMargin: "120px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, nextCursor, loadPage]);

  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto flex max-w-2xl flex-col px-4 py-8">
        <h1 className="font-game mb-4 text-2xl font-bold glow-text">
          Historique du karma
        </h1>

        <div className="mb-4 flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={clsx(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                period === opt.value
                  ? "btn-toggle-active"
                  : "bg-black/30 text-purple-300/60 hover:text-purple-200"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="actions-scroll min-h-0 max-h-[min(640px,70vh)] space-y-3 overflow-y-auto pr-1">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <HistoryItemSkeleton key={i} />
              ))
            : logs.map((log) => (
                <div
                  key={log.id}
                  className="card-gaming flex items-center justify-between p-4"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold">{log.reason}</p>
                    <p className="text-xs text-purple-300/50">
                      {new Date(log.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <span
                    className={clsx(
                      "font-game shrink-0 text-xl font-bold",
                      log.pointsChange >= 0 ? "text-cyan-400" : "text-rose-400"
                    )}
                  >
                    {log.pointsChange >= 0 ? "+" : ""}
                    {log.pointsChange}
                  </span>
                </div>
              ))}

          {!loading && logs.length === 0 && (
            <p className="py-8 text-center text-purple-300/50">
              Aucun historique pour cette période
            </p>
          )}

          {loadingMore &&
            Array.from({ length: 2 }).map((_, i) => (
              <HistoryItemSkeleton key={`more-${i}`} />
            ))}

          <div ref={loadMoreRef} className="h-1" aria-hidden />
        </div>

        {!loading && logs.length > 0 && (
          <p className="mt-3 text-center text-xs text-purple-300/40">
            {logs.length} entrée{logs.length > 1 ? "s" : ""}
            {hasMore ? " — faites défiler pour en voir plus" : " — fin de la liste"}
          </p>
        )}
      </main>
    </AuthGuard>
  );
}
