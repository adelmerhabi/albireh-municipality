import { setContentStatus } from "../../../../lib/content";
import { getAdminIdentity } from "../../../../lib/admin-auth";

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
  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ error: "رقم المادة غير صالح" }, { status: 400 });
  }

  try {
    const payload = (await request.json().catch(() => ({}))) as {
      status?: string;
    };
    const status =
      payload.status === "published" || payload.status === "draft"
        ? payload.status
        : "archived";
    const item = await setContentStatus(id, status, identity.email);
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
