import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    // Pas d'inscription publique : les comptes sont créés en base (prisma/seed.ts).
    disableSignUp: true,
  },
  // nextCookies doit rester le dernier plugin : il pose les cookies
  // renvoyés par les Server Actions.
  plugins: [nextCookies()],
});
