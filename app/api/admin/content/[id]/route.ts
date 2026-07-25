import {
  getAdminContentById,
  setContentStatus,
  updateContent,
} from "../../../../lib/content";
import { getAdminIdentity } from "../../../../lib/admin-auth";
import { parseAdminContentInput } from "../../../../lib/admin-content-input";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  const id = await parseId(params);
  if (!id) {
    return Response.json({ error: "رقم المادة غير صالح" }, { status: 400 });
  }

  try {
    const item = await getAdminContentById(id);
    if (!item) {
      return Response.json({ error: "المادة غير موجودة" }, { status: 404 });
    }
    return Response.json({ item });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "تعذّر تحميل المادة" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  const id = await parseId(params);
  if (!id) {
    return Response.json({ error: "رقم المادة غير صالح" }, { status: 400 });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    // Status buttons send a deliberately small payload. Reject unknown values
    // instead of treating malformed requests as an archive action.
    if (!("title" in payload)) {
      const status =
        payload.status === "published" ||
        payload.status === "draft" ||
        payload.status === "archived"
          ? payload.status
          : null;
      if (!status) {
        return Response.json(
          { error: "حالة المحتوى غير صالحة" },
          { status: 400 },
        );
      }
      if (status === "published") {
        const existing = await getAdminContentById(id);
        if (!existing) {
          return Response.json(
            { error: "المادة غير موجودة" },
            { status: 404 },
          );
        }
        const validation = parseAdminContentInput(
          {
            ...existing,
            status,
            attachments: existing.attachments.map((attachment) => ({
              key: attachment.mediaKey,
              filename: attachment.filename,
              mimeType: attachment.mimeType,
              altText: attachment.altText,
            })),
          },
          {
            allowArchived: true,
            attachmentCount:
              existing.attachments.length || (existing.coverKey ? 1 : 0),
          },
        );
        if ("error" in validation) {
          return Response.json({ error: validation.error }, { status: 400 });
        }
      }
      const item = await setContentStatus(id, status, identity.email);
      if (!item) {
        return Response.json({ error: "المادة غير موجودة" }, { status: 404 });
      }
      return Response.json({ item });
    }

    const existing = await getAdminContentById(id);
    if (!existing) {
      return Response.json({ error: "المادة غير موجودة" }, { status: 404 });
    }
    const requestedRetainedIds = normalizeRetainedIds(
      payload.retainedAttachmentIds,
    );
    const existingIds = new Set(
      existing.attachments.map((attachment) => attachment.id),
    );
    const retainedIds = requestedRetainedIds.filter((attachmentId) =>
      existingIds.has(attachmentId),
    );
    const newAttachmentCount = Array.isArray(payload.attachments)
      ? payload.attachments.length
      : 0;
    const parsed = parseAdminContentInput(payload, {
      allowArchived: true,
      attachmentCount: retainedIds.length + newAttachmentCount,
    });
    if ("error" in parsed) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }

    const item = await updateContent(
      id,
      parsed.input,
      retainedIds,
      identity.email,
    );
    if (!item) {
      return Response.json({ error: "المادة غير موجودة" }, { status: 404 });
    }
    return Response.json({ item });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "تعذّرت الأرشفة" },
      { status: 500 },
    );
  }
}

async function parseId(params: Promise<{ id: string }>) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeRetainedIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value
        .slice(0, 12)
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
}
