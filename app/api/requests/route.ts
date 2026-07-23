import { env } from "cloudflare:workers";
import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "../../../db";
import { ensureRuntimeSchema } from "../../../db/runtime";
import {
  auditLog,
  mediaFiles,
  requestAttachments,
  residentRequests,
} from "../../../db/schema";

const allowedKinds = new Set(["complaint", "request", "suggestion"]);
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

  try {
    const form = await request.formData();
    const honeypot = String(form.get("website") || "").trim();
    if (honeypot) {
      return Response.json({ referenceCode: "RECEIVED" }, { status: 201 });
    }

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
    if (message.length < 10) {
      return Response.json(
        { error: "يرجى كتابة تفاصيل أوضح للمشكلة أو الطلب" },
        { status: 400 },
      );
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
      request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-forwarded-for") ||
        "unknown",
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
    const [residentRequest] = await db
      .insert(residentRequests)
      .values({
        referenceCode,
        kind,
        name,
        phone,
        location,
        message: message.slice(0, 4000),
        status: "new",
        sourceHash,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    for (const [position, photo] of photos.entries()) {
      const extension =
        photo.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "jpg";
      const key = `resident-requests/${now.slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
      await env.MEDIA.put(key, photo.stream(), {
        httpMetadata: { contentType: photo.type },
        customMetadata: {
          originalName: photo.name.slice(0, 180),
          requestReference: referenceCode,
        },
      });
      await db.insert(mediaFiles).values({
        key,
        filename: photo.name.slice(0, 180),
        mimeType: photo.type,
        size: photo.size,
        uploadedBy: "resident-request",
      });
      await db.insert(requestAttachments).values({
        requestId: residentRequest.id,
        mediaKey: key,
        filename: photo.name.slice(0, 180),
        mimeType: photo.type,
        position,
      });
    }

    await db.insert(auditLog).values({
      action: "create",
      entityType: "resident_request",
      entityId: String(residentRequest.id),
      details: JSON.stringify({ referenceCode, kind, photoCount: photos.length }),
    });

    return Response.json({ referenceCode }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "تعذّر إرسال الرسالة",
      },
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

async function hashSource(value: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${value}|bireh-resident-requests-v1`),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
