import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Ensure the Worker is deployed with the D1 binding named `DB` (see vite.config.ts and DEPLOY.md)."
    );
  }

  return drizzle(env.DB, { schema });
}
