"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { ActionType } from "@karma/shared";
import { formatCooldown, formatCooldownCompact } from "@/lib/format-cooldown";

interface ActionCardProps {
  id: string;
  label: string;
  points: number;
  type: ActionType | string;
  cooldownDays?: number;
  onPerform: (id: string) => void;
  loading?: boolean;
  disabled?: boolean;
  nextAvailableAt?: string;
  remainingMs?: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export function ActionCard({
  id,
  label,
  points,
  type,
  onPerform,
  loading,
  disabled,
  nextAvailableAt,
  remainingMs = 0,
  isFavorite = false,
  onToggleFavorite,
}: ActionCardProps) {
  const isGood = type === ActionType.GOOD || type === "GOOD";
  const onCooldown = disabled && !loading;
  const isDisabled = loading || disabled;
  const [remaining, setRemaining] = useState(remainingMs);

  useEffect(() => {
    setRemaining(remainingMs);
  }, [remainingMs]);

  useEffect(() => {
    if (!disabled || remainingMs <= 0) return;
    const interval = setInterval(() => {
      if (nextAvailableAt) {
        const ms = new Date(nextAvailableAt).getTime() - Date.now();
        setRemaining(Math.max(0, ms));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [disabled, remainingMs, nextAvailableAt]);

  const handlePerform = () => {
    if (!isDisabled) onPerform(id);
  };

  return (
    <div className="group relative py-0.5">
      <motion.div
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        onClick={handlePerform}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handlePerform();
          }
        }}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        className={clsx(
          "card-gaming relative flex w-full items-center justify-between p-4 text-left transition",
          onCooldown && "cursor-not-allowed opacity-50",
          loading && "cursor-wait",
          !isDisabled && "cursor-pointer hover:shadow-md hover:shadow-[color:var(--theme-shadow-to)]",
          !isDisabled && isGood && "hover:border-[color:var(--theme-border-strong)]",
          !isDisabled && !isGood && "hover:border-[color:var(--theme-border-strong)]",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
          <span className="shrink-0 text-2xl">{isGood ? "✅" : "❌"}</span>
          <div className="relative min-w-0 flex-1">
            <div className="relative inline-block max-w-full pr-7">
              {onToggleFavorite && (
                <button
                  type="button"
                  aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(id);
                  }}
                  className={clsx(
                    "absolute right-0 top-1/2 z-0 -translate-y-1/2 text-lg leading-none transition-all",
                    isFavorite
                      ? "opacity-100 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]"
                      : "opacity-0 text-amber-400/90 group-hover:opacity-100"
                  )}
                >
                  ★
                </button>
              )}
              <span className="relative z-10 font-semibold text-white">{label}</span>
            </div>
          </div>
        </div>
        {loading ? (
          <span
            className={clsx(
              "ml-3 inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-t-transparent",
              isGood ? "border-theme-good" : "border-theme-bad"
            )}
            aria-label="Chargement"
          />
        ) : onCooldown ? (
          <span
            className="ml-3 shrink-0 text-right font-game text-sm font-bold tabular-nums text-theme-muted"
            title={formatCooldown(remaining, nextAvailableAt)}
          >
            ⏳ {formatCooldownCompact(remaining)}
          </span>
        ) : (
          <span
            className={clsx(
              "ml-3 shrink-0 font-game text-lg font-bold tabular-nums",
              isGood ? "text-theme-good" : "text-theme-bad"
            )}
          >
            {isGood ? "+" : "−"}
            {points}
          </span>
        )}
      </motion.div>
    </div>
  );
}
