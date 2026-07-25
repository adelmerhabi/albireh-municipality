import { getAdminIdentity } from "../../../lib/admin-auth";
import {
  createOrResetEmployee,
  getEmployeeUsers,
  isBootstrapAdmin,
} from "../../../lib/admin-users";

export async function GET() {
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

  return Response.json({ users: await getEmployeeUsers() });
}

export async function POST(request: Request) {
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

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const username = String(payload.username || "").trim().toLowerCase();
    const displayName = String(payload.displayName || "").trim();
    const password = String(payload.password || "");

    if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username)) {
      return Response.json(
        {
          error:
            "اسم المستخدم يجب أن يكون من 3 إلى 40 حرفاً إنكليزياً أو رقماً، ويمكن استخدام النقطة والشرطة.",
        },
        { status: 400 },
      );
    }
    if (isBootstrapAdmin(username)) {
      return Response.json(
        { error: "لا يمكن استخدام اسم حساب مدير النظام" },
        { status: 400 },
      );
    }
    if (displayName.length < 2 || displayName.length > 80) {
      return Response.json(
        { error: "أدخل اسم الموظف الظاهر بشكل صحيح" },
        { status: 400 },
      );
    }
    if (password.length < 12 || password.length > 128) {
      return Response.json(
        { error: "كلمة المرور يجب أن تتألف من 12 حرفاً على الأقل" },
        { status: 400 },
      );
    }

    const user = await createOrResetEmployee(
      { username, displayName, password },
      identity.email,
    );
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "تعذّر حفظ حساب الموظف";
    const employeeLimitReached = message.includes("حساب موظف نشط");
    return Response.json(
      {
        error: employeeLimitReached ? message : "تعذّر حفظ حساب الموظف",
      },
      { status: employeeLimitReached ? 409 : 500 },
    );
  }
}
