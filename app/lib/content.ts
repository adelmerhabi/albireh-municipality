import { env } from "cloudflare:workers";
import { and, count, desc, eq, inArray, like, or } from "drizzle-orm";
import { getDb } from "../../db";
import { ensureRuntimeSchema } from "../../db/runtime";
import {
  auditLog,
  contentAttachments,
  contentItems,
} from "../../db/schema";
import type { AdminContentInput } from "./admin-content-input";

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

export type ContentRow = typeof contentItems.$inferSelect;
type AttachmentRow = typeof contentAttachments.$inferSelect;

export type AdminContentAttachment = AttachmentRow & {
  url: string;
};

export type AdminContentDetails = ContentRow & {
  attachments: AdminContentAttachment[];
};

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

  return sampleContentEnabled()
    ? sampleRows
        .filter((row) => !type || row.type === type)
        .slice(0, limit)
        .map((row) => toPublicContent(row))
    : [];
}

export async function searchPublishedContent(
  query: string,
  limit = 50,
): Promise<PublicContent[]> {
  const normalized = query.trim().slice(0, 120);
  if (!normalized) return [];
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit) || 50));

  try {
    await ensureRuntimeSchema();
    const pattern = `%${normalized}%`;
    const rows = await getDb()
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.status, "published"),
          or(
            like(contentItems.title, pattern),
            like(contentItems.excerpt, pattern),
            like(contentItems.body, pattern),
            like(contentItems.category, pattern),
            like(contentItems.location, pattern),
          ),
        ),
      )
      .orderBy(desc(contentItems.featured), desc(contentItems.publishedAt))
      .limit(safeLimit);
    return rows.map((row) => toPublicContent(row));
  } catch {
    if (!sampleContentEnabled()) return [];
    const lowered = normalized.toLocaleLowerCase("ar");
    return sampleRows
      .filter((row) =>
        [row.title, row.excerpt, row.body, row.category, row.location].some(
          (value) => value?.toLocaleLowerCase("ar").includes(lowered),
        ),
      )
      .slice(0, safeLimit)
      .map((row) => toPublicContent(row));
  }
}

export type GalleryImage = {
  url: string;
  alt: string | null;
};

// All images uploaded by admins inside published "gallery" items, newest first.
export async function getGalleryImages(limit = 80): Promise<GalleryImage[]> {
  try {
    await ensureRuntimeSchema();
    const db = getDb();
    const items = await db
      .select({ id: contentItems.id })
      .from(contentItems)
      .where(
        and(
          eq(contentItems.status, "published"),
          eq(contentItems.type, "gallery"),
        ),
      )
      .orderBy(desc(contentItems.publishedAt))
      .limit(50);

    if (items.length === 0) return [];

    const rows = await db
      .select()
      .from(contentAttachments)
      .where(
        and(
          inArray(
            contentAttachments.contentId,
            items.map((item) => item.id),
          ),
          eq(contentAttachments.kind, "image"),
        ),
      )
      .orderBy(desc(contentAttachments.contentId), contentAttachments.position)
      .limit(limit);

    return rows.map((row) => ({
      url: `/media/${encodeURIComponent(row.mediaKey)}`,
      alt: row.altText,
    }));
  } catch {
    return [];
  }
}

