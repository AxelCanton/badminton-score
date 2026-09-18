import { MatchFormat, Team } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/** Match avec ses participants, forme de base des calculs de statistiques. */
const matchWithParticipants = {
  participants: {
    include: { user: { select: { id: true, name: true } } },
  },
} as const;

export type PlayerStats = {
  userId: string;
  name: string;
  played: number;
  won: number;
  lost: number;
  winRate: number;
  pointsFor: number;
  pointsAgainst: number;
  pointsDiff: number;
};

function winnerOf(match: { scoreA: number; scoreB: number }) {
  return match.scoreA > match.scoreB ? Team.A : Team.B;
}

/**
 * Statistiques par joueur, calculées sur l'ensemble des matchs.
 * Les comptes sans match apparaissent avec des compteurs à zéro afin que la
 * page listent tous les joueurs inscrits.
 */
export async function getPlayerStats(): Promise<PlayerStats[]> {
  const [users, matches] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.match.findMany({ include: matchWithParticipants }),
  ]);

  const stats = new Map<string, PlayerStats>(
    users.map((user) => [
      user.id,
      {
        userId: user.id,
        name: user.name,
        played: 0,
        won: 0,
        lost: 0,
        winRate: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointsDiff: 0,
      },
    ]),
  );

  for (const match of matches) {
    const winner = winnerOf(match);

    for (const participant of match.participants) {
      const entry = stats.get(participant.userId);

      if (!entry) {
        continue;
      }

      const isTeamA = participant.team === Team.A;

      entry.played += 1;
      entry.pointsFor += isTeamA ? match.scoreA : match.scoreB;
      entry.pointsAgainst += isTeamA ? match.scoreB : match.scoreA;

      if (participant.team === winner) {
        entry.won += 1;
      } else {
        entry.lost += 1;
      }
    }
  }

  return [...stats.values()]
    .map((entry) => ({
      ...entry,
      winRate: entry.played === 0 ? 0 : entry.won / entry.played,
      pointsDiff: entry.pointsFor - entry.pointsAgainst,
    }))
    .sort(
      (a, b) =>
        b.winRate - a.winRate || b.played - a.played || a.name.localeCompare(b.name),
    );
}

export type GlobalStats = {
  totalMatches: number;
  singles: number;
  doubles: number;
  totalPoints: number;
  averagePointsPerMatch: number;
  averageMargin: number;
  activePlayers: number;
  lastMatchAt: Date | null;
};

/** Chiffres agrégés sur l'ensemble des matchs enregistrés. */
export async function getGlobalStats(): Promise<GlobalStats> {
  const [aggregate, singles, doubles, distinctPlayers, lastMatch, matches] =
    await Promise.all([
      prisma.match.aggregate({
        _count: { _all: true },
        _sum: { scoreA: true, scoreB: true },
      }),
      prisma.match.count({ where: { format: MatchFormat.SINGLES } }),
      prisma.match.count({ where: { format: MatchFormat.DOUBLES } }),
      prisma.matchParticipant.findMany({
        distinct: ["userId"],
        select: { userId: true },
      }),
      prisma.match.findFirst({
        orderBy: { playedAt: "desc" },
        select: { playedAt: true },
      }),
      prisma.match.findMany({ select: { scoreA: true, scoreB: true } }),
    ]);

  const totalMatches = aggregate._count._all;
  const totalPoints =
    (aggregate._sum.scoreA ?? 0) + (aggregate._sum.scoreB ?? 0);
  const totalMargin = matches.reduce(
    (sum, match) => sum + Math.abs(match.scoreA - match.scoreB),
    0,
  );

  return {
    totalMatches,
    singles,
    doubles,
    totalPoints,
    averagePointsPerMatch: totalMatches === 0 ? 0 : totalPoints / totalMatches,
    averageMargin: totalMatches === 0 ? 0 : totalMargin / totalMatches,
    activePlayers: distinctPlayers.length,
    lastMatchAt: lastMatch?.playedAt ?? null,
  };
}

/** Détail d'un joueur : ses statistiques et ses derniers matchs. */
export async function getPlayerDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return null;
  }

  const matches = await prisma.match.findMany({
    where: { participants: { some: { userId } } },
    include: matchWithParticipants,
    orderBy: { playedAt: "desc" },
  });

  const allStats = await getPlayerStats();
  const stats = allStats.find((entry) => entry.userId === userId) ?? null;

  return { user, stats, matches };
}
