import vinext from "vinext";
import { defineConfig } from "vite";

// Cloudflare binding names used by the app (see db/ and worker/index.ts).
const d1 = "DB";
const r2 = "MEDIA";

const PLACEHOLDER_DATABASE_ID = "00000000-0000-4000-8000-000000000000";

// Deploy targets set the real D1 id/name and R2 bucket via env vars so this
// file never needs editing. When unset (local dev) the placeholders are used.
// See DEPLOY.md.
const d1DatabaseId =
  process.env.CF_D1_DATABASE_ID || PLACEHOLDER_DATABASE_ID;
const d1DatabaseName = process.env.CF_D1_DATABASE_NAME || "site-creator-d1";
const r2BucketName = process.env.CF_R2_BUCKET_NAME || "site-creator-r2";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: [
    {
      binding: d1,
      database_name: d1DatabaseName,
      database_id: d1DatabaseId,
      migrations_dir: "drizzle",
    },
  ],
  r2_buckets: [
    {
      binding: r2,
      bucket_name: r2BucketName,
    },
  ],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    plugins: [
      vinext(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig,
      }),
    ],
  };
});
