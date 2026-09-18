import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUserPermissions, requireSession } from "@/lib/dal";
import { Permission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Matchs — Badminton Score",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function MatchesPage() {
  await requireSession();

  const [permissions, matches] = await Promise.all([
    getCurrentUserPermissions(),
    prisma.match.findMany({
      orderBy: { playedAt: "desc" },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } } },
        },
        recordedBy: { select: { name: true } },
      },
    }),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Matchs</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            {matches.length} match{matches.length > 1 ? "s" : ""} enregistré
            {matches.length > 1 ? "s" : ""}.
          </p>
        </div>

        {permissions.includes(Permission.RECORD_MATCH) && (
          <Link
            href="/matches/new"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Enregistrer un match
          </Link>
        )}
      </header>

      {matches.length === 0 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          Aucun match enregistré pour l&apos;instant.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {matches.map((match) => {
            const teamA = match.participants.filter((p) => p.team === "A");
            const teamB = match.participants.filter((p) => p.team === "B");
            const winner = match.scoreA > match.scoreB ? "A" : "B";

            return (
              <li
                key={match.id}
                className="rounded-lg border border-black/10 p-4 dark:border-white/15"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <TeamNames
                      players={teamA}
                      isWinner={winner === "A"}
                    />
                    <span className="font-mono font-semibold tabular-nums">
                      {match.scoreA} – {match.scoreB}
                    </span>
                    <TeamNames
                      players={teamB}
                      isWinner={winner === "B"}
                    />
                  </div>

                  <span className="rounded-full border border-black/10 px-2.5 py-0.5 text-xs text-black/60 dark:border-white/15 dark:text-white/60">
                    {match.format === "DOUBLES" ? "Double" : "Simple"}
                  </span>
                </div>

                <p className="mt-2 text-xs text-black/50 dark:text-white/50">
                  {dateFormat.format(match.playedAt)} — saisi par{" "}
                  {match.recordedBy.name}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

function TeamNames({
  players,
  isWinner,
}: {
  players: { user: { id: string; name: string } }[];
  isWinner: boolean;
}) {
  return (
    <span className={isWinner ? "font-semibold" : undefined}>
      {players.map((player, index) => (
        <span key={player.user.id}>
          {index > 0 && " & "}
          <Link
            href={`/players/${player.user.id}`}
            className="underline underline-offset-4 hover:no-underline"
          >
            {player.user.name}
          </Link>
        </span>
      ))}
    </span>
  );
}
