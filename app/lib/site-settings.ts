import { getDb } from "../../db";
import { ensureRuntimeSchema } from "../../db/runtime";
import { auditLog, siteSettings } from "../../db/schema";

export type PublicSiteSettings = {
  municipalityPhone: string;
  municipalityEmail: string;
  municipalityAddress: string;
  officeHours: string;
  whatsappNumber: string;
  mapUrl: string;
};

export type SiteSettingsInput = PublicSiteSettings;

const settingKeys: Record<keyof PublicSiteSettings, string> = {
  municipalityPhone: "municipality_phone",
  municipalityEmail: "municipality_email",
  municipalityAddress: "municipality_address",
  officeHours: "office_hours",
  whatsappNumber: "whatsapp_number",
  mapUrl: "map_url",
};

const defaults: PublicSiteSettings = {
  municipalityPhone: "",
  municipalityEmail: "",
  municipalityAddress: "البيرة – عكار",
  officeHours: "",
  whatsappNumber: "",
  mapUrl: "https://maps.app.goo.gl/HJ8JEpovcfEXJt2u6",
};

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    await ensureRuntimeSchema();
    const rows = await getDb().select().from(siteSettings);
    const values = new Map(rows.map((row) => [row.key, row.value]));
    return Object.fromEntries(
      Object.entries(settingKeys).map(([property, key]) => [
        property,
        values.get(key) || defaults[property as keyof PublicSiteSettings],
      ]),
    ) as PublicSiteSettings;
  } catch {
    return { ...defaults };
  }
}

export async function updateSiteSettings(
  input: SiteSettingsInput,
  actorEmail: string,
) {
  await ensureRuntimeSchema();
  const db = getDb();
  const now = new Date().toISOString();

  for (const [property, key] of Object.entries(settingKeys)) {
    const value = input[property as keyof SiteSettingsInput];
    await db
      .insert(siteSettings)
      .values({ key, value, updatedBy: actorEmail, updatedAt: now })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedBy: actorEmail, updatedAt: now },
      });
  }

  await db.insert(auditLog).values({
    action: "update",
    entityType: "site_settings",
    entityId: "contact",
    actorEmail,
    details: JSON.stringify({ keys: Object.values(settingKeys) }),
  });

  return getPublicSiteSettings();
}

export function parseSiteSettingsInput(
  payload: Record<string, unknown>,
):
  | { settings: SiteSettingsInput; error?: never }
  | { settings?: never; error: string } {
  const settings: SiteSettingsInput = {
    municipalityPhone: text(payload.municipalityPhone, 60),
    municipalityEmail: text(payload.municipalityEmail, 160).toLowerCase(),
    municipalityAddress: text(payload.municipalityAddress, 240),
    officeHours: text(payload.officeHours, 240),
    whatsappNumber: text(payload.whatsappNumber, 60),
    mapUrl: text(payload.mapUrl, 500),
  };

  if (
    settings.municipalityEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.municipalityEmail)
  ) {
    return { error: "البريد الإلكتروني غير صالح" };
  }
  if (
    settings.municipalityPhone &&
    settings.municipalityPhone.replace(/\D/g, "").length < 6
  ) {
    return { error: "رقم هاتف البلدية غير صالح" };
  }
  if (
    settings.whatsappNumber &&
    settings.whatsappNumber.replace(/\D/g, "").length < 7
  ) {
    return { error: "رقم واتساب البلدية غير صالح" };
  }
  if (settings.mapUrl) {
    try {
      const url = new URL(settings.mapUrl);
      if (url.protocol !== "https:") throw new Error("invalid protocol");
    } catch {
      return { error: "رابط الخريطة يجب أن يكون رابط HTTPS صالحاً" };
    }
  }

  return { settings };
}

function text(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}
