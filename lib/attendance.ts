import { prisma } from "./prisma";
import { playerName } from "./players";
import { mulberry32, shuffle } from "./rng";

/** Cumulative count of `didCleanup=true` rows per player across all sessions. */
export async function getCleanupCounts(): Promise<Map<number, number>> {
  const rows = await prisma.attendance.findMany({
    where: { didCleanup: true },
    select: { playerId: true },
  });
  const map = new Map<number, number>();
  for (const row of rows) {
    map.set(row.playerId, (map.get(row.playerId) ?? 0) + 1);
  }
  return map;
}

type CleanupCandidate = { playerId: number; cleanupCount: number };

/**
 * Select up to 2 player IDs for cleanup duty, prioritising those with the
 * lowest cumulative cleanup count. Ties are broken by the supplied seeded RNG.
 */
export function pickCleaners(players: CleanupCandidate[], rng: () => number): number[] {
  if (players.length === 0) return [];
  const NEEDED = 2;
  const result: number[] = [];
  const remaining = [...players];

  while (result.length < NEEDED && remaining.length > 0) {
    const minCount = Math.min(...remaining.map((p) => p.cleanupCount));
    const atMin = remaining.filter((p) => p.cleanupCount === minCount);
    const picked = atMin.length > NEEDED - result.length
      ? shuffle(atMin, rng).slice(0, NEEDED - result.length)
      : atMin;
    for (const p of picked) {
      result.push(p.playerId);
      remaining.splice(remaining.findIndex((r) => r.playerId === p.playerId), 1);
    }
  }

  return result;
}

/**
 * Recalculate which players are assigned cleanup for every session from today
 * onwards (date ≥ midnight today), in chronological order. Past sessions are
 * left untouched and used as the baseline for cumulative counts.
 */
export async function reassignCleanups(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Baseline: count cleanups from past sessions only
  const pastRows = await prisma.attendance.findMany({
    where: { didCleanup: true, session: { date: { lt: today } } },
    select: { playerId: true },
  });
  const counts = new Map<number, number>();
  for (const row of pastRows) {
    counts.set(row.playerId, (counts.get(row.playerId) ?? 0) + 1);
  }

  // Future sessions with their present-player attendance records
  const futureSessions = await prisma.session.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
    include: { attendance: true },
  });

  for (const session of futureSessions) {
    if (session.attendance.length === 0) continue;

    const presentPlayers: CleanupCandidate[] = session.attendance
      .filter((a) => a.present)
      .map((a) => ({ playerId: a.playerId, cleanupCount: counts.get(a.playerId) ?? 0 }));

    const cleaners = new Set(pickCleaners(presentPlayers, mulberry32(session.id)));

    await prisma.$transaction(
      session.attendance.map((a) =>
        prisma.attendance.update({
          where: { id: a.id },
          data: { didCleanup: cleaners.has(a.playerId) && a.present },
        }),
      ),
    );

    // Advance counts for the next session in the loop
    for (const id of cleaners) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
}

/**
 * Assign 2 cleanup players to every session that currently has fewer than 2.
 * Sessions with no attendance records get records created for all active players
 * (defaulting to present). Processes chronologically so the fairness counts
 * accumulate correctly. Idempotent: sessions already at ≥ 2 are skipped.
 */
export async function backfillCleanupAssignments(): Promise<void> {
  const sessions = await prisma.session.findMany({
    orderBy: { date: "asc" },
    include: { attendance: true },
  });

  const needsWork = sessions.some(
    (s) => s.attendance.filter((a) => a.didCleanup && a.present).length < 2,
  );
  if (!needsWork) return;

  const activePlayers = await prisma.player.findMany({
    where: { active: true },
    orderBy: [{ shirtNumber: "asc" }, { firstName: "asc" }],
  });

  const counts = new Map<number, number>();

  for (const session of sessions) {
    const existingCleaners = session.attendance.filter((a) => a.didCleanup && a.present);

    if (existingCleaners.length >= 2) {
      for (const c of existingCleaners) {
        counts.set(c.playerId, (counts.get(c.playerId) ?? 0) + 1);
      }
      continue;
    }

    if (session.attendance.length === 0) {
      // No attendance records yet — create for all active players and assign cleaners
      const pool = activePlayers.map((p) => ({
        playerId: p.id,
        cleanupCount: counts.get(p.id) ?? 0,
      }));
      const chosen = new Set(pickCleaners(pool, mulberry32(session.id)));
      await prisma.attendance.createMany({
        data: activePlayers.map((p) => ({
          sessionId: session.id,
          playerId: p.id,
          present: true,
          didCleanup: chosen.has(p.id),
        })),
      });
      for (const id of chosen) counts.set(id, (counts.get(id) ?? 0) + 1);
    } else {
      // Has records but fewer than 2 cleaners — assign from present players
      const presentPlayers = session.attendance
        .filter((a) => a.present)
        .map((a) => ({ playerId: a.playerId, cleanupCount: counts.get(a.playerId) ?? 0 }));
      const chosen = new Set(pickCleaners(presentPlayers, mulberry32(session.id)));
      await prisma.$transaction(
        session.attendance.map((a) =>
          prisma.attendance.update({
            where: { id: a.id },
            data: { didCleanup: chosen.has(a.playerId) && a.present },
          }),
        ),
      );
      for (const id of chosen) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
}

/** Attendance/cleanup rows recorded against a saved training session. */
export async function getSessionAttendance(sessionId: number) {
  return prisma.attendance.findMany({
    where: { sessionId },
    include: { player: true },
  });
}

export type OverviewRow = {
  playerId: number;
  name: string;
  active: boolean;
  present: number;
  absent: number;
  cleanups: number;
};

/**
 * Per-player attendance & cleanup tallies across all recorded trainings, so the
 * coach can spot who has cleaned up least/most and who is often absent. Sorted by
 * fewest cleanups first (the fairness view for assigning the next cleanup duty).
 */
export async function getAttendanceOverview(): Promise<OverviewRow[]> {
  const players = await prisma.player.findMany({
    orderBy: [{ active: "desc" }, { firstName: "asc" }],
    include: { attendance: true },
  });

  const rows: OverviewRow[] = players.map((p) => {
    const present = p.attendance.filter((a) => a.present).length;
    const absent = p.attendance.filter((a) => !a.present).length;
    const cleanups = p.attendance.filter((a) => a.didCleanup).length;
    return {
      playerId: p.id,
      name: playerName(p),
      active: p.active,
      present,
      absent,
      cleanups,
    };
  });

  return rows.sort(
    (a, b) => a.cleanups - b.cleanups || b.absent - a.absent || a.name.localeCompare(b.name),
  );
}
