import { getAdminIdentity } from "../../../lib/admin-auth";
import {
  createContent,
  getAdminContent,
} from "../../../lib/content";
import { parseAdminContentInput } from "../../../lib/admin-content-input";

export async function GET() {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  return Response.json({ items: await getAdminContent() });
}

export async function POST(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const parsed = parseAdminContentInput(payload);
    if ("error" in parsed) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    if (parsed.input.status === "archived") {
      return Response.json({ error: "حالة المحتوى غير صالحة" }, { status: 400 });
    }

    const item = await createContent(
      {
        ...parsed.input,
        status: parsed.input.status,
      },
      identity.email,
    );
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "تعذّر حفظ المحتوى",
      },
      { status: 500 },
    );
  }
}
