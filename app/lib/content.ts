import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { ensureRuntimeSchema } from "../../db/runtime";
import {
  auditLog,
  contentAttachments,
  contentItems,
} from "../../db/schema";

export type ContentType =
  | "news"
  | "announcement"
  | "event"
  | "project"
  | "emergency"
  | "donation"
  | "document"
  | "gallery";

export type PublicContent = {
  id: string | number;
  type: ContentType;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  status: string;
  statusLabel: string;
  category: string | null;
  location: string | null;
  coverUrl: string | null;
  coverAlt: string | null;
  attachmentUrl: string | null;
  attachments: PublicAttachment[];
  wishNumber: string | null;
  wishRecipient: string | null;
  donationTarget: string | null;
  startsAt: string | null;
  endsAt: string | null;
  startsAtLabel: string | null;
  endsAtLabel: string | null;
  displayDate: string;
  dateDay: string;
  dateMonth: string;
  typeLabel: string;
  sectionHref: string;
  visualMark: string;
};

export type PublicAttachment = {
  key: string;
  url: string;
  filename: string;
  mimeType: string;
  kind: "image" | "file";
  altText: string | null;
};

export type UploadedAttachment = {
  key: string;
  filename: string;
  mimeType: string;
  kind: "image" | "file";
  altText?: string;
};

type ContentRow = typeof contentItems.$inferSelect;
type AttachmentRow = typeof contentAttachments.$inferSelect;

const typeInfo: Record<
  ContentType,
  { label: string; href: string; mark: string }
> = {
  news: { label: "خبر بلدي", href: "/akhbar", mark: "خبر" },
  announcement: { label: "إعلان", href: "/announcements", mark: "إعلان" },
  event: { label: "فعالية", href: "/events", mark: "موعد" },
  project: { label: "مشروع", href: "/projects", mark: "مشروع" },
  emergency: { label: "تنبيه", href: "/emergency", mark: "تنبيه" },
  donation: { label: "حملة", href: "/donations", mark: "حملة" },
  document: { label: "وثيقة", href: "/documents", mark: "PDF" },
  gallery: { label: "معرض", href: "/gallery", mark: "صور" },
};

const sampleRowsBase: Array<
  Omit<ContentRow, "wishNumber" | "wishRecipient" | "donationTarget">
