import { env } from "cloudflare:workers";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureRuntimeSchema } from "../../../db/runtime";
import { residentRequests } from "../../../db/schema";

const allowedKinds = new Set([
  "complaint",
  "request",
  "suggestion",
  "document",
]);
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const maxImageSize = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (!env.MEDIA) {
    return Response.json({ error: "خدمة رفع الصور غير متاحة" }, { status: 503 });
  }
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  if (!runtimeEnv.ADMIN_SESSION_SECRET) {
    return Response.json(
      { error: "خدمة إرسال الطلبات غير متاحة مؤقتاً" },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const honeypot = String(form.get("website") || "").trim();
    if (honeypot) {
      return Response.json({ referenceCode: "RECEIVED" }, { status: 201 });
    }

    const privacyConsent = String(form.get("privacyConsent") || "");
    const kind = String(form.get("kind") || "");
    const message = String(form.get("message") || "").trim();
    const name = optionalString(form.get("name"), 100);
    const phone = optionalString(form.get("phone"), 40);
    const location = optionalString(form.get("location"), 180);
    const photos = form
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (!allowedKinds.has(kind)) {
      return Response.json({ error: "اختر نوع الرسالة" }, { status: 400 });
    }
    if (privacyConsent !== "accepted") {
      return Response.json(
        { error: "يجب الموافقة على سياسة الخصوصية قبل إرسال الطلب" },
        { status: 400 },
      );
    }
    if (message.length < 10) {
      return Response.json(
        { error: "يرجى كتابة تفاصيل أوضح للمشكلة أو الطلب" },
        { status: 400 },
      );
    }
    if (!phone || phone.replace(/\D/g, "").length < 6) {
      return Response.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
    }
    if (photos.length > 3) {
      return Response.json(
        { error: "يمكن إرفاق ثلاث صور كحد أقصى" },
        { status: 400 },
      );
    }
    for (const photo of photos) {
      if (!allowedImageTypes.has(photo.type)) {
        return Response.json(
          { error: "الصور المسموحة هي JPG أو PNG أو WebP" },
          { status: 400 },
        );
      }
      if (photo.size > maxImageSize) {
        return Response.json(
          { error: "حجم كل صورة يجب ألا يتجاوز 8 MB" },
          { status: 400 },
        );
      }
    }

    await ensureRuntimeSchema();
    const db = getDb();
    const now = new Date().toISOString();
    const sourceHash = await hashSource(
      request.headers.get("cf-connecting-ip")?.trim() ||
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown",
      runtimeEnv.ADMIN_SESSION_SECRET,
    );
    const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [recent] = await db
      .select({ total: count() })
      .from(residentRequests)
      .where(
        and(
          eq(residentRequests.sourceHash, sourceHash),
          gte(residentRequests.createdAt, windowStart),
        ),
      );
    if (Number(recent?.total || 0) >= 3) {
      return Response.json(
        { error: "تم إرسال عدة رسائل مؤخراً. يرجى المحاولة بعد ساعة." },
        { status: 429 },
      );
    }

    const referenceCode = createReferenceCode();
    const uploadedPhotos: Array<{
      key: string;
      filename: string;
      mimeType: string;
      size: number;
      position: number;
    }> = [];

    try {
      for (const [position, photo] of photos.entries()) {
        const extension =
          photo.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
        const key = `resident-requests/${now.slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
        await env.MEDIA.put(key, photo.stream(), {
          httpMetadata: { contentType: photo.type },
          customMetadata: {
            originalName: photo.name.slice(0, 180),
            requestReference: referenceCode,
            visibility: "private",
          },
        });
        uploadedPhotos.push({
          key,
          filename: photo.name.slice(0, 180),
          mimeType: photo.type,
          size: photo.size,
          position,
        });
      }

      // D1 batch statements are committed atomically. The request, attachment
      // metadata and audit entry therefore either all exist or none do.
      await env.DB.batch([
        env.DB.prepare(`
          INSERT INTO resident_requests (
            reference_code, kind, name, phone, location, message, status,
            source_hash, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)
        `).bind(
          referenceCode,
          kind,
          name,
          phone,
          location,
          message.slice(0, 4000),
          sourceHash,
          now,
          now,
        ),
        ...uploadedPhotos.flatMap((photo) => [
          env.DB.prepare(`
            INSERT INTO media_files (
              key, filename, mime_type, size, uploaded_by, created_at
            ) VALUES (?, ?, ?, ?, 'resident-request', ?)
          `).bind(
            photo.key,
            photo.filename,
            photo.mimeType,
            photo.size,
            now,
          ),
          env.DB.prepare(`
            INSERT INTO request_attachments (
              request_id, media_key, filename, mime_type, position, created_at
            )
            SELECT id, ?, ?, ?, ?, ?
            FROM resident_requests
            WHERE reference_code = ?
          `).bind(
            photo.key,
            photo.filename,
            photo.mimeType,
            photo.position,
            now,
            referenceCode,
          ),
        ]),
        env.DB.prepare(`
          INSERT INTO audit_log (
            action, entity_type, entity_id, details, created_at
          )
          SELECT 'create', 'resident_request', CAST(id AS TEXT), ?, ?
          FROM resident_requests
          WHERE reference_code = ?
        `).bind(
          JSON.stringify({
            referenceCode,
            kind,
            photoCount: uploadedPhotos.length,
          }),
          now,
          referenceCode,
        ),
      ]);
    } catch (error) {
      await cleanupUploadedPhotos(uploadedPhotos.map((photo) => photo.key));
      throw error;
    }

    return Response.json({ referenceCode }, { status: 201 });
  } catch (error) {
    console.error(
      "Resident request submission failed",
      error instanceof Error ? error.name : typeof error,
    );
    return Response.json(
      { error: "تعذّر إرسال الرسالة. يرجى المحاولة لاحقاً." },
      { status: 500 },
    );
  }
}

function optionalString(value: FormDataEntryValue | null, max: number) {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, max) : null;
}

function createReferenceCode() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `BIR-${date}-${random}`;
}

async function hashSource(value: string, secret: string) {
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
    new TextEncoder().encode(`resident-request-source-v1|${value}`),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function cleanupUploadedPhotos(keys: string[]) {
  await Promise.allSettled(keys.map((key) => env.MEDIA.delete(key)));
}
