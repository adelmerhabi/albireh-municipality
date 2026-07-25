import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { ensureRuntimeSchema } from "../../../../db/runtime";
import { adminUsers } from "../../../../db/schema";
import {
  createSessionToken,
  sessionCookie,
} from "../../../lib/admin-auth";
import {
  clearLoginFailures,
  getLoginThrottle,
  isLoginBlocked,
  recordFailedLogin,
} from "../../../lib/login-throttle";
import { verifyPassword } from "../../../lib/passwords";

export async function POST(request: Request) {
  const form = await request.formData();
  const username = String(form.get("username") || "")
    .trim()
    .toLowerCase()
    .slice(0, 80);
  const password = String(form.get("password") || "").slice(0, 300);
  const returnTo = safeReturnPath(
    String(form.get("returnTo") || "/admin"),
    request.url,
  );

  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const bootstrapUsername = String(
    runtimeEnv.ADMIN_BOOTSTRAP_USERNAME || "admin",
  )
    .trim()
    .toLowerCase();
  let passwordHash = "";
  let displayName = username;
  let active = false;
  let throttle: Awaited<ReturnType<typeof getLoginThrottle>>;

  try {
    throttle = await getLoginThrottle(request, username);
    if (await isLoginBlocked(throttle)) {
      return loginRedirect(request, returnTo, "locked", throttle.retryAfterSeconds);
    }

    // The bootstrap account remains independent of the account table, but
    // every login path is still protected by the D1-backed attempt limiter.
    if (bootstrapUsername && username === bootstrapUsername) {
      passwordHash = runtimeEnv.ADMIN_BOOTSTRAP_PASSWORD_HASH || "";
      displayName = runtimeEnv.ADMIN_BOOTSTRAP_DISPLAY_NAME || "مدير الموقع";
      active = true;
    } else {
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
    }
  } catch {
    // Do not permit unthrottled authentication if D1 is unavailable.
    return Response.json(
      { error: "خدمة تسجيل الدخول غير متاحة مؤقتاً" },
      { status: 503, headers: { "retry-after": "60" } },
    );
  }

  const primaryPasswordIsValid =
    Boolean(passwordHash) && (await verifyPassword(password, passwordHash));
  const valid = active && primaryPasswordIsValid;
  if (!valid) {
    const blocked = await recordFailedLogin(throttle);
    return loginRedirect(
      request,
      returnTo,
      blocked ? "locked" : "invalid",
      blocked ? throttle.retryAfterSeconds : undefined,
    );
  }

  await clearLoginFailures(throttle);
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

function safeReturnPath(value: string, requestUrl: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  try {
    const base = new URL(requestUrl);
    const target = new URL(value, base);
    if (target.origin !== base.origin) return "/admin";
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/admin";
  }
}

function loginRedirect(
  request: Request,
  returnTo: string,
  error: "invalid" | "locked",
  retryAfter?: number,
) {
  const headers = new Headers({
    location: new URL(
      `/admin/login?error=${error}&return_to=${encodeURIComponent(returnTo)}`,
      request.url,
    ).toString(),
    "cache-control": "private, no-store",
  });
  if (retryAfter) headers.set("retry-after", String(retryAfter));
  return new Response(null, { status: 303, headers });
}
