import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

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
