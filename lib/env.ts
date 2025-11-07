// lib/env.ts
// Centralized runtime env access to avoid build-time inlining of secret values.
// Do NOT import this file from client components.

export function getEnv(key: string): string | undefined {
  try {
    // Bracket access prevents webpack/Next from replacing values at build time
    // ensuring secrets are only resolved at runtime in serverless functions.
    return (process.env as Record<string, string | undefined>)[key];
  } catch {
    return undefined;
  }
}

export function getEnvOr(key: string, fallback: string): string {
  const v = getEnv(key);
  return (typeof v === "string" && v.length > 0) ? v : fallback;
}

