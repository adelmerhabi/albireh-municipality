import { getAdminIdentity } from "../../../../lib/admin-auth";
import {
  deleteResidentRequest,
  setResidentRequestStatus,
  type ResidentRequestStatus,
} from "../../../../lib/requests";

const allowedStatuses = new Set<ResidentRequestStatus>([
  "new",
  "in_review",
  "resolved",
  "archived",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  const payload = (await request.json().catch(() => ({}))) as {
    status?: ResidentRequestStatus;
  };
  if (
    !Number.isInteger(id) ||
    id < 1 ||
    !payload.status ||
    !allowedStatuses.has(payload.status)
  ) {
    return Response.json({ error: "الطلب غير صالح" }, { status: 400 });
  }

  try {
    const updated = await setResidentRequestStatus(
      id,
      payload.status,
      identity.email,
    );
    if (!updated) {
      return Response.json({ error: "الرسالة غير موجودة" }, { status: 404 });
    }
    return Response.json({ request: updated });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "تعذّر تحديث الرسالة",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: "الطلب غير صالح" }, { status: 400 });
  }

  try {
    const deleted = await deleteResidentRequest(id, identity.email);
    if (!deleted) {
      return Response.json({ error: "الرسالة غير موجودة" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "تعذّر حذف الرسالة",
      },
      { status: 500 },
    );
  }
}
