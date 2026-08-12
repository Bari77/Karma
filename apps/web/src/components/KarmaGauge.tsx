"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { ReactNode } from "react";
import "./karma-gauge.css";

interface KarmaGaugeProps {
  score: number;
  max: number;
  dailyDecay: number;
  username?: string;
  variant?: "full" | "horizontal";
  bare?: boolean;
}

const SEGMENTS = 28;
const CYAN = "#22d3ee";
const PURPLE = "#c026d3";
const CYAN_NEON = "#00f0ff";
const PURPLE_NEON = "#e040fb";
const CYAN_DIM = "#0e7490";
const PURPLE_DIM = "#581c87";

const VB_W = 520;
const VB_H = 365;
const CX = VB_W / 2;
const CY = 170;
const SEG_RADIUS = 140;
const YIN_R = 52;

/** Segments : h = épaisseur radiale ; w = 1 cran le long de l'arc (avec petit interstice) */
const SEG_ARC_PITCH = (Math.PI * SEG_RADIUS) / (SEGMENTS - 1);
const SEG_GAP_RATIO = 0.1;
const SEG_W = SEG_ARC_PITCH * (1 - SEG_GAP_RATIO);
const SEG_H = 24;

function getMood(percent: number): { label: string; color: string } {
  if (percent >= 80) return { label: "Légendaire ✨", color: CYAN };
  if (percent >= 60) return { label: "Équilibré ⚡", color: "#a855f7" };
  if (percent >= 40) return { label: "En baisse 📉", color: "#f59e0b" };
  if (percent >= 20) return { label: "Critique 🔥", color: "#f97316" };
  return { label: "Chaos total 💀", color: "#f43f5e" };
}

function segmentColor(index: number, total: number, lit: boolean): string {
  const t = index / (total - 1);
  const from = lit ? CYAN_NEON : CYAN_DIM;
  const to = lit ? PURPLE_NEON : PURPLE_DIM;
  return mixColor(from, to, t);
}

function mixColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0")}`;
}

function Segment({
  index,
  cx,
  cy,
  radius,
  lit,
}: {
  index: number;
  cx: number;
  cy: number;
  radius: number;
  lit: boolean;
}) {
  const angle = Math.PI + (index / (SEGMENTS - 1)) * Math.PI;
  const x = cx + Math.cos(angle) * radius;
  const y = cy + Math.sin(angle) * radius;
  const w = SEG_W;
  const h = SEG_H;
  const deg = (angle * 180) / Math.PI + 90;
  const color = segmentColor(index, SEGMENTS, lit);

  return (
    <rect
      x={-w / 2}
      y={-h / 2}
      width={w}
      height={h}
      rx={2}
      fill={color}
      opacity={lit ? 1 : 0.3}
      className={lit ? "karma-segment-lit" : undefined}
      style={{
        filter: lit ? `drop-shadow(0 0 5px ${color}) drop-shadow(0 0 10px ${color}66)` : undefined,
      }}
      transform={`translate(${x}, ${y}) rotate(${deg})`}
    />
  );
}

