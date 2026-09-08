import "dotenv/config";

import { randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";

import { prisma } from "../lib/prisma";

// Better Auth cherche l'email en minuscules : on normalise dès l'insertion.
const email = (
  process.env.SEED_USER_EMAIL ?? "admin@badminton-score.local"
).toLowerCase();
const password = process.env.SEED_USER_PASSWORD ?? "changeme123";
const name = process.env.SEED_USER_NAME ?? "Admin";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Utilisateur ${email} déjà présent — rien à faire.`);
    return;
  }

  // Le mot de passe vit dans Account (providerId "credential"),
  // comme attendu par Better Auth, et non sur User.
  // `accountId` doit valoir l'id de l'utilisateur : c'est sur cette égalité
  // que Better Auth retrouve le compte "credential" lors de la connexion.
  const userId = randomUUID();

  await prisma.user.create({
    data: {
      id: userId,
      name,
      email,
      emailVerified: true,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });

  console.log(`Utilisateur créé : ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
