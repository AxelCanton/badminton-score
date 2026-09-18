"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MatchFormat, Team } from "@prisma/client";

import { requirePermission } from "@/lib/dal";
import { prisma } from "@/lib/prisma";
import { Permission } from "@/lib/permissions";

export type MatchFormState = {
  error?: string;
};

function parseScore(value: FormDataEntryValue | null) {
  const score = Number(value);

  return Number.isInteger(score) && score >= 0 ? score : null;
}

/**
 * Enregistre un résultat de match.
 * Le compte qui soumet est conservé dans `recordedById` pour la traçabilité,
 * même s'il ne fait pas partie des joueurs.
 */
export async function createMatch(
  _prevState: MatchFormState,
  formData: FormData,
): Promise<MatchFormState> {
  const session = await requirePermission(Permission.RECORD_MATCH);

  const format =
    formData.get("format") === MatchFormat.DOUBLES
      ? MatchFormat.DOUBLES
      : MatchFormat.SINGLES;
  const expectedPerTeam = format === MatchFormat.DOUBLES ? 2 : 1;

  const teamA = formData.getAll("teamA").map(String).filter(Boolean);
  const teamB = formData.getAll("teamB").map(String).filter(Boolean);

  if (teamA.length !== expectedPerTeam || teamB.length !== expectedPerTeam) {
    return {
      error:
        format === MatchFormat.DOUBLES
          ? "Sélectionnez deux joueurs par équipe."
          : "Sélectionnez un joueur par équipe.",
    };
  }

  const players = [...teamA, ...teamB];

  if (new Set(players).size !== players.length) {
    return { error: "Un même joueur ne peut pas apparaître deux fois." };
  }

  const scoreA = parseScore(formData.get("scoreA"));
  const scoreB = parseScore(formData.get("scoreB"));

  if (scoreA === null || scoreB === null) {
    return { error: "Les scores doivent être des entiers positifs." };
  }

  // Le vainqueur est l'équipe au score le plus élevé : une égalité ne
  // permettrait pas de le désigner.
  if (scoreA === scoreB) {
    return { error: "Les scores ne peuvent pas être à égalité." };
  }

  const playedAtRaw = String(formData.get("playedAt") ?? "");
  const playedAt = playedAtRaw ? new Date(playedAtRaw) : new Date();

  if (Number.isNaN(playedAt.getTime())) {
    return { error: "La date du match est invalide." };
  }

  // Les joueurs doivent être des comptes existants : on le vérifie côté
  // serveur, la liste envoyée par le client n'étant pas digne de confiance.
  const knownPlayers = await prisma.user.count({
    where: { id: { in: players } },
  });

  if (knownPlayers !== players.length) {
    return { error: "Un des joueurs sélectionnés n'existe pas." };
  }

  await prisma.match.create({
    data: {
      format,
      scoreA,
      scoreB,
      playedAt,
      recordedById: session.user.id,
      participants: {
        create: [
          ...teamA.map((userId) => ({ userId, team: Team.A })),
          ...teamB.map((userId) => ({ userId, team: Team.B })),
        ],
      },
    },
  });

  revalidatePath("/matches");
  revalidatePath("/stats");
  redirect("/matches");
}
