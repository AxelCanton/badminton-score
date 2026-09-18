import Link from "next/link";

/** Rendue par forbidden(), appelé depuis les gardes de permission du DAL. */
export default function Forbidden() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Accès refusé</h1>
      <p className="text-sm text-black/60 dark:text-white/60">
        Vous n&apos;avez pas les droits nécessaires pour accéder à cette page.
        Contactez un administrateur si vous pensez qu&apos;il s&apos;agit
        d&apos;une erreur.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-md border border-black/15 px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        Retour au tableau de bord
      </Link>
    </main>
  );
}
