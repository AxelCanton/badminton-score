import { cache } from "react";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Permission } from "@/lib/permissions";

/**
 * Récupère la session courante depuis le cookie.
 * `cache` évite de rejouer la requête plusieurs fois dans un même rendu.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/**
 * Garde à utiliser dans toute page ou Server Action authentifiée.
 * C'est ici que se fait la vraie vérification, au plus près des données —
 * le proxy ne fait qu'un filtrage optimiste.
 */
export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

/**
 * Charge les droits du compte connecté.
 * Mis en cache pour le rendu courant, comme `getSession`.
 */
export const getCurrentUserPermissions = cache(async (): Promise<Permission[]> => {
  const session = await getSession();

  if (!session) {
    return [];
  }

  const rows = await prisma.userPermission.findMany({
    where: { userId: session.user.id },
    select: { permission: true },
  });

  return rows.map((row) => row.permission);
});

/** Vrai si le compte connecté détient le droit demandé. */
export async function hasPermission(permission: Permission) {
  const permissions = await getCurrentUserPermissions();

  return permissions.includes(permission);
}

/**
 * Garde d'autorisation à appeler dans chaque page et Server Action sensible.
 * Une Server Action est joignable en POST direct : la vérification ne peut pas
 * se limiter au rendu de l'interface.
 */
export async function requirePermission(permission: Permission) {
  const session = await requireSession();

  const granted = await prisma.userPermission.findUnique({
    where: {
      userId_permission: { userId: session.user.id, permission },
    },
    select: { id: true },
  });

  if (!granted) {
    forbidden();
  }

  return session;
}
