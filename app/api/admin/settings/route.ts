import { getAdminIdentity } from "../../../lib/admin-auth";
import {
  getPublicSiteSettings,
  parseSiteSettingsInput,
  updateSiteSettings,
} from "../../../lib/site-settings";

export async function GET() {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }
  return Response.json({ settings: await getPublicSiteSettings() });
}

export async function PUT(request: Request) {
  const identity = await getAdminIdentity();
  if (!identity) {
    return Response.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const parsed = parseSiteSettingsInput(payload);
    if ("error" in parsed) {
      return Response.json({ error: parsed.error }, { status: 400 });
    }
    const settings = await updateSiteSettings(parsed.settings, identity.email);
    return Response.json({ settings });
  } catch {
    return Response.json(
      { error: "تعذّر حفظ معلومات التواصل" },
      { status: 500 },
    );
  }
}
