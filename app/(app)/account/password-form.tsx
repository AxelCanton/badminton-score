"use client";

import { useActionState } from "react";

import {
  changePassword,
  type PasswordFormState,
} from "@/lib/actions/account";

const initialState: PasswordFormState = {};

const fieldClass =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  // On vide les champs une fois le changement accepté : laisser les mots de
  // passe saisis dans le formulaire n'a plus d'utilité.
  // Le vidage passe par un changement de `key` (React remonte les champs)
  // plutôt que par `form.reset()`, que Firefox refuse sur des champs mot de
  // passe après soumission.
  const fieldsKey = state.success ?? "initial";

  return (
    <form
      action={formAction}
      className="flex max-w-xl flex-col gap-4 rounded-lg border border-black/10 p-5 dark:border-white/15"
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Mot de passe actuel</span>
        <input
          key={fieldsKey}
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nouveau mot de passe</span>
        <input
          key={fieldsKey}
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
        <span className="text-xs text-black/50 dark:text-white/50">
          8 caractères minimum.
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Confirmer le nouveau mot de passe</span>
        <input
          key={fieldsKey}
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
