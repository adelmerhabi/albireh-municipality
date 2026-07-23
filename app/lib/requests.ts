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
            url: `/media/${encodeURIComponent(attachment.mediaKey)}`,
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
