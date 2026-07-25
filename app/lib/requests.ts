import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { ensureRuntimeSchema } from "../../db/runtime";
import {
  auditLog,
  requestAttachments,
  residentRequests,
} from "../../db/schema";

export type ResidentRequestStatus =
  | "new"
  | "in_review"
  | "resolved"
  | "archived";

export type AdminResidentRequest = {
  id: number;
  referenceCode: string;
  kind: string;
  name: string | null;
  phone: string | null;
  location: string | null;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  attachments: Array<{
    id: number;
    url: string;
    filename: string;
    mimeType: string;
  }>;
};

export async function getAdminResidentRequests(): Promise<
  AdminResidentRequest[]
> {
  try {
    await ensureRuntimeSchema();
    const db = getDb();
    const rows = await db
      .select()
      .from(residentRequests)
      .orderBy(desc(residentRequests.createdAt))
      .limit(100);

    return await Promise.all(
      rows.map(async (row) => {
        const attachments = await db
          .select()
          .from(requestAttachments)
          .where(eq(requestAttachments.requestId, row.id))
          .orderBy(requestAttachments.position);

        return {
          id: row.id,
          referenceCode: row.referenceCode,
          kind: row.kind,
          name: row.name,
          phone: row.phone,
          location: row.location,
          message: row.message,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          attachments: attachments.map((attachment) => ({
            id: attachment.id,
            url: `/api/admin/request-attachments/${attachment.id}`,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
          })),
        };
      }),
    );
  } catch {
    return [];
  }
}

export async function setResidentRequestStatus(
  id: number,
  status: ResidentRequestStatus,
  actorEmail: string,
) {
  await ensureRuntimeSchema();
  const db = getDb();
  const now = new Date().toISOString();
  const [request] = await db
    .update(residentRequests)
    .set({ status, updatedAt: now })
    .where(eq(residentRequests.id, id))
    .returning();

  if (request) {
    await db.insert(auditLog).values({
      action: `request:${status}`,
      entityType: "resident_request",
      entityId: String(id),
      actorEmail,
      details: JSON.stringify({ referenceCode: request.referenceCode }),
    });
  }

  return request;
}

export async function deleteResidentRequest(
  id: number,
  actorEmail: string,
) {
  await ensureRuntimeSchema();
  const db = getDb();
  const [residentRequest] = await db
    .select({
      id: residentRequests.id,
      referenceCode: residentRequests.referenceCode,
    })
    .from(residentRequests)
    .where(eq(residentRequests.id, id))
    .limit(1);
  if (!residentRequest) return false;

  const attachments = await db
    .select({ mediaKey: requestAttachments.mediaKey })
    .from(requestAttachments)
    .where(eq(requestAttachments.requestId, id));
  const mediaKeys = attachments.map((attachment) => attachment.mediaKey);

  // Delete the private objects first. If the following database batch fails,
  // the operation is safe to retry and no private object has become public.
  if (mediaKeys.length) {
    if (!env.MEDIA) {
      throw new Error("تخزين الملفات غير متاح");
    }
    await env.MEDIA.delete(mediaKeys);
  }

  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      "DELETE FROM request_attachments WHERE request_id = ?",
    ).bind(id),
    ...mediaKeys.map((key) =>
      env.DB.prepare(
        "DELETE FROM media_files WHERE key = ? AND uploaded_by = 'resident-request'",
      ).bind(key),
    ),
    env.DB.prepare("DELETE FROM resident_requests WHERE id = ?").bind(id),
    env.DB.prepare(`
      INSERT INTO audit_log (
        action, entity_type, entity_id, actor_email, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      "delete",
      "resident_request",
      String(id),
      actorEmail,
      JSON.stringify({
        referenceCode: residentRequest.referenceCode,
        attachmentCount: mediaKeys.length,
      }),
      now,
    ),
  ]);

  return true;
}
