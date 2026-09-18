import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Requis par forbidden() / unauthorized(), utilisés par les gardes du DAL
    // pour renvoyer un vrai 403 plutôt qu'une redirection trompeuse.
    authInterrupts: true,
  },
};

export default nextConfig;
