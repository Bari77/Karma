import clsx from "clsx";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "animate-pulse rounded-xl bg-[color:var(--theme-accent-to)]/20",
        className
      )}
    />
  );
}

export function KarmaGaugeSkeleton({ horizontal = false }: { horizontal?: boolean }) {
  if (horizontal) {
    return (
      <div className="card-gaming px-4 py-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 flex-1 rounded-sm" />
          <div className="shrink-0 space-y-1">
            <Skeleton className="ml-auto h-7 w-10" />
            <Skeleton className="h-3 w-14" />
          </div>
        </div>
        <Skeleton className="mx-auto mt-2 h-4 w-36" />
      </div>
    );
  }

  return (
    <div className="card-gaming p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-4">
        <Skeleton className="h-[220px] w-full rounded-2xl" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
    </div>
  );
}

export function ActionCardSkeleton() {
  return (
    <div className="card-gaming flex items-center justify-between p-4">
      <div className="flex flex-1 items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Skeleton className="h-6 w-12" />
    </div>
  );
}

export function HistoryItemSkeleton() {
  return (
    <div className="card-gaming flex items-center justify-between p-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-7 w-10" />
    </div>
  );
}

export function GroupCardSkeleton() {
  return (
    <div className="card-gaming p-5">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-24" />
    </div>
  );
}

export function AdminActionRowSkeleton() {
  return (
    <div className="card-gaming space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex flex-wrap items-center gap-3 border-t border-theme pt-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="card-gaming flex h-full min-h-[240px] flex-col p-4">
      <Skeleton className="mx-auto h-12 w-12 rounded-xl" />
      <Skeleton className="mt-3 h-5 w-3/4" />
      <Skeleton className="mt-2 h-3 w-full" />
      <Skeleton className="mt-auto h-9 w-full" />
    </div>
  );
}

export function LeaderboardRowSkeleton() {
  return (
    <div className="card-gaming flex items-center gap-4 p-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <Skeleton className="h-6 w-12" />
    </div>
  );
}
