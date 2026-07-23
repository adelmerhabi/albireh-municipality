import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "../components/PageShell";

export const metadata: Metadata = {
  title: "التواصل",
  description: "معلومات التواصل الرسمية مع بلدية البيرة – عكار.",
};

export default function ContactPage() {
  return (
    <PageShell>
      <section className="page-hero">
        <div className="container page-hero__inner">
          <p className="eyebrow">نحن قريبون منكم</p>
          <h1>التواصل مع البلدية</h1>
          <p>
            ستُثبت البلدية أرقام الهاتف والبريد الرسمي وساعات الدوام قبل
            الإطلاق العام.
          </p>
        </div>
      </section>
      <section className="section section--paper">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-card">
              <small>الهاتف</small>
              <strong>يُضاف رقم البلدية</strong>
              <span>زر اتصال مباشر سيعمل من الهاتف.</span>
            </div>
            <div className="contact-card">
              <small>البريد الإلكتروني</small>
              <strong>يُعتمد قبل الإطلاق</strong>
              <span>للملاحظات والاستفسارات العامة.</span>
            </div>
            <div className="contact-card">
              <small>العنوان</small>
              <strong>البيرة، عكار</strong>
              <span>يُضاف موقع مبنى البلدية على الخريطة.</span>
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <Link className="button button--primary" href="/">
              العودة إلى الرئيسية
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
