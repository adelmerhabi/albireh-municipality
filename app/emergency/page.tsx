import type { Metadata } from "next";
import { ContentCard } from "../components/ContentCard";
import { PageShell } from "../components/PageShell";
import { getPublishedContent } from "../lib/content";

export const metadata: Metadata = {
  title: "التنبيهات والطوارئ",
};

export default async function EmergencyPage() {
  const items = await getPublishedContent({ type: "emergency" });

  return (
    <PageShell>
      <section className="page-hero">
        <div className="container page-hero__inner">
          <p className="eyebrow">تنبيهات البلدية</p>
          <h1>الحالات الطارئة</h1>
          <p>
            تعليمات البلدية حول الطرق والخدمات والحالات المحلية. هذه الصفحة
            ليست بديلاً عن أرقام الطوارئ الرسمية.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {items.length ? (
            <div className="cards-grid cards-grid--three">
              {items.map((item) => (
                <ContentCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              لا توجد تنبيهات بلدية فعّالة حالياً.
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
