"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FORMATIONS, FORMATION_KEYS, getFormation } from "@/lib/formations";
import {
  LINEUP_ROLE_LABELS,
  POSITION_LABELS,
  type LineupRole,
  type PositionCode,
} from "@/lib/enums";
import type { MatchPlayerRow, PlacementMap } from "@/lib/matches";

// Pitch geometry (metres → viewBox pixels). Vertical pitch: keeper at the bottom.
const PITCH_W = 64;
const PITCH_L = 100;
const SCALE = 6;
const PAD = 16;
const VB_W = PITCH_W * SCALE + PAD * 2;
const VB_H = PITCH_L * SCALE + PAD * 2;
const SNAP_M = 11; // snap-to-slot radius in metres

type Placement = {
  role: LineupRole;
  x: number | null;
  y: number | null;
  slot: number | null;
};

function initialsOf(p: MatchPlayerRow): string {
  if (p.shirtNumber != null) return String(p.shirtNumber);
  return (p.firstName[0] ?? "?").toUpperCase();
}

function shortName(p: MatchPlayerRow): string {
  return p.lastName ? `${p.firstName[0]}. ${p.lastName}` : p.firstName;
}

export default function LineupPitch({
  matchId,
  formation,
  players,
  action,
  saveDefaultAction,
  defaultPlacements,
  defaultFormation,
  previousPlacements,
  previousFormation,
}: {
  matchId: number;
  formation: string;
  players: MatchPlayerRow[];
  action: (matchId: number, formData: FormData) => void | Promise<void>;
  saveDefaultAction: (formData: FormData) => void | Promise<void>;
  defaultPlacements?: PlacementMap;
  defaultFormation?: string;
  previousPlacements?: PlacementMap | null;
  previousFormation?: string | null;
}) {
  // Formation is editable here and travels with the lineup: applying the default or a
  // previous match switches it, and saving persists it back onto the match.
  const [formationKey, setFormationKey] = useState(formation);
  const slots = useMemo(() => getFormation(formationKey).slots, [formationKey]);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const bound = action.bind(null, matchId);

  const [place, setPlace] = useState<Record<number, Placement>>(() => {
    const init: Record<number, Placement> = {};
    for (const p of players) {
      init[p.playerId] = { role: p.role, x: p.x, y: p.y, slot: p.slot };
    }
    return init;
  });
  const [drag, setDrag] = useState<{ playerId: number; x: number; y: number } | null>(
    null,
  );
  // Mirrors `drag.x/y` for the auto-scroll rAF loop, which needs the latest
  // pointer position without waiting on React state/render.
  const dragPosRef = useRef<{ x: number; y: number } | null>(null);

  // Auto-scroll the page while dragging: the drop target (pitch) is often below the
  // fold on mobile, and the drag overlay's `touch-none` blocks the normal scroll
  // gesture, so without this a player can never be carried onto an off-screen pitch.
  useEffect(() => {
    if (drag == null) return;
    const EDGE = 90; // px from viewport top/bottom that triggers scrolling
    const MAX_SPEED = 18; // px per frame at the very edge
    let raf = 0;
    const tick = () => {
      const pos = dragPosRef.current;
      if (pos) {
        const vh = window.innerHeight;
        let dy = 0;
        if (pos.y < EDGE) {
          dy = -MAX_SPEED * (1 - pos.y / EDGE);
        } else if (pos.y > vh - EDGE) {
          dy = MAX_SPEED * (1 - (vh - pos.y) / EDGE);
        }
        if (dy !== 0) window.scrollBy(0, dy);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // Depend on the player id (stable for the duration of a drag), not the whole
    // `drag` object, which gets a new x/y on every pointer move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.playerId]);

  const byId = useMemo(() => new Map(players.map((p) => [p.playerId, p])), [players]);

  const mx = (x: number) => PAD + x * SCALE;
  const my = (y: number) => PAD + y * SCALE;

  function matchesPos(p: MatchPlayerRow, code: PositionCode): boolean {
    return p.preferredPosition === code || p.secondaryPosition === code;
  }

  // Which player (if any) currently occupies a given formation slot index.
  function playerOnSlot(slotIdx: number): number | null {
    for (const [pid, pl] of Object.entries(place)) {
      if (pl.slot === slotIdx) return Number(pid);
    }
    return null;
  }

  function assignToSlot(playerId: number, slotIdx: number) {
    const slot = slots[slotIdx];
    setPlace((prev) => {
      const next = { ...prev };
      const occupant = Object.keys(next).find(
        (k) => next[Number(k)].slot === slotIdx && Number(k) !== playerId,
      );
      if (occupant) {
        next[Number(occupant)] = { role: "BENCH", x: null, y: null, slot: null };
      }
      next[playerId] = {
        role: "STARTER",
        x: slot.x * PITCH_W,
        y: slot.y * PITCH_L,
        slot: slotIdx,
      };
      return next;
    });
  }

  function placeFree(playerId: number, xm: number, ym: number) {
    setPlace((prev) => ({
      ...prev,
      [playerId]: { role: "STARTER", x: xm, y: ym, slot: null },
    }));
  }

  function benchPlayer(playerId: number) {
    setPlace((prev) => ({
      ...prev,
      [playerId]: { role: "BENCH", x: null, y: null, slot: null },
    }));
  }

  function setRole(playerId: number, role: LineupRole) {
    setPlace((prev) => ({
      ...prev,
      [playerId]: { role, x: null, y: null, slot: null },
    }));
  }

  // --- drag handling --------------------------------------------------------
  function startDrag(playerId: number, e: React.PointerEvent) {
    e.preventDefault();
    dragPosRef.current = { x: e.clientX, y: e.clientY };
    setDrag({ playerId, x: e.clientX, y: e.clientY });
  }

  function clientToMetres(clientX: number, clientY: number): { x: number; y: number } | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const loc = pt.matrixTransform(ctm.inverse());
    const insideX = loc.x >= PAD && loc.x <= PAD + PITCH_W * SCALE;
    const insideY = loc.y >= PAD && loc.y <= PAD + PITCH_L * SCALE;
    if (!insideX || !insideY) return null;
    return { x: (loc.x - PAD) / SCALE, y: (loc.y - PAD) / SCALE };
  }

  function endDrag(clientX: number, clientY: number) {
    if (!drag) return;
    const pid = drag.playerId;
    const m = clientToMetres(clientX, clientY);
    dragPosRef.current = null;
    setDrag(null);
    if (!m) {
      benchPlayer(pid);
      return;
    }
    // Snap to the nearest formation slot if close enough, else drop free.
    let best = -1;
    let bestDist = Infinity;
    slots.forEach((s, i) => {
      const d = Math.hypot(s.x * PITCH_W - m.x, s.y * PITCH_L - m.y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    if (best >= 0 && bestDist <= SNAP_M) assignToSlot(pid, best);
    else placeFree(pid, m.x, m.y);
  }

  function autoFill() {
    setPlace((prev) => {
      const next = { ...prev };
      const taken = new Set(
        Object.values(next)
          .map((p) => p.slot)
          .filter((s): s is number => s != null),
      );
      const availableIds = players
        .filter((p) => {
          const pl = next[p.playerId];
          return pl.role !== "UNAVAILABLE" && pl.slot == null;
        })
        .map((p) => p.playerId);

      slots.forEach((slot, i) => {
        if (taken.has(i)) return;
        const pick =
          availableIds.find((id) => byId.get(id)?.preferredPosition === slot.code) ??
          availableIds.find((id) => byId.get(id)?.secondaryPosition === slot.code) ??
          availableIds[0];
        if (pick == null) return;
        availableIds.splice(availableIds.indexOf(pick), 1);
        taken.add(i);
        next[pick] = {
          role: "STARTER",
          x: slot.x * PITCH_W,
          y: slot.y * PITCH_L,
          slot: i,
        };
      });
      return next;
    });
  }

  function clearPitch() {
    setPlace((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (next[Number(k)].role === "STARTER") {
          next[Number(k)] = { role: "BENCH", x: null, y: null, slot: null };
        }
      }
      return next;
    });
  }

  // Replace the whole squad's placement from a stored map (default / previous match).
  // Players not in the map fall back to the bench.
  function applyPlacements(map: PlacementMap) {
    setPlace(() => {
      const next: Record<number, Placement> = {};
      for (const p of players) {
        const m = map[p.playerId];
        next[p.playerId] = m
          ? { role: m.role, x: m.x, y: m.y, slot: m.slot }
          : { role: "BENCH", x: null, y: null, slot: null };
      }
      return next;
    });
  }

  // Manual formation switch: keep players' coords but unpin their slot indices, since
  // slot N means a different position in the new shape (they can be re-dropped/snapped).
  function changeFormation(key: string) {
    setFormationKey(key);
    setPlace((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        const p = next[Number(k)];
        if (p.role === "STARTER") next[Number(k)] = { ...p, slot: null };
      }
      return next;
    });
  }

  function useDefault() {
    if (defaultFormation) setFormationKey(defaultFormation);
    if (defaultPlacements) applyPlacements(defaultPlacements);
  }

  function usePrevious() {
    if (previousFormation) setFormationKey(previousFormation);
    if (previousPlacements) applyPlacements(previousPlacements);
  }

  const hasDefault =
    !!defaultPlacements && Object.keys(defaultPlacements).length > 0;
  const hasPrevious =
    !!previousPlacements && Object.keys(previousPlacements).length > 0;

  // --- derived lists --------------------------------------------------------
  const starters = players.filter((p) => place[p.playerId].role === "STARTER");
  const bench = players.filter((p) => place[p.playerId].role === "BENCH");
  const unavailable = players.filter((p) => place[p.playerId].role === "UNAVAILABLE");
  const draggedPlayer = drag ? byId.get(drag.playerId) : null;

  // Persist only meaningful states (starters + unavailable); the rest stays implicit.
  const lineupPayload = players
    .map((p) => ({ playerId: p.playerId, ...place[p.playerId] }))
    .filter((e) => e.role === "STARTER" || e.role === "UNAVAILABLE");

  return (
    <form action={bound} className="grid gap-6 lg:grid-cols-[360px_1fr]">
      {/* Left rail: availability lists */}
      <div className="space-y-5">
        <label className="block text-sm">
          <span className="block font-medium text-zinc-700">Opstelling</span>
          <select
            value={formationKey}
            onChange={(e) => changeFormation(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
          >
            {FORMATION_KEYS.map((k) => (
              <option key={k} value={k}>
                {FORMATIONS[k].label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          {hasDefault && (
            <button
              type="button"
              onClick={useDefault}
              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
            >
              Standaardopstelling gebruiken
            </button>
          )}
          {hasPrevious && (
            <button
              type="button"
              onClick={usePrevious}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Neem over van vorige wedstrijd
            </button>
          )}
          <button
            type="button"
            onClick={autoFill}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Automatisch invullen
          </button>
          <button
            type="button"
            onClick={clearPitch}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Veld leegmaken
          </button>
        </div>

        <RailSection title={`Beschikbaar (${bench.length})`}>
          {bench.length === 0 && <Empty>Iedereen is opgesteld of afwezig.</Empty>}
          {bench.map((p) => (
            <div
              key={p.playerId}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2 py-1.5"
            >
              <button
                type="button"
                onPointerDown={(e) => startDrag(p.playerId, e)}
                title="Sleep naar het veld"
                className="grid h-8 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white"
              >
                {initialsOf(p)}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-800">
                  {shortName(p)}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {POSITION_LABELS[p.preferredPosition as PositionCode] ??
                    p.preferredPosition}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRole(p.playerId, "UNAVAILABLE")}
                className="rounded px-1.5 py-1 text-xs text-zinc-400 hover:text-red-600"
                title="Niet beschikbaar"
              >
                ✕
              </button>
            </div>
          ))}
        </RailSection>

        <RailSection title={`Basis op het veld (${starters.length}/11)`}>
          {starters.length === 0 && <Empty>Sleep spelers naar het veld.</Empty>}
          {starters.map((p) => (
            <div
              key={p.playerId}
              className="flex items-center gap-2 rounded-lg bg-emerald-50 px-2 py-1.5"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {initialsOf(p)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
                {shortName(p)}
              </span>
              <button
                type="button"
                onClick={() => benchPlayer(p.playerId)}
                className="rounded px-1.5 py-1 text-xs text-zinc-500 hover:text-zinc-800"
              >
                Naar bank
              </button>
            </div>
          ))}
        </RailSection>

        {unavailable.length > 0 && (
          <RailSection title={`Niet beschikbaar (${unavailable.length})`}>
            {unavailable.map((p) => (
              <div
                key={p.playerId}
                className="flex items-center gap-2 rounded-lg bg-zinc-50 px-2 py-1.5"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-500 line-through">
                  {shortName(p)}
                </span>
                <button
                  type="button"
                  onClick={() => setRole(p.playerId, "BENCH")}
                  className="rounded px-1.5 py-1 text-xs text-emerald-700 hover:underline"
                >
                  Beschikbaar
                </button>
              </div>
            ))}
          </RailSection>
        )}

        <input type="hidden" name="lineup" value={JSON.stringify(lineupPayload)} />
        <input type="hidden" name="formation" value={formationKey} />
        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
        >
          Opstelling opslaan
        </button>
        <button
          type="submit"
          formAction={saveDefaultAction}
          className="w-full rounded-lg border border-emerald-600 px-5 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          Opslaan als standaardopstelling
        </button>
      </div>

      {/* Pitch */}
      <div className="rounded-xl border border-zinc-200 bg-white p-2">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="mx-auto block max-h-[70vh] w-full touch-none"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Opstelling op het veld"
        >
          <PitchMarkings mx={mx} my={my} />

          {/* Empty formation slots */}
          {slots.map((s, i) => {
            const occupied = playerOnSlot(i) != null;
            if (occupied) return null;
            const highlight = draggedPlayer
              ? matchesPos(draggedPlayer, s.code)
              : false;
            return (
              <g key={`slot-${i}`}>
                <circle
                  cx={mx(s.x * PITCH_W)}
                  cy={my(s.y * PITCH_L)}
                  r={13}
                  fill={highlight ? "#dcfce7" : "#ffffff"}
                  fillOpacity={0.15}
                  stroke={highlight ? "#16a34a" : "#ffffff"}
                  strokeOpacity={0.7}
                  strokeDasharray="4 3"
                  strokeWidth={1.5}
                />
                <text
                  x={mx(s.x * PITCH_W)}
                  y={my(s.y * PITCH_L)}
                  fontSize={9}
                  fill="#ffffff"
                  fillOpacity={0.85}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {s.code}
                </text>
              </g>
            );
          })}

          {/* Placed players */}
          {starters.map((p) => {
            const pl = place[p.playerId];
            if (pl.x == null || pl.y == null) return null;
            const slot = pl.slot != null ? slots[pl.slot] : null;
            const good = slot ? matchesPos(p, slot.code) : true;
            return (
              <g
                key={`tok-${p.playerId}`}
                transform={`translate(${mx(pl.x)}, ${my(pl.y)})`}
                className="cursor-grab touch-none"
                onPointerDown={(e) => startDrag(p.playerId, e)}
              >
                <circle
                  r={12}
                  fill={good ? "#2563eb" : "#ea580c"}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <text
                  fontSize={11}
                  fontWeight={700}
                  fill="#ffffff"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {initialsOf(p)}
                </text>
                <text
                  y={22}
                  fontSize={9}
                  fill="#ffffff"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {shortName(p)}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="px-2 py-1 text-center text-xs text-zinc-500">
          Sleep spelers vanuit “Beschikbaar” op het veld. Blauw = op voorkeurspositie,
          oranje = andere positie.
        </p>
      </div>

      {/* Drag overlay + ghost token */}
      {drag && draggedPlayer && (
        <div
          className="fixed inset-0 z-50 touch-none"
          onPointerMove={(e) => {
            dragPosRef.current = { x: e.clientX, y: e.clientY };
            setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
          }}
          onPointerUp={(e) => endDrag(e.clientX, e.clientY)}
          onPointerCancel={() => {
            dragPosRef.current = null;
            setDrag(null);
          }}
        >
          <div
            className="pointer-events-none absolute grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-lg"
            style={{ left: drag.x, top: drag.y }}
          >
            {initialsOf(draggedPlayer)}
          </div>
        </div>
      )}
    </form>
  );
}

function PitchMarkings({
  mx,
  my,
}: {
  mx: (x: number) => number;
  my: (y: number) => number;
}) {
  const left = mx(0);
  const right = mx(PITCH_W);
  const top = my(0);
  const bottom = my(PITCH_L);
  const midY = my(PITCH_L / 2);
  const boxW = 44; // penalty box width in metres
  const boxD = 16.5; // depth in metres
  const sixW = 18;
  const sixD = 5.5;
  return (
    <g>
      <rect
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        fill="#15803d"
        stroke="#ffffff"
        strokeOpacity={0.8}
        strokeWidth={2}
        rx={4}
      />
      <line x1={left} y1={midY} x2={right} y2={midY} stroke="#ffffff" strokeOpacity={0.7} />
      <circle
        cx={mx(PITCH_W / 2)}
        cy={midY}
        r={9.15 * 6}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.7}
      />
      {/* Bottom penalty + six-yard box (own goal) */}
      <rect
        x={mx((PITCH_W - boxW) / 2)}
        y={my(PITCH_L - boxD)}
        width={boxW * 6}
        height={boxD * 6}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.7}
      />
      <rect
        x={mx((PITCH_W - sixW) / 2)}
        y={my(PITCH_L - sixD)}
        width={sixW * 6}
        height={sixD * 6}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.7}
      />
      {/* Top penalty + six-yard box (opponent goal) */}
      <rect
        x={mx((PITCH_W - boxW) / 2)}
        y={top}
        width={boxW * 6}
        height={boxD * 6}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.7}
      />
      <rect
        x={mx((PITCH_W - sixW) / 2)}
        y={top}
        width={sixW * 6}
        height={sixD * 6}
        fill="none"
        stroke="#ffffff"
        strokeOpacity={0.7}
      />
    </g>
  );
}

function RailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-zinc-700">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-zinc-400">{children}</p>;
}
