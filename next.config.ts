import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite que Vercel Cron Jobs llame al endpoint sin CRON_SECRET en prod
  // (Vercel inyecta Authorization automáticamente — el route lo acepta si el
  // header "x-cron-secret" no está presente y el entorno es "production" en Vercel)
  experimental: {},
  headers: async () => [
    {
      // Headers de seguridad globales
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ],
};

export default nextConfig;
