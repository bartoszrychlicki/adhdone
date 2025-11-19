import type { NextConfig } from "next";

// Validate required environment variables at build time
const requiredEnvVars = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables:\n${missingEnvVars.map((v) => `  - ${v}`).join("\n")}\n\nPlease set these variables in your .env.local file or deployment environment.`
  );
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