> = [
  {
    id: -1,
    type: "news",
    slug: "sample-road-maintenance",
    title: "متابعة أعمال صيانة الطريق الداخلي",
    excerpt:
      "نموذج لطريقة عرض خبر بلدي مع صور وتفاصيل واضحة وتاريخ آخر تحديث.",
    body:
      "هذا نص تجريبي يُستبدل بالمعلومات الرسمية التي تنشرها البلدية من لوحة الإدارة.",
    status: "published",
    category: "أشغال وصيانة",
    location: "البيرة",
    coverKey: null,
    coverAlt: null,
    attachmentKey: null,
    featured: true,
    startsAt: null,
    endsAt: null,
    publishedAt: "2026-07-20T08:00:00.000Z",
    createdBy: "preview",
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-07-20T08:00:00.000Z",
  },
  {
    id: -2,
    type: "news",
    slug: "sample-cleanup",
    title: "حملة نظافة في الأحياء والساحات العامة",
    excerpt:
      "مساحة لنشر صور الحملة، المناطق المشمولة، والموعد المحدد للأعمال.",
    body: "محتوى تجريبي للمعاينة.",
    status: "published",
    category: "بيئة ونظافة",
    location: "أحياء البلدة",
    coverKey: null,
    coverAlt: null,
    attachmentKey: null,
    featured: false,
    startsAt: null,
    endsAt: null,
    publishedAt: "2026-07-16T08:00:00.000Z",
    createdBy: "preview",
    createdAt: "2026-07-16T08:00:00.000Z",
    updatedAt: "2026-07-16T08:00:00.000Z",
  },
  {
    id: -3,
    type: "news",
    slug: "sample-service-update",
    title: "تحديث حول إحدى الخدمات البلدية",
    excerpt:
      "يظهر هنا كل تحديث رسمي بدل الاعتماد على المنشورات المتفرقة فقط.",
    body: "محتوى تجريبي للمعاينة.",
    status: "published",
    category: "خدمات",
    location: "البيرة",
    coverKey: null,
    coverAlt: null,
    attachmentKey: null,
    featured: false,
    startsAt: null,
    endsAt: null,
    publishedAt: "2026-07-12T08:00:00.000Z",
    createdBy: "preview",
    createdAt: "2026-07-12T08:00:00.000Z",
    updatedAt: "2026-07-12T08:00:00.000Z",
  },
  {
    id: -4,
    type: "project",
    slug: "sample-garden",
    title: "تأهيل الحديقة العامة",
    excerpt: "آخر التحديثات والصور ونطاق العمل تظهر في صفحة المشروع.",
    body: "محتوى تجريبي للمعاينة.",
    status: "published",
    category: "قيد التنفيذ",
    location: "البيرة",
    coverKey: null,
    coverAlt: null,
    attachmentKey: null,
    featured: true,
    startsAt: null,
    endsAt: null,
    publishedAt: "2026-07-18T08:00:00.000Z",
    createdBy: "preview",
    createdAt: "2026-07-18T08:00:00.000Z",
    updatedAt: "2026-07-18T08:00:00.000Z",
  },
  {
    id: -5,
    type: "project",
    slug: "sample-lighting",
    title: "تحسين الإنارة في الطرقات",
    excerpt: "صفحة متابعة توضح المناطق المشمولة وحالة التنفيذ.",
    body: "محتوى تجريبي للمعاينة.",
    status: "published",
    category: "قيد المتابعة",
    location: "طرقات البلدة",
    coverKey: null,
    coverAlt: null,
    attachmentKey: null,
    featured: false,
    startsAt: null,
    endsAt: null,
    publishedAt: "2026-07-11T08:00:00.000Z",
    createdBy: "preview",
    createdAt: "2026-07-11T08:00:00.000Z",
    updatedAt: "2026-07-11T08:00:00.000Z",
  },
  {
    id: -6,
    type: "event",
    slug: "sample-summer-meeting",
    title: "لقاء صيفي لأهالي البلدة",
    excerpt:
      "نموذج لفعالية تتضمن الموعد والمكان والتفاصيل التي تهمّ المشاركين.",
    body: "محتوى تجريبي للمعاينة.",
    status: "published",
    category: "اجتماعي",
    location: "الساحة العامة",
    coverKey: null,
    coverAlt: null,
    attachmentKey: null,
    featured: true,
    startsAt: "2026-08-02T17:00:00.000Z",
    endsAt: null,
    publishedAt: "2026-07-19T08:00:00.000Z",
    createdBy: "preview",
    createdAt: "2026-07-19T08:00:00.000Z",
    updatedAt: "2026-07-19T08:00:00.000Z",
  },
  {
    id: -7,
    type: "announcement",
    slug: "sample-announcement",
    title: "إعلان بلدي تجريبي",
    excerpt: "يظهر الإعلان مع تاريخ نشره وانتهائه وأي ملف مرفق.",
    body: "محتوى تجريبي للمعاينة.",
    status: "published",
    category: "إعلان عام",
    location: null,
    coverKey: null,
    coverAlt: null,
    attachmentKey: null,
    featured: false,
    startsAt: null,
    endsAt: "2026-08-31T20:59:00.000Z",
    publishedAt: "2026-07-21T08:00:00.000Z",
    createdBy: "preview",
    createdAt: "2026-07-21T08:00:00.000Z",
    updatedAt: "2026-07-21T08:00:00.000Z",
  },
  {
    id: -8,
    type: "document",
    slug: "sample-circular",
    title: "تعميم بلدي تجريبي",
    excerpt: "يمكن للبلدية رفع التعميم بصيغة PDF وإضافة وصف مختصر.",
    body: "محتوى تجريبي للمعاينة.",
    status: "published",
    category: "تعاميم",
    location: null,
    coverKey: null,
    coverAlt: null,
    attachmentKey: null,
    featured: false,
    startsAt: null,
    endsAt: null,
    publishedAt: "2026-07-10T08:00:00.000Z",
    createdBy: "preview",
    createdAt: "2026-07-10T08:00:00.000Z",
    updatedAt: "2026-07-10T08:00:00.000Z",
  },
];

