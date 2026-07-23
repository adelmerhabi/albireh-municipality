import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentCard } from "../components/ContentCard";
import { PageShell } from "../components/PageShell";
import {
  getPublishedContent,
  type ContentType,
} from "../lib/content";

const sections: Record<
  string,
  { title: string; eyebrow: string; description: string; type: ContentType }
> = {
  akhbar: {
    title: "أخبار البلدية",
    eyebrow: "آخر المستجدات",
    description:
      "كل ما تنشره البلدية من أخبار الخدمات والأعمال والنشاطات في مكان واحد.",
    type: "news",
  },
  announcements: {
    title: "الإعلانات",
    eyebrow: "معلومات تهمّ أهلنا",
    description:
      "الإعلانات العامة والمواعيد والتحديثات الرسمية مع تاريخ النشر والانتهاء.",
    type: "announcement",
  },
  events: {
    title: "الفعاليات والمناسبات",
    eyebrow: "رزنامة البلدة",
    description:
      "المناسبات واللقاءات والحملات المقبلة مع الوقت والمكان والتفاصيل.",
    type: "event",
  },
  projects: {
    title: "مشاريع البلدية",
    eyebrow: "متابعة العمل",
    description:
      "صفحة شفافة لمتابعة المشاريع المخطط لها، قيد التنفيذ، والمنجزة.",
    type: "project",
  },
  documents: {
    title: "الوثائق والتعاميم",
    eyebrow: "المكتبة الرسمية",
    description:
      "تعاميم البلدية ووثائقها والنماذج المتاحة للتنزيل، مرتبة بطريقة واضحة.",
    type: "document",
  },
  donations: {
    title: "الحملات والمساعدات",
    eyebrow: "خدمة أهلنا",
    description:
      "الحملات المعتمدة ومعلومات المساهمة الرسمية وتاريخ آخر تحديث لكل حملة.",
    type: "donation",
  },
  gallery: {
    title: "معرض الصور",
    eyebrow: "من البيرة",
    description:
      "صور المشاريع والفعاليات والمناسبات التي توثق نشاط البلدية والبلدة.",
    type: "gallery",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const config = sections[section];
  return config ? { title: config.title, description: config.description } : {};
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const config = sections[section];
  if (!config) notFound();

  const items = await getPublishedContent({ type: config.type });

  return (
    <PageShell>
      <section className="page-hero">
        <div className="container page-hero__inner">
          <p className="eyebrow">{config.eyebrow}</p>
          <h1>{config.title}</h1>
          <p>{config.description}</p>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="listing-toolbar">
            <p>
              {items.length > 0
                ? `${items.length} مواد متاحة حالياً`
                : "لا توجد مواد منشورة حالياً"}
            </p>
            <p>المحتوى التجريبي سيُستبدل بالمحتوى الرسمي.</p>
          </div>
          {items.length > 0 ? (
            <div className="cards-grid cards-grid--three">
              {items.map((item) => (
                <ContentCard item={item} key={`${item.type}-${item.id}`} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              ستظهر المواد هنا عندما تنشرها البلدية من لوحة الإدارة.
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
