import type { Metadata } from "next";
import Link from "next/link";

import { requireSession } from "@/lib/dal";
import { getGlobalStats, getPlayerStats } from "@/lib/stats";

export const metadata: Metadata = {
  title: "Statistiques — Badminton Score",
};

const numberFormat = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});
const percentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 0,
});
const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export default async function StatsPage() {
  await requireSession();

  const [global, players] = await Promise.all([
    getGlobalStats(),
    getPlayerStats(),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Statistiques</h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Global</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Matchs" value={String(global.totalMatches)} />
          <Stat label="Simples" value={String(global.singles)} />
          <Stat label="Doubles" value={String(global.doubles)} />
          <Stat label="Joueurs actifs" value={String(global.activePlayers)} />
          <Stat label="Points joués" value={String(global.totalPoints)} />
          <Stat
            label="Points par match"
            value={numberFormat.format(global.averagePointsPerMatch)}
          />
          <Stat
            label="Écart moyen"
            value={numberFormat.format(global.averageMargin)}
          />
          <Stat
            label="Dernier match"
            value={
              global.lastMatchAt ? dateFormat.format(global.lastMatchAt) : "—"
            }
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Par joueur</h2>

        {players.length === 0 ? (
          <p className="text-sm text-black/60 dark:text-white/60">
            Aucun joueur inscrit.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left dark:border-white/15">
                  <Th>Joueur</Th>
                  <Th align="right">Joués</Th>
                  <Th align="right">Gagnés</Th>
                  <Th align="right">Perdus</Th>
                  <Th align="right">% victoires</Th>
                  <Th align="right">Points pour</Th>
                  <Th align="right">Points contre</Th>
                  <Th align="right">Diff.</Th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr
                    key={player.userId}
                    className="border-b border-black/5 dark:border-white/10"
                  >
                    <Td>
                      <Link
                        href={`/players/${player.userId}`}
                        className="underline underline-offset-4 hover:no-underline"
                      >
                        {player.name}
                      </Link>
                    </Td>
                    <Td align="right">{player.played}</Td>
                    <Td align="right">{player.won}</Td>
                    <Td align="right">{player.lost}</Td>
                    <Td align="right">
                      {player.played === 0
                        ? "—"
                        : percentFormat.format(player.winRate)}
                    </Td>
                    <Td align="right">{player.pointsFor}</Td>
                    <Td align="right">{player.pointsAgainst}</Td>
                    <Td align="right">
                      {player.pointsDiff > 0
                        ? `+${player.pointsDiff}`
                        : player.pointsDiff}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <th
      scope="col"
      className={`px-3 py-2 font-medium text-black/60 dark:text-white/60 ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "right";
}) {
  return (
    <td
      className={`px-3 py-2 ${align === "right" ? "text-right tabular-nums" : ""}`}
    >
      {children}
    </td>
  );
}
