import type { Metadata } from "next";
import { ContentCard } from "../components/ContentCard";
import { PageShell } from "../components/PageShell";
import { getPublishedContent } from "../lib/content";

export const metadata: Metadata = {
  title: "البحث",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLocaleLowerCase("ar");
  const all = await getPublishedContent();
  const results = query
    ? all.filter(
        (item) =>
          item.title.toLocaleLowerCase("ar").includes(query) ||
          item.excerpt.toLocaleLowerCase("ar").includes(query) ||
          item.category?.toLocaleLowerCase("ar").includes(query),
      )
    : [];

  return (
    <PageShell>
      <section className="page-hero">
        <div className="container page-hero__inner">
          <p className="eyebrow">اعثر على المعلومة بسرعة</p>
          <h1>البحث في الموقع</h1>
          <form className="search-form" action="/search">
            <input
              className="form-control"
              name="q"
              defaultValue={q}
              placeholder="مثلاً: مشروع، تعميم، فعالية..."
              aria-label="عبارة البحث"
            />
            <button className="button button--primary" type="submit">
              بحث
            </button>
          </form>
        </div>
      </section>
      <section className="section">
        <div className="container">
          {query ? (
            <div className="listing-toolbar">
              <p>
                {results.length} نتائج لعبارة «{q}»
              </p>
            </div>
          ) : null}
          {results.length ? (
            <div className="cards-grid cards-grid--three">
              {results.map((item) => (
                <ContentCard item={item} key={`${item.type}-${item.id}`} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {query
                ? "لم نجد نتيجة مطابقة. جرّب عبارة أقصر."
                : "اكتب كلمة للبحث في الأخبار والمشاريع والوثائق."}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
