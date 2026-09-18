"use client";

import { useActionState } from "react";

import {
  createUser,
  updateUserPermissions,
  type UserFormState,
} from "@/lib/actions/users";
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
} from "@/lib/permissions";

const initialState: UserFormState = {};

const fieldClass =
  "rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/40 dark:border-white/20 dark:focus:border-white/50";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    createUser,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex max-w-xl flex-col gap-4 rounded-lg border border-black/10 p-5 dark:border-white/15"
    >
      <h2 className="text-lg font-semibold tracking-tight">Nouveau compte</h2>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nom</span>
        <input name="name" type="text" required className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="off"
          className={fieldClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Mot de passe initial</span>
        <input
          name="password"
          type="text"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
        />
        <span className="text-xs text-black/50 dark:text-white/50">
          8 caractères minimum. À transmettre au joueur.
        </span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Droits</legend>
        {ALL_PERMISSIONS.map((permission) => (
          <label key={permission} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="permissions"
              value={permission}
              defaultChecked={permission === "RECORD_MATCH"}
            />
            {PERMISSION_LABELS[permission]}
          </label>
        ))}
      </fieldset>

      <Feedback state={state} />

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Création…" : "Créer le compte"}
      </button>
    </form>
  );
}

export function PermissionsForm({
  userId,
  permissions,
}: {
  userId: string;
  permissions: Permission[];
}) {
  const [state, formAction, pending] = useActionState(
    updateUserPermissions,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="userId" value={userId} />

      <div className="flex flex-wrap items-center gap-4">
        {ALL_PERMISSIONS.map((permission) => (
          <label key={permission} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="permissions"
              value={permission}
              defaultChecked={permissions.includes(permission)}
            />
            {PERMISSION_LABELS[permission]}
          </label>
        ))}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-black/15 px-3 py-1.5 text-sm transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/10"
        >
          {pending ? "Enregistrement…" : "Mettre à jour"}
        </button>
      </div>

      <Feedback state={state} />
    </form>
  );
}

function Feedback({ state }: { state: UserFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
        {state.error}
      </p>
    );
  }

  if (state.success) {
    return (
      <p role="status" className="text-sm text-green-700 dark:text-green-400">
        {state.success}
      </p>
    );
  }

  return null;
}
