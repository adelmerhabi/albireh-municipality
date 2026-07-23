import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureRuntimeSchema } from "../../../../db/runtime";
import { adminUsers } from "../../../../db/schema";
import {
  createSessionToken,
  sessionCookie,
} from "../../../lib/admin-auth";
import { verifyPassword } from "../../../lib/passwords";

const TEMPORARY_BOOTSTRAP_PASSWORD_SHA256 =
  "e490d71d51209b844c73a977b00eac70c8d52656d12433e290e177921c382411";

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get("username") || "")
    .trim()
    .toLowerCase()
    .slice(0, 80);
  const password = String(form.get("password") || "").slice(0, 300);
  const returnTo = safeReturnPath(String(form.get("returnTo") || "/admin"));

  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const bootstrapUsername = String(
    runtimeEnv.ADMIN_BOOTSTRAP_USERNAME || "admin",
  )
    .trim()
    .toLowerCase();
  let passwordHash = "";
  let displayName = username;
  let active = false;

  // The recovery administrator must stay available even if the account
  // database is temporarily unavailable or contains a conflicting username.
  if (bootstrapUsername && username === bootstrapUsername) {
    passwordHash = runtimeEnv.ADMIN_BOOTSTRAP_PASSWORD_HASH || "";
    displayName = runtimeEnv.ADMIN_BOOTSTRAP_DISPLAY_NAME || "مدير الموقع";
    active = true;
  } else {
    try {
      await ensureRuntimeSchema();
      const [storedUser] = await getDb()
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, username))
        .limit(1);

      if (storedUser) {
        passwordHash = storedUser.passwordHash;
        displayName = storedUser.displayName;
        active = storedUser.active;
      }
    } catch {
      // Authentication fails closed if the account store is unavailable.
    }
  }

  const primaryPasswordIsValid =
    Boolean(passwordHash) && (await verifyPassword(password, passwordHash));
  const recoveryPasswordIsValid =
    !primaryPasswordIsValid &&
    bootstrapUsername === username &&
    (await verifyTemporaryBootstrapPassword(password));
  const valid = active && (primaryPasswordIsValid || recoveryPasswordIsValid);
  if (!valid) {
    return Response.redirect(
      new URL(
        `/admin/login?error=1&return_to=${encodeURIComponent(returnTo)}`,
        request.url,
      ),
      303,
    );
  }

  const token = await createSessionToken(username, displayName);
  if (!token || token.endsWith(".")) {
    return Response.json(
      { error: "إعداد جلسة الدخول غير مكتمل" },
      { status: 503 },
    );
  }

  return new Response(null, {
    status: 303,
    headers: {
      location: new URL(returnTo, request.url).toString(),
      "set-cookie": sessionCookie(token),
    },
  });
}

function safeReturnPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/admin";
}

async function verifyTemporaryBootstrapPassword(password: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  );
  const actual = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  if (actual.length !== TEMPORARY_BOOTSTRAP_PASSWORD_SHA256.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < actual.length; index += 1) {
    result |=
      actual.charCodeAt(index) ^
      TEMPORARY_BOOTSTRAP_PASSWORD_SHA256.charCodeAt(index);
  }
  return result === 0;
}
