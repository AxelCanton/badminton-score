import "dotenv/config";

import { defineConfig, env } from "prisma/config";

// Prisma 7 : l'URL de connexion ne vit plus dans schema.prisma.
// Elle est lue ici pour les commandes de migration / introspection,
// et passée au client via un driver adapter (voir lib/prisma.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
