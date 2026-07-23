import { getAdminIdentity } from "../../../../lib/admin-auth";
import {
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
