import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSession } from "@/lib/dal";
import { getPlayerDetail } from "@/lib/stats";

type PageProps = { params: Promise<{ id: string }> };

const dateFormat = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});
const percentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 0,
});

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = await getPlayerDetail(id);

  return {
    title: detail
      ? `${detail.user.name} — Badminton Score`
      : "Joueur introuvable — Badminton Score",
  };
}

export default async function PlayerPage({ params }: PageProps) {
  await requireSession();

  const { id } = await params;
  const detail = await getPlayerDetail(id);

  if (!detail) {
    notFound();
  }

  const { user, stats, matches } = detail;

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          {user.email}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Matchs joués" value={String(stats?.played ?? 0)} />
        <Stat label="Victoires" value={String(stats?.won ?? 0)} />
        <Stat label="Défaites" value={String(stats?.lost ?? 0)} />
        <Stat
          label="% victoires"
          value={
            !stats || stats.played === 0
              ? "—"
              : percentFormat.format(stats.winRate)
          }
        />
        <Stat label="Points marqués" value={String(stats?.pointsFor ?? 0)} />
        <Stat
          label="Points encaissés"
          value={String(stats?.pointsAgainst ?? 0)}
        />
        <Stat
          label="Différentiel"
          value={
            stats && stats.pointsDiff > 0
              ? `+${stats.pointsDiff}`
              : String(stats?.pointsDiff ?? 0)
          }
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Historique des matchs
        </h2>

        {matches.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Ce joueur n&apos;a encore disputé aucun match.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {matches.map((match) => {
              const own = match.participants.find((p) => p.userId === user.id);
              const isTeamA = own?.team === "A";
              const ownScore = isTeamA ? match.scoreA : match.scoreB;
              const opponentScore = isTeamA ? match.scoreB : match.scoreA;
              const won = ownScore > opponentScore;
              const partners = match.participants.filter(
                (p) => p.team === own?.team && p.userId !== user.id,
              );
              const opponents = match.participants.filter(
                (p) => p.team !== own?.team,
              );

              return (
                <li
                  key={match.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 px-4 py-3 text-sm dark:border-white/15"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        won
                          ? "bg-green-500/15 text-green-700 dark:text-green-400"
                          : "bg-red-500/15 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {won ? "Victoire" : "Défaite"}
                    </span>
                    <span className="font-mono font-semibold tabular-nums">
                      {ownScore} – {opponentScore}
                    </span>
                    <span className="text-black/60 dark:text-white/60">
                      {partners.length > 0 && (
                        <>
                          avec{" "}
                          {partners.map((p) => p.user.name).join(" & ")}{" "}
                        </>
                      )}
                      contre{" "}
                      {opponents.map((opponent, index) => (
                        <span key={opponent.userId}>
                          {index > 0 && " & "}
                          <Link
                            href={`/players/${opponent.userId}`}
                            className="underline underline-offset-4 hover:no-underline"
                          >
                            {opponent.user.name}
                          </Link>
                        </span>
                      ))}
                    </span>
                  </div>

                  <span className="text-xs text-black/50 dark:text-white/50">
                    {dateFormat.format(match.playedAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
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
