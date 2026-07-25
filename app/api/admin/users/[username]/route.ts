import { getAdminIdentity } from "../../../../lib/admin-auth";
import {
  setEmployeeActive,
} from "../../../../lib/admin-users";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  if (identity.role !== "bootstrap") {
    return Response.json(
      { error: "إدارة حسابات الموظفين متاحة لمدير النظام فقط" },
      { status: 403 },
    );
  }

  const { username: rawUsername } = await params;
  const username = String(rawUsername).trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username)) {
    return Response.json({ error: "اسم المستخدم غير صالح" }, { status: 400 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    if (typeof payload.active !== "boolean") {
      return Response.json({ error: "الحالة غير صالحة" }, { status: 400 });
    }
    const user = await setEmployeeActive(
      username,
      payload.active,
      identity.email,
    );
    if (!user) {
      return Response.json({ error: "حساب الموظف غير موجود" }, { status: 404 });
    }
    return Response.json({ user });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "تعذّر تحديث حساب الموظف";
    const employeeLimitReached = message.includes("حساب موظف نشط");
    return Response.json(
      {
        error: employeeLimitReached ? message : "تعذّر تحديث حساب الموظف",
      },
      { status: employeeLimitReached ? 409 : 500 },
    );
  }
}
