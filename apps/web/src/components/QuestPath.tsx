"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { QuestLevelNode, QuestNodeStatus } from "@karma/shared";
import { MAX_QUEST_RANK_TITLE } from "@karma/shared";
import { useThemeColors } from "@/lib/use-theme-colors";

interface QuestPathProps {
  path: QuestLevelNode[];
  currentLevel: number;
  pulseLevel?: number | null;
  maxLevelReached?: boolean;
}

interface VisibleTriplet {
  bottom: QuestLevelNode;
  middle: QuestLevelNode;
  top: QuestLevelNode;
}

function getVisibleTriplet(path: QuestLevelNode[], currentLevel: number): VisibleTriplet | null {
  const sorted = [...path].sort((a, b) => a.level - b.level);
  const idx = sorted.findIndex((n) => n.level === currentLevel);
  if (idx === -1) return null;

  const current = sorted[idx];
  const prev = idx > 0 ? sorted[idx - 1] : null;
  const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  if (!prev) {
    const nextNext = idx + 2 < sorted.length ? sorted[idx + 2] : next;
    if (!next) return { bottom: current, middle: current, top: current };
    return {
      bottom: current,
      middle: next,
      top: nextNext ?? next,
    };
  }

  if (!next) {
    const prevPrev = idx > 1 ? sorted[idx - 2] : prev;
    return {
      bottom: prevPrev,
      middle: prev,
      top: current,
    };
  }

  return { bottom: prev, middle: current, top: next };
}

function bubbleSide(level: number): "left" | "right" {
  return level % 2 === 1 ? "left" : "right";
}

function segmentStyle(from: QuestNodeStatus, to: QuestNodeStatus): "solid" | "dashed" {
  if (from === "completed" && (to === "current" || to === "completed")) return "solid";
  return "dashed";
}

function QuestBubble({ node, pulse }: { node: QuestLevelNode; pulse: boolean }) {
  const isCompleted = node.status === "completed";
  const isCurrent = node.status === "current";
  const isLocked = node.status === "locked";
  const shouldPulse = pulse && isCurrent;

  return (
    <div className="relative z-10 flex max-w-[8.5rem] flex-col items-center gap-1">
      <motion.div
        animate={
          shouldPulse
            ? {
                scale: [1, 1.12, 1],
                boxShadow: [
                  "0 0 0 0 rgba(251, 191, 36, 0)",
                  "0 0 28px 6px rgba(251, 191, 36, 0.75)",
                  "0 0 14px 2px rgba(251, 191, 36, 0.35)",
                ],
              }
            : { scale: 1 }
        }
        transition={{ duration: 0.55, ease: "easeOut" }}
        className={clsx(
          "flex h-14 w-14 items-center justify-center rounded-full border-2 font-game text-sm font-bold",
          isCompleted &&
            "border-[color:var(--theme-good)] bg-[color:var(--theme-good)]/20 text-theme-good",
          isCurrent &&
            !shouldPulse &&
            "border-theme-from bg-theme-nav-active text-theme-from shadow-[0_0_16px_var(--theme-glow)]",
          isCurrent &&
            shouldPulse &&
            "border-theme-from bg-theme-nav-active text-theme-from",
          isLocked && "border-theme bg-karma-card/30 text-theme-muted-soft"
        )}
      >
        {isCompleted ? "✓" : node.level}
      </motion.div>
      <p
        className={clsx(
          "max-w-[8.5rem] text-center text-[11px] font-semibold leading-tight",
          isCurrent ? "text-theme-from" : isCompleted ? "text-theme-good" : "text-theme-muted-soft"
        )}
      >
        {node.title}
      </p>
    </div>
  );
}

