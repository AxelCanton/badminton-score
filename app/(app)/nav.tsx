import Link from "next/link";

import { getCurrentUserPermissions } from "@/lib/dal";
import { Permission } from "@/lib/permissions";

import { SignOutButton } from "./sign-out-button";

const linkClass =
  "rounded-md px-3 py-1.5 text-sm font-medium text-black/70 transition-colors hover:bg-black/5 hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white";

/**
 * Barre de navigation des pages authentifiées.
 * Les entrées réservées sont masquées selon les droits — le contrôle réel
 * reste fait par les gardes du DAL sur chaque page et Server Action.
 */
export async function Nav({ userName }: { userName: string }) {
  const permissions = await getCurrentUserPermissions();

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-black/10 px-6 py-3 dark:border-white/15">
      <Link
        href="/dashboard"
        className="mr-2 text-sm font-semibold tracking-tight"
      >
        Badminton Score
      </Link>

      <nav className="flex flex-wrap items-center gap-1">
        <Link href="/matches" className={linkClass}>
          Matchs
        </Link>
        <Link href="/stats" className={linkClass}>
          Statistiques
        </Link>
        {permissions.includes(Permission.RECORD_MATCH) && (
          <Link href="/matches/new" className={linkClass}>
            Nouveau match
          </Link>
        )}
        {permissions.includes(Permission.MANAGE_USERS) && (
          <Link href="/admin/users" className={linkClass}>
            Comptes
          </Link>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/account"
          className="text-sm text-black/60 underline-offset-4 transition-colors hover:text-black hover:underline dark:text-white/60 dark:hover:text-white"
        >
          {userName}
        </Link>
        <SignOutButton />
      </div>
    </header>
  );
}