const sampleRows: ContentRow[] = sampleRowsBase.map((row) => ({
  ...row,
  wishNumber: null,
  wishRecipient: null,
  donationTarget: null,
}));

export async function getPublishedContent({
  type,
  limit = 30,
}: {
  type?: ContentType;
  limit?: number;
} = {}): Promise<PublicContent[]> {
  try {
    await ensureRuntimeSchema();
    const db = getDb();
    const where = type
      ? and(eq(contentItems.status, "published"), eq(contentItems.type, type))
      : eq(contentItems.status, "published");
    const rows = await db
      .select()
      .from(contentItems)
      .where(where)
      .orderBy(desc(contentItems.featured), desc(contentItems.publishedAt))
      .limit(limit);

    if (rows.length > 0) {
      return rows.map((row) => toPublicContent(row));
    }

    const anyStoredContent = await db
      .select({ id: contentItems.id })
      .from(contentItems)
      .limit(1);
    if (anyStoredContent.length > 0) return [];
  } catch {
    // The preview remains useful before its D1 binding is provisioned.
  }

  return sampleRows
    .filter((row) => !type || row.type === type)
    .slice(0, limit)
    .map((row) => toPublicContent(row));
}

export async function getAdminContent(): Promise<ContentRow[]> {
  try {
    await ensureRuntimeSchema();
    return await getDb()
      .select()
      .from(contentItems)
      .orderBy(desc(contentItems.updatedAt))
      .limit(100);
  } catch {
    return [];
  }
}

export async function createContent(
  input: {
    type: ContentType;
    title: string;
    excerpt: string;
    body: string;
    status: "draft" | "published";
    category?: string;
    location?: string;
    coverKey?: string;
    coverAlt?: string;
    attachmentKey?: string;
    wishNumber?: string;
    wishRecipient?: string;
    donationTarget?: string;
    startsAt?: string;
    endsAt?: string;
    attachments?: UploadedAttachment[];
  },
  actorEmail: string,
) {
  await ensureRuntimeSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const slug = `${slugify(input.title)}-${Date.now().toString(36)}`;
  const { attachments = [], ...contentInput } = input;
  const firstImage = attachments.find((attachment) => attachment.kind === "image");
  const firstFile = attachments.find((attachment) => attachment.kind === "file");
  const [item] = await db
    .insert(contentItems)
    .values({
      ...contentInput,
      coverKey: contentInput.coverKey || firstImage?.key,
      coverAlt: contentInput.coverAlt || firstImage?.altText,
      attachmentKey: contentInput.attachmentKey || firstFile?.key,
      slug,
      publishedAt: contentInput.status === "published" ? now : null,
      createdBy: actorEmail,
      updatedAt: now,
    })
    .returning();

  if (attachments.length > 0) {
    await db.insert(contentAttachments).values(
      attachments.map((attachment, position) => ({
        contentId: item.id,
        mediaKey: attachment.key,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        kind: attachment.kind,
        altText: attachment.altText || null,
        position,
      })),
    );
  }

  await db.insert(auditLog).values({
    action: "create",
    entityType: "content",
    entityId: String(item.id),
    actorEmail,
    details: JSON.stringify({ title: item.title, status: item.status }),
  });

  return item;
}

