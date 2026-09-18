import type { Metadata } from "next";
import Link from "next/link";

import { requirePermission } from "@/lib/dal";
import { Permission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

import { CreateUserForm, PermissionsForm } from "./user-forms";

export const metadata: Metadata = {
  title: "Comptes — Badminton Score",
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

export default async function AdminUsersPage() {
  await requirePermission(Permission.MANAGE_USERS);

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      permissions: { select: { permission: true } },
      _count: { select: { matchesPlayed: true, matchesRecorded: true } },
    },
  });

  return (
    <main className="flex flex-1 flex-col gap-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Comptes</h1>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Créez les comptes des joueurs et attribuez leurs droits.
        </p>
      </header>

      <CreateUserForm />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Comptes existants ({users.length})
        </h2>

        <ul className="flex flex-col gap-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <Link
                    href={`/players/${user.id}`}
                    className="font-medium underline underline-offset-4 hover:no-underline"
                  >
                    {user.name}
                  </Link>
                  <span className="ml-2 text-sm text-black/60 dark:text-white/60">
                    {user.email}
                  </span>
                </div>
                <span className="text-xs text-black/50 dark:text-white/50">
                  Inscrit le {dateFormat.format(user.createdAt)} —{" "}
                  {user._count.matchesPlayed} match
                  {user._count.matchesPlayed > 1 ? "s" : ""} joué
                  {user._count.matchesPlayed > 1 ? "s" : ""},{" "}
                  {user._count.matchesRecorded} saisi
                  {user._count.matchesRecorded > 1 ? "s" : ""}
                </span>
              </div>

              <PermissionsForm
                userId={user.id}
                permissions={user.permissions.map((row) => row.permission)}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
