"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionArrow,
  AidGlyph,
  isPlayerAid,
  orderAids,
  type DiagramAction,
  type DiagramAid,
} from "./PitchDiagram";

// Actions where the moving token is the ball; RUN moves a player instead.
const BALL_KINDS = new Set(["PASS", "SHOT", "CARRY", "DRIBBLE"]);

type Seg = { action: DiagramAction; start: number; dur: number };

/**
 * Animated version of the pitch diagram: the same DrillAction list drives a play
 * button that walks the sequence, tweening a ball along passes/shots/dribbles and
 * labelled player glyphs along runs. Falls back to a static diagram when there are
 * no actions.
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

  const [slowMo, setSlowMo] = useState(false);
  const speedFactor = slowMo ? 0.35 : 1;

  // Build a timeline: each action gets a duration based on its length, plus a gap.
  // Duration and gap are scaled by speedFactor for slow-motion.
  const segs = useMemo<Seg[]>(() => {
    const gap = 260 / speedFactor;
    const result: Seg[] = [];
    let cursor = 0;
    for (const a of actions) {
      const dist = Math.hypot(a.toX - a.fromX, a.toY - a.fromY);
      const dur = Math.max(650, dist * 95) / speedFactor;
      result.push({ action: a, start: cursor, dur });
      cursor += dur + gap;
    }
    return result;
  }, [actions, slowMo]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = segs.length > 0 ? segs[segs.length - 1].start + segs[segs.length - 1].dur : 0;

  // For each action, which aid index (PLAYER/PLAYER_OPP) is being moved?
  // Tracks positions through prior RUN actions so matching stays correct.
  const actionToPlayer = useMemo<number[]>(() => {
    const curPos = aids.map(a => ({ x: a.x, y: a.y }));
    return actions.map(action => {
      if (action.kind !== "RUN") return -1;
      let best = -1, bestDist = 3; // 3 m proximity threshold
      aids.forEach((aid, j) => {
        if (!isPlayerAid(aid.type)) return;
        const d = Math.hypot(curPos[j].x - action.fromX, curPos[j].y - action.fromY);
        if (d < bestDist) { bestDist = d; best = j; }
      });
      if (best >= 0) curPos[best] = { x: action.toX, y: action.toY };
      return best;
    });
  }, [aids, actions]);

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
  function toggleSlowMo() {
    setSlowMo(s => !s);
    setElapsed(0);
    setPlaying(false);
  }

  // Which segment are we in, and how far along (eased)?
  const activeIdx = segs.findIndex((s) => elapsed >= s.start && elapsed < s.start + s.dur);
  const started = elapsed > 0;
  let ballToken: { x: number; y: number } | null = null;
  if (segs.length > 0) {
    const seg = activeIdx >= 0 ? segs[activeIdx] : elapsed >= total ? segs[segs.length - 1] : segs[0];
    const localRaw =
      activeIdx >= 0 ? (elapsed - seg.start) / seg.dur : elapsed >= total ? 1 : 0;
    const t = ease(localRaw);
    const a = seg.action;
    if (playing && BALL_KINDS.has(a.kind)) {
      ballToken = {
        x: a.fromX + (a.toX - a.fromX) * t,
        y: a.fromY + (a.toY - a.fromY) * t,
      };
    }
  }
  const highlightIdx = activeIdx >= 0 ? activeIdx : elapsed >= total ? segs.length - 1 : -1;

  // Compute each player's current position based on elapsed time.
  // Players glide along their assigned RUN actions; other aids stay fixed.
  const playerPositions: { x: number; y: number }[] = aids.map(a => ({ x: a.x, y: a.y }));
  if (started) {
    for (let i = 0; i < segs.length; i++) {
      const playerIdx = actionToPlayer[i];
      if (playerIdx < 0 || elapsed < segs[i].start) continue;
      const t = ease(Math.min(1, (elapsed - segs[i].start) / segs[i].dur));
      const a = segs[i].action;
      playerPositions[playerIdx] = {
        x: a.fromX + (a.toX - a.fromX) * t,
        y: a.fromY + (a.toY - a.fromY) * t,
      };
    }
  }

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
        {/* Render players at their computed positions; other aids stay fixed. */}
        {orderAids(aids).map(({ aid: a, i }) => {
          const pos = started && isPlayerAid(a.type) ? playerPositions[i] : { x: a.x, y: a.y };
          return (
            <AidGlyph key={i} aid={a} cx={mx(pos.x)} cy={my(pos.y)} scale={scale} fx={footprintX} fy={footprintY} />
          );
        })}
        {/* Ball token for pass/shot/dribble/carry — player glyphs handle RUN. */}
        {ballToken && (
          <circle cx={mx(ballToken.x)} cy={my(ballToken.y)} r={5} fill="#ffffff" stroke="#0f172a" strokeWidth={1.5} />
        )}
      </svg>

      {segs.length > 0 && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
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
          <button
            type="button"
            onClick={toggleSlowMo}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              slowMo
                ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {slowMo ? "1× Normaal" : "½× Langzaam"}
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
