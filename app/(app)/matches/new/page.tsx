import type { Metadata } from "next";

import { requirePermission } from "@/lib/dal";
import { Permission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import { MatchForm } from "./match-form";

export const metadata: Metadata = {
  title: "Nouveau match — Badminton Score",
};

export default async function NewMatchPage() {
  await requirePermission(Permission.RECORD_MATCH);

  // Les joueurs sont choisis parmi les comptes inscrits.
  const players = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Enregistrer un match
        </h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Le match sera historisé à votre nom.
        </p>
      </header>

      {players.length < 2 ? (
        <p className="text-sm text-black/60 dark:text-white/60">
          Il faut au moins deux comptes pour enregistrer un match.
        </p>
      ) : (
        <MatchForm players={players} />
      )}
    </main>
  );
}