export type ContentPage = {
  items: PublicContent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Server-side paginated listing (SEO-friendly, works without JS).
export async function getPublishedContentPage({
  type,
  page = 1,
  pageSize = 12,
}: {
  type?: ContentType;
  page?: number;
  pageSize?: number;
}): Promise<ContentPage> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  try {
    await ensureRuntimeSchema();
    const db = getDb();
    const where = type
      ? and(eq(contentItems.status, "published"), eq(contentItems.type, type))
      : eq(contentItems.status, "published");

    const [totalRow] = await db
      .select({ total: count() })
      .from(contentItems)
      .where(where);
    const total = Number(totalRow?.total || 0);

    if (total > 0) {
      const rows = await db
        .select()
        .from(contentItems)
        .where(where)
        .orderBy(desc(contentItems.featured), desc(contentItems.publishedAt))
        .limit(pageSize)
        .offset((safePage - 1) * pageSize);
      return {
        items: rows.map((row) => toPublicContent(row)),
        total,
        page: safePage,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    }

    // No items of this type: if the DB holds other content, this list is empty.
    const [anyRow] = await db
      .select({ total: count() })
      .from(contentItems)
      .where(eq(contentItems.status, "published"));
    if (Number(anyRow?.total || 0) > 0) {
      return { items: [], total: 0, page: 1, pageSize, totalPages: 0 };
    }
  } catch {
    // Fall back to sample content while the database is being provisioned.
  }

  const sampleItems = sampleContentEnabled()
    ? sampleRows.filter((row) => !type || row.type === type)
    : [];
  const total = sampleItems.length;
  const start = (safePage - 1) * pageSize;
  return {
    items: sampleItems
      .slice(start, start + pageSize)
      .map((row) => toPublicContent(row)),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// Published slugs for the sitemap.
export async function getPublishedSlugs(): Promise<string[]> {
  try {
    await ensureRuntimeSchema();
    const rows = await getDb()
      .select({ slug: contentItems.slug })
      .from(contentItems)
      .where(eq(contentItems.status, "published"))
      .limit(1000);
    return rows.map((row) => row.slug);
  } catch {
    return [];
  }
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

export async function getAdminContentById(
  id: number,
): Promise<AdminContentDetails | null> {
  await ensureRuntimeSchema();
  const db = getDb();
  const [item] = await db
    .select()
    .from(contentItems)
    .where(eq(contentItems.id, id))
    .limit(1);
  if (!item) return null;

  const attachments = await db
    .select()
    .from(contentAttachments)
    .where(eq(contentAttachments.contentId, id))
    .orderBy(contentAttachments.position);

  return {
    ...item,
    attachments: attachments.map((attachment) => ({
      ...attachment,
      url: `/media/${encodeURIComponent(attachment.mediaKey)}`,
    })),
  };
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

export async function updateContent(
  id: number,
  input: AdminContentInput,
  retainedAttachmentIds: number[],
  actorEmail: string,
) {
  await ensureRuntimeSchema();
  const db = getDb();
  const existing = await getAdminContentById(id);
  if (!existing) return null;

  const retainedIdSet = new Set(retainedAttachmentIds);
  const retained = existing.attachments.filter((attachment) =>
    retainedIdSet.has(attachment.id),
  );
  const combinedAttachments = [
    ...retained.map((attachment) => ({
      key: attachment.mediaKey,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      kind: attachment.kind === "image" ? ("image" as const) : ("file" as const),
      altText: attachment.altText || undefined,
    })),
    ...input.attachments,
  ].slice(0, 12);
  const firstImage = combinedAttachments.find(
    (attachment) => attachment.kind === "image",
  );
  const firstFile = combinedAttachments.find(
    (attachment) => attachment.kind === "file",
  );
  const preservesLegacyMedia =
    existing.attachments.length === 0 && input.attachments.length === 0;
  const coverKey =
    firstImage?.key || (preservesLegacyMedia ? existing.coverKey : null);
  const attachmentKey =
    firstFile?.key || (preservesLegacyMedia ? existing.attachmentKey : null);
  const now = new Date().toISOString();

  const [item] = await db
    .update(contentItems)
    .set({
      type: input.type,
      title: input.title,
      excerpt: input.excerpt,
      body: input.body,
      status: input.status,
      category: input.category ?? null,
      location: input.location ?? null,
      coverKey,
      coverAlt:
        input.coverAlt ||
        firstImage?.altText ||
        (coverKey === existing.coverKey ? existing.coverAlt : null),
      attachmentKey,
      wishNumber: input.type === "donation" ? input.wishNumber ?? null : null,
      wishRecipient:
        input.type === "donation" ? input.wishRecipient ?? null : null,
      donationTarget:
        input.type === "donation" ? input.donationTarget ?? null : null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      publishedAt:
        input.status === "published"
          ? existing.publishedAt || now
          : existing.publishedAt,
      updatedAt: now,
    })
    .where(eq(contentItems.id, id))
    .returning();
  if (!item) return null;

  await db
    .delete(contentAttachments)
    .where(eq(contentAttachments.contentId, id));
  if (combinedAttachments.length > 0) {
    await db.insert(contentAttachments).values(
      combinedAttachments.map((attachment, position) => ({
        contentId: id,
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
    action: "update",
    entityType: "content",
    entityId: String(id),
    actorEmail,
    details: JSON.stringify({
      title: item.title,
      status: item.status,
      attachments: combinedAttachments.length,
    }),
  });

  return item;
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

  if (item) {
    await db.insert(auditLog).values({
      action: `status:${status}`,
      entityType: "content",
      entityId: String(id),
      actorEmail,
      details: JSON.stringify({ title: item.title }),
    });
  }

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

  if (!sampleContentEnabled()) return null;
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

function sampleContentEnabled() {
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  return runtimeEnv.ENABLE_SAMPLE_CONTENT === "true";
}
