import { env } from "cloudflare:workers";
import { getAdminIdentity } from "../../../lib/admin-auth";
import { ensureRuntimeSchema } from "../../../../db/runtime";
import { getDb } from "../../../../db";
import { auditLog, mediaFiles } from "../../../../db/schema";

const maxSize = 8 * 1024 * 1024;
const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (!env.MEDIA) {
    return Response.json({ error: "تخزين الملفات غير متاح" }, { status: 503 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") || "").trim().slice(0, 200);
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "اختر ملفاً للرفع" }, { status: 400 });
    }
    if (file.size > maxSize) {
      return Response.json(
        { error: "حجم الملف يجب ألا يتجاوز 8 MB" },
        { status: 400 },
      );
    }
    if (!allowedTypes.has(file.type)) {
      return Response.json(
        { error: "المسموح هو JPG أو PNG أو WebP أو PDF" },
        { status: 400 },
      );
    }

    const extension =
      file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
    const key = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    await env.MEDIA.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        originalName: file.name.slice(0, 180),
        uploadedBy: identity.email,
      },
    });

    await ensureRuntimeSchema();
    const db = getDb();
    await db.insert(mediaFiles).values({
      key,
      filename: file.name.slice(0, 180),
      mimeType: file.type,
      size: file.size,
      altText: alt || null,
      uploadedBy: identity.email,
    });
    await db.insert(auditLog).values({
      action: "upload",
      entityType: "media",
      entityId: key,
      actorEmail: identity.email,
      details: JSON.stringify({ filename: file.name, size: file.size }),
    });

    return Response.json({
      key,
      filename: file.name.slice(0, 180),
      mimeType: file.type,
      url: `/media/${encodeURIComponent(key)}`,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "تعذّر رفع الملف" },
      { status: 500 },
    );
  }
}
