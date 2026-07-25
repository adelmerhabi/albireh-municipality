import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { ensureRuntimeSchema } from "../../../../../db/runtime";
import { requestAttachments } from "../../../../../db/schema";
import { getAdminIdentity } from "../../../../lib/admin-auth";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return new Response("Not found", {
      status: 404,
      headers: { "cache-control": "private, no-store" },
    });
  }
  if (!env.MEDIA) {
    return Response.json(
      { error: "تخزين الملفات غير متاح" },
      { status: 503 },
    );
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) {
    return new Response("Not found", {
      status: 404,
      headers: { "cache-control": "private, no-store" },
    });
  }

  try {
    await ensureRuntimeSchema();
    const [attachment] = await getDb()
      .select()
      .from(requestAttachments)
      .where(eq(requestAttachments.id, id))
      .limit(1);

    if (!attachment) {
      return new Response("Not found", {
        status: 404,
        headers: { "cache-control": "private, no-store" },
      });
    }
    if (!allowedImageTypes.has(attachment.mimeType)) {
      return new Response("Unsupported attachment", {
        status: 415,
        headers: { "cache-control": "private, no-store" },
      });
    }

    const object = await env.MEDIA.get(attachment.mediaKey);
    if (!object) {
      return new Response("Not found", {
        status: 404,
        headers: { "cache-control": "private, no-store" },
      });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("content-type", attachment.mimeType);
    headers.set("cache-control", "private, no-store");
    headers.set("content-disposition", contentDisposition(attachment.filename));
    headers.set("x-content-type-options", "nosniff");
    headers.set("referrer-policy", "no-referrer");
    headers.set("cross-origin-resource-policy", "same-origin");
    headers.set("vary", "Cookie");
    return new Response(object.body, { headers });
  } catch {
    return Response.json(
      { error: "تعذّر تحميل المرفق" },
      {
        status: 500,
        headers: { "cache-control": "private, no-store" },
      },
    );
  }
}

function contentDisposition(filename: string) {
  const fallback =
    filename
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/["\\]/g, "_")
      .slice(0, 120) || "attachment";
  return `inline; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(
    filename.slice(0, 180),
  )}`;
}
