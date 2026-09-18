import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUserPermissions, requireSession } from "@/lib/dal";
import { PERMISSION_LABELS, Permission } from "@/lib/permissions";
import { getGlobalStats } from "@/lib/stats";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Tableau de bord — Badminton Score",
};

const numberFormat = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

export default async function DashboardPage() {
  const { user } = await requireSession();
  const [permissions, stats, recentMatches] = await Promise.all([
    getCurrentUserPermissions(),
    getGlobalStats(),
    prisma.match.findMany({
      take: 5,
      orderBy: { playedAt: "desc" },
      include: {
        participants: { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bonjour {user.name}
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          {permissions.length === 0
            ? "Aucun droit particulier ne vous est attribué : vous pouvez consulter les matchs et les statistiques."
            : `Vos droits : ${permissions
                .map((permission) => PERMISSION_LABELS[permission])
                .join(", ")}.`}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Matchs enregistrés" value={String(stats.totalMatches)} />
        <Stat label="Joueurs actifs" value={String(stats.activePlayers)} />
        <Stat
          label="Points par match"
          value={numberFormat.format(stats.averagePointsPerMatch)}
        />
        <Stat
          label="Écart moyen"
          value={numberFormat.format(stats.averageMargin)}
        />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">
            Derniers matchs
          </h2>
          <Link
            href="/matches"
            className="text-sm underline underline-offset-4 hover:no-underline"
          >
            Tout voir
          </Link>
        </div>

        {recentMatches.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Aucun match enregistré pour l&apos;instant.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentMatches.map((match) => {
              const teamA = match.participants
                .filter((participant) => participant.team === "A")
                .map((participant) => participant.user.name)
                .join(" & ");
              const teamB = match.participants
                .filter((participant) => participant.team === "B")
                .map((participant) => participant.user.name)
                .join(" & ");

              return (
                <li
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-black/10 px-4 py-2.5 text-sm dark:border-white/15"
                >
                  <span>
                    {teamA} <span className="text-black/40 dark:text-white/40">vs</span>{" "}
                    {teamB}
                  </span>
                  <span className="font-mono font-medium">
                    {match.scoreA} – {match.scoreB}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {permissions.includes(Permission.RECORD_MATCH) && (
        <Link
          href="/matches/new"
          className="self-start rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Enregistrer un match
        </Link>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <p className="text-xs uppercase tracking-wide text-black/50 dark:text-white/50">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