/** Yin-yang néon contour uniquement (pas de remplissage) */
function YinYang({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const dotR = r * 0.12;
  // Vague en S : deux demi-cercles r/2 opposés (haut → centre → bas), sans l'arc du grand cercle
  const sCurve = `M 0 ${-r} A ${r / 2} ${r / 2} 0 0 1 0 0 A ${r / 2} ${r / 2} 0 0 0 0 ${r}`;

  return (
    <g transform={`translate(${cx}, ${cy})`} className="karma-yinyang">
      <circle
        r={r + 10}
        fill="none"
        stroke="url(#yinyangRing)"
        strokeWidth={0.75}
        opacity={0.2}
        className="karma-yinyang-halo"
      />

      <circle
        r={r}
        fill="none"
        stroke="url(#yinyangRing)"
        strokeWidth={2.5}
        filter="url(#yinNeonGlow)"
        className="karma-yinyang-ring"
      />
      <path
        d={sCurve}
        fill="none"
        stroke="url(#yinyangRing)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#yinNeonGlow)"
      />

      <circle
        cx={0}
        cy={-r / 2}
        r={dotR}
        fill="none"
        stroke={PURPLE_NEON}
        strokeWidth={2}
        filter="url(#dotNeonGlow)"
      />
      <circle
        cx={0}
        cy={r / 2}
        r={dotR}
        fill="none"
        stroke={CYAN_NEON}
        strokeWidth={2}
        filter="url(#dotNeonGlow)"
      />
    </g>
  );
}

function HudDecorations({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const bracket = 18;
  const bracketW = 6;
  return (
    <g opacity={0.45}>
      <path
        d={`M ${cx - r - bracket} ${cy - 12} L ${cx - r - bracket - bracketW} ${cy - 12} L ${cx - r - bracket - bracketW} ${cy + 12} L ${cx - r - bracket} ${cy + 12}`}
        fill="none"
        stroke={CYAN}
        strokeWidth={1}
      />
      <path
        d={`M ${cx + r + bracket} ${cy - 12} L ${cx + r + bracket + bracketW} ${cy - 12} L ${cx + r + bracket + bracketW} ${cy + 12} L ${cx + r + bracket} ${cy + 12}`}
        fill="none"
        stroke={PURPLE}
        strokeWidth={1}
      />
      <path d={`M ${cx - 6} ${cy - r - 10} l 6 -6 l 6 6`} fill="none" stroke={CYAN} strokeWidth={1.5} strokeLinecap="round" />
      <path d={`M ${cx - 6} ${cy - r - 16} l 6 -6 l 6 6`} fill="none" stroke={CYAN} strokeWidth={1} strokeLinecap="round" opacity={0.5} />
      <path d={`M ${cx - 6} ${cy + r + 10} l 6 6 l 6 -6`} fill="none" stroke={PURPLE} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  );
}

/** Groupe centré : translate SVG sur le parent, animation CSS sur l'enfant (évite le conflit de transform) */
function OrbitGroup({
  cx,
  cy,
  className,
  children,
}: {
  cx: number;
  cy: number;
  className: string;
  children: ReactNode;
}) {
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <g className={className}>{children}</g>
    </g>
  );
}

/** Anneaux pointillés animés — rotation, pulsation, aller-retour */
function MysticRings({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const inner = r + 10;
  const mid = r + 18;
  const outer = r + 26;

  return (
    <g aria-hidden="true">
      <OrbitGroup cx={cx} cy={cy} className="karma-orbit-spin-slow">
        <circle
          r={outer}
          fill="none"
          stroke={CYAN}
          strokeWidth={0.9}
          strokeDasharray="3 14"
          strokeLinecap="round"
          opacity={0.35}
          className="karma-dash-flow-cyan"
        />
      </OrbitGroup>

      <OrbitGroup cx={cx} cy={cy} className="karma-orbit-spin-ccw">
        <circle
          r={mid}
          fill="none"
          stroke={PURPLE}
          strokeWidth={0.75}
          strokeDasharray="2 10"
          strokeLinecap="round"
          opacity={0.4}
          className="karma-dash-flow-purple"
        />
      </OrbitGroup>

      <OrbitGroup cx={cx} cy={cy} className="karma-orbit-breathe">
        <circle
          r={inner}
          fill="none"
          stroke="url(#hudRing)"
          strokeWidth={0.8}
          strokeDasharray="5 12"
          strokeLinecap="round"
        />
      </OrbitGroup>

      <OrbitGroup cx={cx} cy={cy} className="karma-orbit-wobble">
        <circle
          r={outer + 10}
          fill="none"
          stroke={CYAN}
          strokeWidth={0.5}
          strokeDasharray="8 22 4 28"
          strokeLinecap="round"
          opacity={0.2}
        />
      </OrbitGroup>

      <OrbitGroup cx={cx} cy={cy} className="karma-orbit-pulse-ring">
        <circle
          r={mid - 4}
          fill="none"
          stroke={PURPLE}
          strokeWidth={0.6}
          strokeDasharray="6 18"
          strokeLinecap="round"
          opacity={0.3}
        />
      </OrbitGroup>

      <OrbitGroup cx={cx} cy={cy} className="karma-mystic-dot-orbit">
        <circle cx={outer - 2} cy={0} r={2} fill={CYAN} opacity={0.7} style={{ filter: `drop-shadow(0 0 4px ${CYAN})` }} />
        <circle cx={-(outer - 2)} cy={0} r={1.2} fill={CYAN} opacity={0.4} />
      </OrbitGroup>
      <OrbitGroup cx={cx} cy={cy} className="karma-mystic-dot-orbit-reverse">
        <circle cx={0} cy={-(mid - 2)} r={1.6} fill={PURPLE} opacity={0.65} style={{ filter: `drop-shadow(0 0 4px ${PURPLE})` }} />
        <circle cx={0} cy={mid - 2} r={1.2} fill={PURPLE} opacity={0.35} />
      </OrbitGroup>
      <OrbitGroup cx={cx} cy={cy} className="karma-orbit-spin-cw">
        <circle cx={inner} cy={0} r={1} fill="#e879f9" opacity={0.5} />
        <circle cx={-inner} cy={0} r={0.8} fill="#67e8f9" opacity={0.45} />
      </OrbitGroup>
    </g>
  );
}

function GaugeDefs({ idPrefix = "" }: { idPrefix?: string }) {
  const p = idPrefix;
  return (
    <defs>
      <filter id={`${p}yinNeonGlow`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id={`${p}dotNeonGlow`} x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <linearGradient id={`${p}yinyangRing`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={CYAN_NEON} />
        <stop offset="45%" stopColor={CYAN} />
        <stop offset="55%" stopColor={PURPLE} />
        <stop offset="100%" stopColor={PURPLE_NEON} />
      </linearGradient>
      <linearGradient id={`${p}hudRing`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={CYAN} stopOpacity={0.6} />
        <stop offset="50%" stopColor="#64748b" stopOpacity={0.3} />
        <stop offset="100%" stopColor={PURPLE} stopOpacity={0.6} />
      </linearGradient>
    </defs>
  );
}

function HorizontalSegments({ filled }: { filled: number }) {
  return (
    <div className="flex w-full gap-[3px]" role="img" aria-hidden>
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const lit = i < filled;
        const color = segmentColor(i, SEGMENTS, lit);
        return (
          <div
            key={i}
            className={clsx(
              "karma-bar-segment h-3 min-w-0 flex-1 rounded-sm",
              lit && "karma-segment-lit"
            )}
            style={{
              backgroundColor: color,
              opacity: lit ? 1 : 0.35,
              boxShadow: lit ? `0 0 6px ${color}88, 0 0 2px ${color}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function KarmaGaugeHorizontal({
  score,
  max,
  dailyDecay,
  bare = false,
}: {
  score: number;
  max: number;
  dailyDecay: number;
  bare?: boolean;
}) {
  const percent = Math.round((score / max) * 100);
  const mood = getMood(percent);
  const filledSegments = Math.round((score / max) * SEGMENTS);

  return (
    <div
      className={clsx(
        "relative w-full overflow-hidden",
        bare ? "card-gaming px-3 py-2" : "card-gaming px-4 py-3"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-600/5" />

      <div className="relative flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <HorizontalSegments filled={filledSegments} />
        </div>
        <div className="karma-score-text shrink-0 text-right leading-none">
          <p className="font-game text-2xl font-black text-white">{score}</p>
          <p className="mt-0.5 font-game text-xs text-purple-300/60">/ {max} KP</p>
        </div>
      </div>

      <p
        className="relative mt-2 text-center font-game text-sm font-bold tracking-wide"
        style={{ color: mood.color }}
      >
        {mood.label}
      </p>
      <p className="relative mt-0.5 text-center text-[11px] text-purple-300/45">
        −{dailyDecay} karma / jour d&apos;inactivité
      </p>
    </div>
  );
}

export function KarmaGauge({
  score,
  max,
  dailyDecay,
  username,
  variant = "full",
  bare = false,
}: KarmaGaugeProps) {
  if (variant === "horizontal") {
    return (
      <KarmaGaugeHorizontal
        score={score}
        max={max}
        dailyDecay={dailyDecay}
        bare={bare}
      />
    );
  }

  const percent = Math.round((score / max) * 100);
  const mood = getMood(percent);
  const filledSegments = Math.round((score / max) * SEGMENTS);

  return (
    <div className="card-gaming relative w-full overflow-hidden px-4 py-6 pb-2 text-center">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-600/5" />

      {username && (
        <p className="relative mb-2 font-game text-sm text-purple-300/80">{username}</p>
      )}

      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mx-auto w-full"
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="karma-gauge-svg mx-auto w-full max-w-2xl"
          aria-label={`Karma ${score} sur ${max}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <GaugeDefs />

          <MysticRings cx={CX} cy={CY} r={SEG_RADIUS} />
          <HudDecorations cx={CX} cy={CY} r={SEG_RADIUS} />

          {Array.from({ length: SEGMENTS }, (_, i) => (
            <Segment
              key={i}
              index={i}
              cx={CX}
              cy={CY}
              radius={SEG_RADIUS}
              lit={i < filledSegments}
            />
          ))}

          <YinYang cx={CX} cy={CY} r={YIN_R} />

          <text
            x={CX}
            y={CY + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize={32}
            fontFamily="Orbitron, sans-serif"
            fontWeight="900"
            className="karma-score-text"
          >
            {score}
          </text>
          <text
            x={CX}
            y={CY + YIN_R + 22}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={13}
            fontFamily="Rajdhani, sans-serif"
          >
            / {max} karma
          </text>
          <text
            x={CX}
            y={CY + YIN_R + 44}
            textAnchor="middle"
            fill={mood.color}
            fontSize={16}
            fontFamily="Orbitron, sans-serif"
            fontWeight="700"
          >
            {mood.label}
          </text>
          <text
            x={CX}
            y={CY + YIN_R + 64}
            textAnchor="middle"
            fill="#a78bfa"
            fillOpacity={0.6}
            fontSize={12}
            fontFamily="Rajdhani, sans-serif"
          >
            −{dailyDecay} karma par jour d'inactivité
          </text>
        </svg>
      </motion.div>
    </div>
  );
}
