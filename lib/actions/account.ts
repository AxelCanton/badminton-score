"use server";

import { headers } from "next/headers";
import { isAPIError } from "better-auth/api";

import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/dal";

export type PasswordFormState = {
  error?: string;
  success?: string;
};

const MIN_PASSWORD_LENGTH = 8;

/**
 * Change le mot de passe du compte connecté.
 * Aucun droit particulier n'est requis — chacun ne peut agir que sur son
 * propre compte, puisque Better Auth travaille à partir de la session.
 */
export async function changePassword(
  _prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  // Une Server Action est joignable en POST direct : on garde même si la page
  // qui porte le formulaire est déjà protégée.
  await requireSession();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword) {
    return { error: "Tous les champs sont obligatoires." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "La confirmation ne correspond pas au nouveau mot de passe." };
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`,
    };
  }

  if (newPassword === currentPassword) {
    return { error: "Le nouveau mot de passe doit être différent de l'actuel." };
  }

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword,
        newPassword,
        // Pas de `revokeOtherSessions` : la révocation supprime toutes les
        // sessions puis en recrée une, mais le cookie renouvelé n'atteint le
        // navigateur qu'après la réponse. Le rendu qui suit dans la même
        // réponse présente donc un cookie révoqué au proxy, qui redirige en
        // boucle jusqu'au crash de la page.
      },
    });
  } catch (error) {
    // Better Auth renvoie un code stable dans `body.code` : on s'appuie
    // dessus plutôt que sur le message, qui est de l'anglais d'affichage.
    if (isAPIError(error)) {
      if (error.body?.code === "INVALID_PASSWORD") {
        return { error: "Le mot de passe actuel est incorrect." };
      }

      if (error.body?.code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
        return {
          error: "Ce compte n'a pas de mot de passe. Contactez un administrateur.",
        };
      }
    }

    throw error;
  }

  return { success: "Mot de passe mis à jour." };
}
