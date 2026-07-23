import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type AdminIdentity = {
  username: string;
  displayName: string;
  email: string;
};

export const ADMIN_COOKIE = "bireh_admin_session";

type SessionPayload = {
  username: string;
  displayName: string;
  exp: number;
};

export async function getAdminIdentity(): Promise<AdminIdentity | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) return null;

  return {
    username: payload.username,
    displayName: payload.displayName,
    email: `${payload.username}@admin.bireh.local`,
  };
}

export async function requireAdmin(returnTo = "/admin") {
  const identity = await getAdminIdentity();
  if (identity) return identity;

  redirect(
    `/admin/login?return_to=${encodeURIComponent(
      returnTo.startsWith("/") ? returnTo : "/admin",
    )}`,
  );
}

export async function createSessionToken(
  username: string,
  displayName: string,
) {
  const payload: SessionPayload = {
    username,
    displayName,
    exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60,
  };
  const encoded = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const signature = await sign(encoded);
  return `${encoded}.${signature}`;
}

export function sessionCookie(token: string) {
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=28800`;
}

export function expiredSessionCookie() {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = await sign(encoded);
  if (!timingSafeEqual(signature, expected)) return null;

  try {
    return JSON.parse(
      new TextDecoder().decode(base64UrlDecode(encoded)),
    ) as SessionPayload;
  } catch {
    return null;
  }
}

async function sign(value: string) {
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  // No baked-in fallback: the session secret must be provided via the
  // ADMIN_SESSION_SECRET binding. If it is absent, signing fails closed and
  // sessions cannot be issued or verified.
  const secret = runtimeEnv.ADMIN_SESSION_SECRET;
  if (!secret) return "";

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return base64UrlEncode(new Uint8Array(signature));
}

function timingSafeEqual(left: string, right: string) {
  if (!left || left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
