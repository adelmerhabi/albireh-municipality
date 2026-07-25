import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "../components/PageShell";

export const metadata: Metadata = {
  title: "الدليل والتواصل",
  description:
    "معلومات التواصل مع بلدية البيرة – عكار، أرقام الطوارئ الوطنية، ومرافق البلدة.",
};

const MAP_URL = "https://maps.app.goo.gl/HJ8JEpovcfEXJt2u6";

const municipalityContacts: Array<[string, string, string]> = [
  ["الهاتف", "يُعتمد رقم البلدية", "زر اتصال مباشر سيعمل من الهاتف"],
  ["البريد الإلكتروني", "يُعتمد قبل الإطلاق", "للملاحظات والاستفسارات العامة"],
  ["العنوان", "البيرة – عكار، الطريق العام", "يُحدَّد موقع المبنى على الخريطة"],
  ["أوقات الدوام", "تُعلَن رسمياً", "أيام وساعات استقبال المراجعين"],
];

// National Lebanese emergency numbers (stable, safe to publish).
const emergencyNumbers: Array<[string, string]> = [
  ["الدفاع المدني", "125"],
  ["الصليب الأحمر (إسعاف)", "140"],
  ["قوى الأمن الداخلي", "112"],
  ["الجيش اللبناني", "1701"],
  ["أمن الدولة", "1707"],
  ["الحريق والإنقاذ", "125"],
];

const facilities: Array<[string, string]> = [
  ["المدرسة الرسمية", "تُضاف معلومات التواصل"],
  ["المركز الصحي الاجتماعي", "على الطريق العام (تُثبَّت الأرقام رسمياً)"],
  ["المختار", "يُضاف اسم ورقم المختار"],
  ["أماكن العبادة", "المسجد والكنائس في البلدة"],
];

export default function ContactPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <div className="container page-hero__inner">
          <p className="eyebrow">قريبون منكم</p>
          <h1>الدليل والتواصل</h1>
          <p>
            معلومات التواصل مع البلدية، أرقام الطوارئ، ومرافق البلدة في مكانٍ
            واحد. تُثبَّت الأرقام المحلية رسمياً من البلدية قبل الإطلاق العام.
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
            {municipalityContacts.map(([label, value, hint]) => (
              <div className="contact-card" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
                <span>{hint}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22 }}>
            <a
              className="button button--primary"
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
            >
              موقع البلدة على الخريطة
            </a>
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">للحالات الطارئة</p>
              <h2>أرقام الطوارئ</h2>
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
            أرقام وطنية موحّدة. اضغط الرقم للاتصال مباشرةً من الهاتف.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">في خدمة الأهالي</p>
              <h2>مرافق البلدة ومؤسساتها</h2>
            </div>
          </div>
          <div className="contact-grid">
            {facilities.map(([label, hint]) => (
              <div className="contact-card" key={label}>
                <strong>{label}</strong>
                <span>{hint}</span>
              </div>
            ))}
          </div>
          <p className="field-help" style={{ marginTop: 18 }}>
            لإضافة أو تصحيح أي معلومة، تواصلوا مع البلدية عبر{" "}
            <Link href="/requests">صفحة الطلبات</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
