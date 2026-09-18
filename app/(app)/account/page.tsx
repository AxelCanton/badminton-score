import type { Metadata } from "next";

import { requireSession } from "@/lib/dal";

import { PasswordForm } from "./password-form";

export const metadata: Metadata = {
  title: "Mon compte — Badminton Score",
};

export default async function AccountPage() {
  const { user } = await requireSession();

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Mon compte</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          {user.name} — {user.email}
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Changer le mot de passe
        </h2>
        <PasswordForm />
      </section>
    </main>
  );
}