export async function archiveContent(id: number, actorEmail: string) {
  return setContentStatus(id, "archived", actorEmail);
}

export async function setContentStatus(
  id: number,
  status: "draft" | "published" | "archived",
  actorEmail: string,
) {
  await ensureRuntimeSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const [item] = await db
    .update(contentItems)
    .set({
      status,
      publishedAt: status === "published" ? now : undefined,
      updatedAt: now,
    })
    .where(eq(contentItems.id, id))
    .returning();

  await db.insert(auditLog).values({
    action: `status:${status}`,
    entityType: "content",
    entityId: String(id),
    actorEmail,
    details: item ? JSON.stringify({ title: item.title }) : null,
  });

  return item;
}

export async function getContentBySlug(
  slug: string,
): Promise<PublicContent | null> {
  try {
    await ensureRuntimeSchema();
    const [row] = await getDb()
      .select()
      .from(contentItems)
      .where(
        and(eq(contentItems.slug, slug), eq(contentItems.status, "published")),
      )
      .limit(1);
    if (row) {
      const attachments = await getDb()
        .select()
        .from(contentAttachments)
        .where(eq(contentAttachments.contentId, row.id))
        .orderBy(contentAttachments.position);
      return toPublicContent(row, attachments);
    }

    const anyStoredContent = await getDb()
      .select({ id: contentItems.id })
      .from(contentItems)
      .limit(1);
    if (anyStoredContent.length > 0) return null;
  } catch {
    // Sample detail pages remain available before the database is provisioned.
  }

  const sample = sampleRows.find((row) => row.slug === slug);
  return sample ? toPublicContent(sample) : null;
}

function toPublicContent(
  row: ContentRow,
  attachmentRows: AttachmentRow[] = [],
): PublicContent {
  const type = isContentType(row.type) ? row.type : "news";
  const info = typeInfo[type];
  const dateSource = row.startsAt || row.publishedAt || row.createdAt;
  const date = new Date(dateSource);
  const attachments: PublicAttachment[] = attachmentRows.map((attachment) => ({
    key: attachment.mediaKey,
    url: `/media/${encodeURIComponent(attachment.mediaKey)}`,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    kind: attachment.kind === "image" ? "image" : "file",
    altText: attachment.altText,
  }));
  const firstImage = attachments.find((attachment) => attachment.kind === "image");
  const firstFile = attachments.find((attachment) => attachment.kind === "file");
  const dateParts = new Intl.DateTimeFormat("ar-LB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date);

  return {
    id: row.id,
    type,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    status: row.status,
    statusLabel:
      type === "project" ? row.category || "قيد المتابعة" : "منشور",
    category: row.category,
    location: row.location,
    coverUrl: row.coverKey
      ? `/media/${encodeURIComponent(row.coverKey)}`
      : firstImage?.url || null,
    coverAlt: row.coverAlt || firstImage?.altText || null,
    attachmentUrl: row.attachmentKey
      ? `/media/${encodeURIComponent(row.attachmentKey)}`
      : firstFile?.url || null,
    attachments,
    wishNumber: row.wishNumber,
    wishRecipient: row.wishRecipient,
    donationTarget: row.donationTarget,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    startsAtLabel: formatDateTime(row.startsAt),
    endsAtLabel: formatDateTime(row.endsAt),
    displayDate: Number.isNaN(date.valueOf())
      ? "من دون تاريخ"
      : new Intl.DateTimeFormat("ar-LB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(date),
    dateDay:
      dateParts.find((part) => part.type === "day")?.value || "—",
    dateMonth:
      dateParts.find((part) => part.type === "month")?.value || "",
    typeLabel: info.label,
    sectionHref: info.href,
    visualMark: info.mark,
  };
}

function isContentType(value: string): value is ContentType {
  return value in typeInfo;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatDateTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return new Intl.DateTimeFormat("ar-LB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
