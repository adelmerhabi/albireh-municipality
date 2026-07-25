import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCard } from "../components/ContentCard";
import { PageShell } from "../components/PageShell";
import {
  getPublishedContentPage,
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
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { section } = await params;
  const { page: pageParam } = await searchParams;
  const config = sections[section];
  if (!config) notFound();

  const page = Math.max(1, Number(pageParam) || 1);
  const { items, total, totalPages } = await getPublishedContentPage({
    type: config.type,
    page,
  });

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
              {total > 0
                ? `${total} مادة${totalPages > 1 ? ` · صفحة ${page} من ${totalPages}` : ""}`
                : "لا توجد مواد منشورة حالياً"}
            </p>
          </div>
          {items.length > 0 ? (
            <>
              <div className="cards-grid cards-grid--three">
                {items.map((item) => (
                  <ContentCard item={item} key={`${item.type}-${item.id}`} />
                ))}
              </div>
              {totalPages > 1 ? (
                <nav className="pagination" aria-label="صفحات">
                  {page > 1 ? (
                    <Link
                      className="pagination__link"
                      href={`/${section}?page=${page - 1}`}
                    >
                      ← السابق
                    </Link>
                  ) : (
                    <span className="pagination__link is-disabled">← السابق</span>
                  )}
                  <span className="pagination__status">
                    {page} / {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link
                      className="pagination__link"
                      href={`/${section}?page=${page + 1}`}
                    >
                      التالي →
                    </Link>
                  ) : (
                    <span className="pagination__link is-disabled">التالي →</span>
                  )}
                </nav>
              ) : null}
            </>
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
