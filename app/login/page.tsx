import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion — Badminton Score",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">
          Badminton Score
        </h1>
        <p className="mb-6 text-sm text-black/60 dark:text-white/60">
          Connectez-vous pour accéder à vos matchs.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
