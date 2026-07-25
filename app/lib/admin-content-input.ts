import type { ContentType, UploadedAttachment } from "./content";

const allowedTypes = new Set<ContentType>([
  "announcement",
  "event",
  "project",
  "donation",
  "gallery",
]);

export type AdminContentInput = {
  type: ContentType;
  title: string;
  excerpt: string;
  body: string;
  status: "draft" | "published" | "archived";
  category?: string;
  location?: string;
  coverAlt?: string;
  wishNumber?: string;
  wishRecipient?: string;
  donationTarget?: string;
  startsAt?: string;
  endsAt?: string;
  attachments: UploadedAttachment[];
};

type ParseOptions = {
  allowArchived?: boolean;
  attachmentCount?: number;
};

export function parseAdminContentInput(
  payload: Record<string, unknown>,
  options: ParseOptions = {},
): { input: AdminContentInput; error?: never } | { input?: never; error: string } {
  const type = String(payload.type || "") as ContentType;
  const title = String(payload.title || "").trim();
  const excerpt = String(payload.excerpt || "").trim();
  const body = String(payload.body || "").trim();
  const requestedStatus = String(payload.status || "draft");
  const status =
    requestedStatus === "published" ||
    requestedStatus === "draft" ||
    (options.allowArchived && requestedStatus === "archived")
      ? requestedStatus
      : null;
  const attachments = normalizeAttachments(payload.attachments);
  const attachmentCount =
    options.attachmentCount ??
    (Array.isArray(payload.attachments) ? payload.attachments.length : 0);
  const category = optionalString(payload.category, 80);
  const location = optionalString(payload.location, 160);
  const startsAt = optionalDate(payload.startsAt);
  const endsAt = optionalDate(payload.endsAt);
  const wishNumber = optionalString(payload.wishNumber, 80);
  const wishRecipient = optionalString(payload.wishRecipient, 120);
  const donationTarget = optionalString(payload.donationTarget, 120);

  if (!allowedTypes.has(type)) {
    return { error: "نوع المحتوى غير صالح" };
  }
  if (!status) {
    return { error: "حالة المحتوى غير صالحة" };
  }
  if (!title) {
    return { error: "العنوان مطلوب" };
  }
  if (type !== "gallery" && !excerpt) {
    return { error: "الملخص مطلوب" };
  }
  if (attachmentCount > 12) {
    return { error: "يمكن حفظ 12 صورة أو ملفاً كحد أقصى لكل مادة" };
  }
  if (type === "gallery" && status === "published" && attachmentCount === 0) {
    return {
      error: "أضف صورة واحدة على الأقل إلى المعرض قبل النشر",
    };
  }
  if (status === "published" && type === "event" && (!startsAt || !location)) {
    return {
      error: "موعد الفعالية ومكانها مطلوبان قبل النشر",
    };
  }
  if (status === "published" && type === "project" && !category) {
    return {
      error: "اختر حالة المشروع قبل النشر",
    };
  }
  if (status === "published" && type === "donation" && !wishNumber) {
    return {
      error: "رقم Wish مطلوب قبل نشر حملة المساعدة",
    };
  }
  if (startsAt && endsAt && Date.parse(endsAt) < Date.parse(startsAt)) {
    return {
      error: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية",
    };
  }

  return {
    input: {
      type,
      title: title.slice(0, 160),
      excerpt: excerpt.slice(0, 320),
      body: body.slice(0, 20000),
      status,
      category,
      location,
      coverAlt: optionalString(payload.coverAlt, 200),
      wishNumber,
      wishRecipient,
      donationTarget,
      startsAt,
      endsAt,
      attachments,
    },
  };
}

export function normalizeAttachments(value: unknown): UploadedAttachment[] {
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
