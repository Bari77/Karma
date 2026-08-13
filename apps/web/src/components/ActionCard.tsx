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
  hideLeadingIcon?: boolean;
}

function ActionStar({
  isFavorite,
  isGood,
  onToggle,
}: {
  isFavorite: boolean;
  isGood: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) {
  const colorClass = isGood ? "text-theme-good" : "text-theme-bad";
  const glowClass = isGood
    ? "drop-shadow-[0_0_8px_color-mix(in_srgb,var(--theme-good)_65%,transparent)]"
    : "drop-shadow-[0_0_8px_color-mix(in_srgb,var(--theme-bad)_65%,transparent)]";

  return (
    <button
      type="button"
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={isFavorite}
      onClick={onToggle}
      className={clsx(
        "shrink-0 rounded-md p-0.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2",
        colorClass,
        isGood ? "focus-visible:ring-theme-good/40" : "focus-visible:ring-theme-bad/40",
        isFavorite && glowClass
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        aria-hidden
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={isFavorite ? 0 : 2}
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
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
  hideLeadingIcon = false,
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
          !isDisabled && "hover:border-[color:var(--theme-border-strong)]"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
          {!hideLeadingIcon &&
            (onToggleFavorite ? (
              <ActionStar
                isFavorite={isFavorite}
                isGood={isGood}
                onToggle={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(id);
                }}
              />
            ) : (
              <span className="shrink-0 text-2xl">{isGood ? "✅" : "❌"}</span>
            ))}
          <span className="min-w-0 font-semibold text-white">{label}</span>
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
