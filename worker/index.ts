/** Cloudflare Worker entry point for the Al-Bireh municipality website. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  MEDIA: R2Bucket;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const isAdminPath =
      url.pathname === "/admin" ||
      url.pathname.startsWith("/admin/") ||
      url.pathname === "/api/admin" ||
      url.pathname.startsWith("/api/admin/");

    if (
      (url.pathname === "/api/admin" ||
        url.pathname.startsWith("/api/admin/")) &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
    ) {
      const origin = request.headers.get("origin");
      if (origin && origin !== url.origin) {
        return withSecurityHeaders(
          Response.json({ error: "Forbidden" }, { status: 403 }),
          true,
        );
      }
    }

    if (url.pathname.startsWith("/media/")) {
      let key: string;
      try {
        key = decodeURIComponent(url.pathname.slice("/media/".length));
      } catch {
        return new Response("Invalid media key", { status: 400 });
      }

      if (!key || request.method !== "GET") {
        return new Response("Not found", { status: 404 });
      }

      if (key.startsWith("resident-requests/")) {
        return new Response("Not found", {
          status: 404,
          headers: { "cache-control": "private, no-store" },
        });
      }

      const object = await env.MEDIA.get(key);
      if (!object) {
        return new Response("Not found", { status: 404 });
      }

      // Resident submissions can contain names, locations and evidence photos.
      // They are served only through the authenticated admin attachment route.
      // Check both the stable key prefix (covers legacy objects) and metadata
      // (covers future key-layout changes) without revealing that an object
      // exists.
      if (
        object.customMetadata?.visibility === "private" ||
        object.customMetadata?.uploadedBy === "resident-request"
      ) {
        return new Response("Not found", {
          status: 404,
          headers: { "cache-control": "private, no-store" },
        });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", "public, max-age=3600, stale-while-revalidate=86400");
      headers.set("x-content-type-options", "nosniff");
      return new Response(object.body, { headers });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    const response = await handler.fetch(request, env, ctx);
    return withSecurityHeaders(response, isAdminPath);
  },
};

function withSecurityHeaders(response: Response, privateResponse: boolean) {
  const headers = new Headers(response.headers);
  if (!headers.has("x-content-type-options")) {
    headers.set("x-content-type-options", "nosniff");
  }
  if (!headers.has("referrer-policy")) {
    headers.set("referrer-policy", "strict-origin-when-cross-origin");
  }
  if (!headers.has("permissions-policy")) {
    headers.set(
      "permissions-policy",
      "camera=(), microphone=(), geolocation=()",
    );
  }
  if (!headers.has("x-frame-options")) {
    headers.set("x-frame-options", "DENY");
  }
  if (!headers.has("content-security-policy")) {
    headers.set(
      "content-security-policy",
      "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
  }
  if (privateResponse) {
    headers.set("cache-control", "private, no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default worker;
