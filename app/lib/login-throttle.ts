import { env } from "cloudflare:workers";
import { ensureRuntimeSchema } from "../../db/runtime";

const windowMs = 15 * 60 * 1000;
const lockMs = 15 * 60 * 1000;
const retentionMs = 7 * 24 * 60 * 60 * 1000;

type AttemptPolicy = {
  key: string;
  maximum: number;
};

export type LoginThrottle = {
  policies: AttemptPolicy[];
  retryAfterSeconds: number;
};

type AttemptRow = {
  locked_until: string | null;
};

/**
 * Build non-reversible D1 keys for both the source IP and IP/username pair.
 * The pair stops targeted password guessing quickly; the source-wide ceiling
 * also prevents cycling through usernames from one connection.
 */
export async function getLoginThrottle(
  request: Request,
  username: string,
): Promise<LoginThrottle> {
  await ensureRuntimeSchema();

  const source =
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const [sourceKey, accountKey] = await Promise.all([
    hashKey(`source|${source}`),
    hashKey(`account|${source}|${username}`),
  ]);

  // Keep this operational table bounded and avoid retaining source-derived
  // hashes indefinitely. This is deliberately best-effort.
  const retentionCutoff = new Date(Date.now() - retentionMs).toISOString();
  await env.DB.prepare(
    "DELETE FROM admin_login_attempts WHERE updated_at < ?",
  )
    .bind(retentionCutoff)
    .run();

  return {
    policies: [
      { key: accountKey, maximum: 5 },
      { key: sourceKey, maximum: 20 },
    ],
    retryAfterSeconds: Math.ceil(lockMs / 1000),
  };
}

export async function isLoginBlocked(throttle: LoginThrottle) {
  const now = new Date().toISOString();
  for (const policy of throttle.policies) {
    const row = await env.DB.prepare(
      "SELECT locked_until FROM admin_login_attempts WHERE key = ?",
    )
      .bind(policy.key)
      .first<AttemptRow>();
    if (row?.locked_until && row.locked_until > now) {
      return true;
    }
  }
  return false;
}

export async function recordFailedLogin(throttle: LoginThrottle) {
  const nowMs = Date.now();
  const now = new Date(nowMs).toISOString();
  const windowCutoff = new Date(nowMs - windowMs).toISOString();
  const lockedUntil = new Date(nowMs + lockMs).toISOString();

  await env.DB.batch(
    throttle.policies.map((policy) =>
      env.DB.prepare(`
        INSERT INTO admin_login_attempts (
          key, failed_attempts, window_started_at, locked_until, updated_at
        ) VALUES (?, 1, ?, NULL, ?)
        ON CONFLICT(key) DO UPDATE SET
          failed_attempts = CASE
            WHEN window_started_at < ? THEN 1
            ELSE failed_attempts + 1
          END,
          window_started_at = CASE
            WHEN window_started_at < ? THEN excluded.window_started_at
            ELSE window_started_at
          END,
          locked_until = CASE
            WHEN window_started_at < ? THEN NULL
            WHEN failed_attempts + 1 >= ? THEN ?
            ELSE locked_until
          END,
          updated_at = excluded.updated_at
      `).bind(
        policy.key,
        now,
        now,
        windowCutoff,
        windowCutoff,
        windowCutoff,
        policy.maximum,
        lockedUntil,
      ),
    ),
  );

  return isLoginBlocked(throttle);
}

export async function clearLoginFailures(throttle: LoginThrottle) {
  await env.DB.batch(
    throttle.policies.map((policy) =>
      env.DB.prepare("DELETE FROM admin_login_attempts WHERE key = ?").bind(
        policy.key,
      ),
    ),
  );
}

async function hashKey(value: string) {
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const secret = runtimeEnv.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is required");
  }
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`admin-login-source-v1|${value}`),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