function PathSegment({
  fromX,
  fromY,
  toX,
  toY,
  style,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  style: "solid" | "dashed";
}) {
  const colors = useThemeColors();
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  const isSolid = style === "solid";

  return (
    <path
      d={`M ${fromX} ${fromY} Q ${midX} ${midY} ${toX} ${toY}`}
      fill="none"
      stroke={isSolid ? colors.accentFromNeon : colors.accentToNeon}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray={isSolid ? undefined : "6 5"}
      opacity={isSolid ? 0.85 : 0.5}
    />
  );
}

function PathConnectors({
  bottom,
  middle,
  top,
}: {
  bottom: QuestLevelNode;
  middle: QuestLevelNode;
  top: QuestLevelNode;
}) {
  const w = 280;
  const h = 200;

  const pos = (node: QuestLevelNode, y: number) => ({
    x: bubbleSide(node.level) === "left" ? w * 0.28 : w * 0.72,
    y,
  });

  const bottomP = pos(bottom, h - 36);
  const middleP = pos(middle, h / 2);
  const topP = pos(top, 36);

  const lowerStyle = segmentStyle(bottom.status, middle.status);
  const upperStyle = segmentStyle(middle.status, top.status);

  return (
    <svg
      className="pointer-events-none absolute inset-0 mx-auto h-full w-full max-w-[17.5rem]"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {bottom.level !== middle.level && (
        <PathSegment
          fromX={bottomP.x}
          fromY={bottomP.y}
          toX={middleP.x}
          toY={middleP.y}
          style={lowerStyle}
        />
      )}
      {middle.level !== top.level && (
        <PathSegment
          fromX={middleP.x}
          fromY={middleP.y}
          toX={topP.x}
          toY={topP.y}
          style={upperStyle}
        />
      )}
    </svg>
  );
}

function BubbleSlot({
  node,
  pulse,
  position,
}: {
  node: QuestLevelNode;
  pulse: boolean;
  position: "top" | "middle" | "bottom";
}) {
  const side = bubbleSide(node.level);
  const positionClass =
    position === "top"
      ? "top-0"
      : position === "middle"
        ? "top-1/2 -translate-y-1/2"
        : "bottom-0";

  return (
    <div
      className={clsx(
        "absolute flex w-[42%]",
        positionClass,
        side === "left" ? "left-0 justify-start" : "right-0 justify-end"
      )}
    >
      <QuestBubble node={node} pulse={pulse} />
    </div>
  );
}

export function QuestPath({ path, currentLevel, pulseLevel, maxLevelReached = false }: QuestPathProps) {
  const triplet = getVisibleTriplet(path, currentLevel);
  if (!triplet) return null;

  const { bottom, middle, top } = triplet;
  const atSummit = !path.some((n) => n.level === currentLevel + 1);

  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl border border-theme bg-karma-card/20 px-4 py-5 sm:px-6">
      <div className="mb-3 text-center">
        <h2 className="font-game text-lg font-bold glow-text">Chemin du karma</h2>
        <p className="text-xs text-theme-muted">
          {maxLevelReached ? (
            <>Niveau maximum atteint · {MAX_QUEST_RANK_TITLE}</>
          ) : (
            <>
              Niveau {currentLevel}
              {path.length > 0 ? ` / ${path[path.length - 1].level}` : ""}
            </>
          )}
        </p>
      </div>

      <div className="relative mx-auto h-[12.5rem] max-w-xs">
        <PathConnectors bottom={bottom} middle={middle} top={top} />
        <BubbleSlot node={top} pulse={pulseLevel === top.level} position="top" />
        <BubbleSlot node={middle} pulse={pulseLevel === middle.level} position="middle" />
        <BubbleSlot node={bottom} pulse={pulseLevel === bottom.level} position="bottom" />

        {maxLevelReached ? (
          <p className="absolute inset-x-0 top-0 text-center text-[10px] font-semibold text-theme-good">
            {MAX_QUEST_RANK_TITLE}
          </p>
        ) : (
          atSummit && (
            <p className="absolute inset-x-0 top-0 text-center text-[10px] text-theme-good">
              Sommet
            </p>
          )
        )}
      </div>
    </section>
  );
}
