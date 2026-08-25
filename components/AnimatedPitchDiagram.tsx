"use client";

import { useEffect, useRef, useState } from "react";
import {
  ActionArrow,
  AidGlyph,
  orderAids,
  type DiagramAction,
  type DiagramAid,
} from "./PitchDiagram";

// Actions where the moving token is the ball; RUN moves a player instead.
const BALL_KINDS = new Set(["PASS", "SHOT", "CARRY", "DRIBBLE"]);

type Seg = { action: DiagramAction; start: number; dur: number };

/**
 * Animated version of the pitch diagram: the same DrillAction list drives a play
 * button that walks the sequence, tweening a ball along passes/shots/dribbles and a
 * player token along runs. Falls back to a static diagram when there are no actions.
 */
export default function AnimatedPitchDiagram({
  footprintX,
  footprintY,
  aids,
  actions,
  scale = 8,
  className,
}: {
  footprintX: number;
  footprintY: number;
  aids: DiagramAid[];
  actions: DiagramAction[];
  scale?: number;
  className?: string;
}) {
  const pad = 14;
  const w = footprintX * scale + pad * 2;
  const h = footprintY * scale + pad * 2;
  const mx = (x: number) => pad + x * scale;
  const my = (y: number) => pad + y * scale;

  // Build a timeline: each action gets a duration based on its length, plus a gap.
  const gap = 260;
  const segs: Seg[] = [];
  let cursor = 0;
  for (const a of actions) {
    const dist = Math.hypot(a.toX - a.fromX, a.toY - a.fromY);
    const dur = Math.max(650, dist * 95);
    segs.push({ action: a, start: cursor, dur });
    cursor += dur + gap;
  }
  const total = cursor;

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    startRef.current = performance.now() - elapsed;
    const tick = () => {
      const e = performance.now() - startRef.current;
      if (e >= total) {
        setElapsed(total);
        setPlaying(false);
        return;
      }
      setElapsed(e);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  function play() {
    if (elapsed >= total) setElapsed(0);
    setPlaying(true);
  }
  function pause() {
    setPlaying(false);
  }
  function restart() {
    setElapsed(0);
    setPlaying(true);
  }

  // Which segment are we in, and how far along (eased)?
  const activeIdx = segs.findIndex((s) => elapsed >= s.start && elapsed < s.start + s.dur);
  const started = elapsed > 0;
  let token: { x: number; y: number; kind: string } | null = null;
  if (segs.length > 0) {
    const seg = activeIdx >= 0 ? segs[activeIdx] : elapsed >= total ? segs[segs.length - 1] : segs[0];
    const localRaw =
      activeIdx >= 0 ? (elapsed - seg.start) / seg.dur : elapsed >= total ? 1 : 0;
    const t = ease(localRaw);
    const a = seg.action;
    token = {
      x: a.fromX + (a.toX - a.fromX) * t,
      y: a.fromY + (a.toY - a.fromY) * t,
      kind: a.kind,
    };
  }
  const highlightIdx = activeIdx >= 0 ? activeIdx : elapsed >= total ? segs.length - 1 : -1;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Geanimeerde veldopstelling"
        preserveAspectRatio="xMidYMid meet"
        className="w-full"
      >
        <rect
          x={pad}
          y={pad}
          width={footprintX * scale}
          height={footprintY * scale}
          fill="#15803d"
          fillOpacity={0.1}
          stroke="#15803d"
          strokeOpacity={0.55}
          strokeWidth={1.5}
          rx={4}
        />
        <line
          x1={pad}
          y1={my(footprintY / 2)}
          x2={pad + footprintX * scale}
          y2={my(footprintY / 2)}
          stroke="#15803d"
          strokeOpacity={0.3}
          strokeDasharray="5 5"
        />
        {/* Arrows: dim past/future, highlight the active step while playing. */}
        {actions.map((a, i) => (
          <g key={`act-${i}`} opacity={!started ? 1 : i === highlightIdx ? 1 : 0.18}>
            <ActionArrow
              action={a}
              x1={mx(a.fromX)}
              y1={my(a.fromY)}
              x2={mx(a.toX)}
              y2={my(a.toY)}
            />
          </g>
        ))}
        {orderAids(aids).map(({ aid: a, i }) => (
          <AidGlyph key={i} aid={a} cx={mx(a.x)} cy={my(a.y)} scale={scale} fx={footprintX} fy={footprintY} />
        ))}
        {/* Moving token */}
        {playing && token && (
          BALL_KINDS.has(token.kind) ? (
            <circle cx={mx(token.x)} cy={my(token.y)} r={5} fill="#ffffff" stroke="#0f172a" strokeWidth={1.5} />
          ) : (
            <circle cx={mx(token.x)} cy={my(token.y)} r={6.5} fill="#2563eb" stroke="#ffffff" strokeWidth={1.5} opacity={0.85} />
          )
        )}
      </svg>

      {segs.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          {playing ? (
            <button
              type="button"
              onClick={pause}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
            >
              ❚❚ Pauze
            </button>
          ) : (
            <button
              type="button"
              onClick={play}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              ▶ Afspelen
            </button>
          )}
          <button
            type="button"
            onClick={restart}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            ↺ Opnieuw
          </button>
          {highlightIdx >= 0 && actions[highlightIdx]?.label && (
            <span className="text-sm text-zinc-500">
              Stap {highlightIdx + 1}: {actions[highlightIdx].label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ease(t: number): number {
  // easeInOutQuad for smoother start/stop
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
