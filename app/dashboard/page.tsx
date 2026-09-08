import type { Metadata } from "next";

import { requireSession } from "@/lib/dal";

import { SignOutButton } from "./sign-out-button";

export const metadata: Metadata = {
  title: "Tableau de bord — Badminton Score",
};

export default async function DashboardPage() {
  const { user } = await requireSession();

  return (
    <main className="flex flex-1 flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tableau de bord
        </h1>
        <SignOutButton />
      </header>

      <p className="text-sm text-black/70 dark:text-white/70">
        Connecté en tant que <strong>{user.name}</strong> ({user.email}).
      </p>
    </main>
  );
}
