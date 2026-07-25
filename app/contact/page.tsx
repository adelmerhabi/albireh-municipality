import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "../components/PageShell";
import { getPublicSiteSettings } from "../lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الدليل والتواصل",
  description:
    "معلومات التواصل الرسمية مع بلدية البيرة – عكار وأرقام الطوارئ الوطنية الموثقة.",
};

// Verified against the official pages of each Lebanese service in July 2026.
const emergencyNumbers: Array<[string, string]> = [
  ["الدفاع المدني – إطفاء وإنقاذ", "125"],
  ["الصليب الأحمر اللبناني – إسعاف", "140"],
  ["قوى الأمن الداخلي", "112"],
  ["غرفة عمليات الجيش اللبناني", "117"],
];

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  const contactCards = [
    settings.municipalityPhone
      ? {
          label: "هاتف البلدية",
          value: settings.municipalityPhone,
          hint: "اضغط للاتصال مباشرة",
          href: `tel:${settings.municipalityPhone.replace(/[^\d+]/g, "")}`,
        }
      : null,
    settings.municipalityEmail
      ? {
          label: "البريد الإلكتروني",
          value: settings.municipalityEmail,
          hint: "للملاحظات والاستفسارات العامة",
          href: `mailto:${settings.municipalityEmail}`,
        }
      : null,
    settings.whatsappNumber
      ? {
          label: "واتساب البلدية",
          value: settings.whatsappNumber,
          hint: "قناة تواصل تعتمدها البلدية",
          href: `https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`,
        }
      : null,
    settings.municipalityAddress
      ? {
          label: "العنوان",
          value: settings.municipalityAddress,
          hint: "العنوان المعتمد لاستقبال المراجعين",
        }
      : null,
    settings.officeHours
      ? {
          label: "أوقات الدوام",
          value: settings.officeHours,
          hint: "قد تتغير في العطل والمناسبات الرسمية",
        }
      : null,
  ].filter((card): card is NonNullable<typeof card> => Boolean(card));
  const hasDirectContact = Boolean(
    settings.municipalityPhone ||
      settings.municipalityEmail ||
      settings.whatsappNumber,
  );

  return (
    <PageShell>
      <section className="page-hero">
        <div className="container page-hero__inner">
          <p className="eyebrow">قريبون منكم</p>
          <h1>الدليل والتواصل</h1>
          <p>
            معلومات التواصل التي تعتمدها البلدية وأرقام الطوارئ الوطنية في
            مكان واحد. لا تستخدم نموذج الطلبات بديلاً عن الاتصال بالطوارئ.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">بلدية البيرة</p>
              <h2>التواصل مع البلدية</h2>
            </div>
          </div>
          <div className="contact-grid">
            {contactCards.map((card) =>
              card.href ? (
                <a className="contact-card" href={card.href} key={card.label}>
                  <small>{card.label}</small>
                  <strong>
                    <bdi>{card.value}</bdi>
                  </strong>
                  <span>{card.hint}</span>
                </a>
              ) : (
                <div className="contact-card" key={card.label}>
                  <small>{card.label}</small>
                  <strong>{card.value}</strong>
                  <span>{card.hint}</span>
                </div>
              ),
            )}
          </div>
          {!hasDirectContact ? (
            <div className="empty-state" style={{ marginTop: 18 }}>
              لم تعتمد البلدية بعد رقم هاتف أو بريداً إلكترونياً للنشر. يمكن
              حالياً إرسال ملاحظة خاصة عبر{" "}
              <Link href="/requests">صفحة الطلبات والشكاوى</Link>.
            </div>
          ) : null}
          {settings.mapUrl ? (
            <div style={{ marginTop: 22 }}>
              <a
                className="button button--primary"
                href={settings.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                الموقع على الخريطة
              </a>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">للخطر الفوري</p>
              <h2>أرقام الطوارئ الوطنية</h2>
            </div>
          </div>
          <div className="emergency-grid">
            {emergencyNumbers.map(([label, number]) => (
              <a className="emergency-card" href={`tel:${number}`} key={label}>
                <span className="emergency-card__num">{number}</span>
                <span className="emergency-card__label">{label}</span>
              </a>
            ))}
          </div>
          <p className="field-help" style={{ marginTop: 14 }}>
            أرقام وطنية منشورة على المواقع الرسمية للجهات المعنية. اضغط الرقم
            للاتصال مباشرة من الهاتف.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
