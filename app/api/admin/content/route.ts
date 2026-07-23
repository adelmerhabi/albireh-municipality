import { getAdminIdentity } from "../../../lib/admin-auth";
import {
  createContent,
  getAdminContent,
  type ContentType,
  type UploadedAttachment,
} from "../../../lib/content";

const allowedTypes = new Set<ContentType>([
  "announcement",
  "event",
  "project",
  "donation",
]);

export async function GET() {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  return Response.json({ items: await getAdminContent() });
}

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const type = String(payload.type || "") as ContentType;
    const title = String(payload.title || "").trim();
    const excerpt = String(payload.excerpt || "").trim();
    const body = String(payload.body || "").trim();
    const status = payload.status === "published" ? "published" : "draft";
    const attachments = normalizeAttachments(payload.attachments);
    const category = optionalString(payload.category, 80);
    const location = optionalString(payload.location, 160);
    const startsAt = optionalDate(payload.startsAt);
    const endsAt = optionalDate(payload.endsAt);
    const wishNumber = optionalString(payload.wishNumber, 80);
    const wishRecipient = optionalString(payload.wishRecipient, 120);
    const donationTarget = optionalString(payload.donationTarget, 120);

    if (!allowedTypes.has(type)) {
      return Response.json({ error: "نوع المحتوى غير صالح" }, { status: 400 });
    }
    if (!title || !excerpt) {
      return Response.json(
        { error: "العنوان والملخص مطلوبان" },
        { status: 400 },
      );
    }
    if (status === "published" && type === "event" && (!startsAt || !location)) {
      return Response.json(
        { error: "موعد الفعالية ومكانها مطلوبان قبل النشر" },
        { status: 400 },
      );
    }
    if (status === "published" && type === "project" && !category) {
      return Response.json(
        { error: "اختر حالة المشروع قبل النشر" },
        { status: 400 },
      );
    }
    if (status === "published" && type === "donation" && !wishNumber) {
      return Response.json(
        { error: "رقم Wish مطلوب قبل نشر حملة المساعدة" },
        { status: 400 },
      );
    }

    const item = await createContent(
      {
        type,
        title: title.slice(0, 160),
        excerpt: excerpt.slice(0, 320),
        body: body.slice(0, 20000),
        status,
        category,
        location,
        coverKey: optionalString(payload.coverKey, 300),
        coverAlt: optionalString(payload.coverAlt, 200),
        attachmentKey: optionalString(payload.attachmentKey, 300),
        wishNumber,
        wishRecipient,
        donationTarget,
        startsAt,
        endsAt,
        attachments,
      },
      identity.email,
    );
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "تعذّر حفظ المحتوى",
      },
      { status: 500 },
    );
  }
}

function optionalString(value: unknown, max: number) {
  const normalized = String(value || "").trim();
  return normalized ? normalized.slice(0, max) : undefined;
}

function optionalDate(value: unknown) {
  const normalized = String(value || "").trim();
  if (!normalized) return undefined;
  const date = new Date(normalized);
  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString();
}

function normalizeAttachments(value: unknown): UploadedAttachment[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 12).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const key = optionalString(item.key, 300);
    const filename = optionalString(item.filename, 180);
    const mimeType = optionalString(item.mimeType, 100);
    if (!key || !filename || !mimeType) return [];

    return [
      {
        key,
        filename,
        mimeType,
        kind: mimeType.startsWith("image/") ? "image" : "file",
        altText: optionalString(item.altText, 200),
      } satisfies UploadedAttachment,
    ];
  });
}
