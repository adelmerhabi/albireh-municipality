import Link from "next/link";
import { ContentCard } from "./components/ContentCard";
import { PageShell } from "./components/PageShell";
import { getPublishedContent } from "./lib/content";

const quickLinks = [
  {
    href: "/announcements",
    kicker: "ما يجب معرفته اليوم",
    title: "الإعلانات",
    mark: "إ",
  },
  {
    href: "/events",
    kicker: "مواعيد ومناسبات",
    title: "الفعاليات",
    mark: "ف",
  },
  {
    href: "/projects",
    kicker: "متابعة التنفيذ",
    title: "مشاريع البلدية",
    mark: "م",
  },
  {
    href: "/requests",
    kicker: "شكوى، طلب أو اقتراح",
    title: "أرسل للبلدية",
    mark: "ط",
  },
];

export default async function Home() {
  const [latest, projects, events, donations] = await Promise.all([
    getPublishedContent({ limit: 3 }),
    getPublishedContent({ type: "project", limit: 2 }),
    getPublishedContent({ type: "event", limit: 1 }),
    getPublishedContent({ type: "donation", limit: 1 }),
  ]);
  const activeCampaign = donations[0];

  return (
    <PageShell>
      <section className="hero">
        <div className="hero__wash" />
        <div className="container hero__grid">
          <div className="hero__content">
            <p className="eyebrow">الموقع الرسمي لبلدية البيرة – عكار</p>
            <h1>
              إعلانات الضيعة وخدماتها،
              <span> من مصدر رسمي واحد.</span>
            </h1>
            <p className="hero__lead">
              مساحة واضحة وسريعة لمتابعة الإعلانات، المشاريع، الفعاليات
              وحملات المساعدة، مع قناة خاصة لإرسال طلب أو شكوى للبلدية.
            </p>
            <div className="hero__actions">
              <Link className="button button--primary" href="/announcements">
                آخر الإعلانات
              </Link>
              <Link className="button button--ghost" href="/requests">
                أرسل طلباً أو شكوى
              </Link>
            </div>
            <p className="hero__note">
              نسخة قيد الإعداد — المحتوى الظاهر حالياً تجريبي إلى حين اعتماده
              من البلدية.
            </p>
          </div>

          <div className="hero__municipality-card" aria-label="هوية بلدية البيرة">
            <div className="cedar-crop cedar-crop--large">
              <img src="/municipality-source.jpg" alt="" />
            </div>
            <p>بلدية البيرة – عكار</p>
            <strong>البيرة تجمعنا</strong>
            <div className="hero__card-line" />
            <span>خدمة محلية • تواصل مباشر • معلومات موثوقة</span>
          </div>
        </div>
      </section>

      <section className="quick-access" aria-labelledby="quick-title">
        <div className="container">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">وصول سريع</p>
              <h2 id="quick-title">شو عم تدوّر عليه؟</h2>
            </div>
          </div>
          <div className="quick-grid">
            {quickLinks.map((item) => (
              <Link className="quick-card" href={item.href} key={item.href}>
                <span className="quick-card__mark">{item.mark}</span>
                <span>
                  <small>{item.kicker}</small>
                  <strong>{item.title}</strong>
                </span>
                <span className="quick-card__arrow" aria-hidden="true">
                  ←
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--paper" aria-labelledby="news-title">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">يُحدّث مباشرة من لوحة البلدية</p>
              <h2 id="news-title">آخر ما نُشر</h2>
            </div>
            <Link className="text-link" href="/announcements">
              كل الإعلانات ←
            </Link>
          </div>
          {latest.length ? (
            <div className="cards-grid cards-grid--three">
              {latest.map((item) => (
                <ContentCard item={item} key={`${item.type}-${item.id}`} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              لا يوجد محتوى منشور حالياً. سيظهر أول خبر أو مشروع هنا فور نشره.
            </div>
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="projects-title">
        <div className="container projects-layout">
          <div>
            <div className="section-heading">
              <div>
                <p className="eyebrow">من التخطيط إلى الإنجاز</p>
                <h2 id="projects-title">مشاريع البلدية</h2>
              </div>
              <Link className="text-link" href="/projects">
                عرض المشاريع ←
              </Link>
            </div>
            <div className="projects-list">
              {projects.length ? (
                projects.map((item, index) => (
                  <Link
                    href={`/item/${item.slug}`}
                    className="project-row"
                    key={`${item.type}-${item.id}`}
                  >
                    <span className="project-row__number">0{index + 1}</span>
                    <span>
                      <small>{item.category || "مشروع بلدي"}</small>
                      <strong>{item.title}</strong>
                      <p>{item.excerpt}</p>
                    </span>
                    <span className="status-pill">{item.statusLabel}</span>
                  </Link>
                ))
              ) : (
                <div className="empty-state" style={{ marginTop: 20 }}>
                  لا توجد مشاريع منشورة حالياً.
                </div>
              )}
            </div>
          </div>

          <aside className="notice-card">
            <p className="eyebrow eyebrow--light">المناسبة المقبلة</p>
            <div className="notice-card__date">
              <strong>{events[0]?.dateDay || "—"}</strong>
              <span>{events[0]?.dateMonth || "قريباً"}</span>
            </div>
            <h3>{events[0]?.title || "لا توجد فعالية معلنة حالياً"}</h3>
            <p>{events[0]?.excerpt}</p>
            {events[0]?.location ? (
              <span className="notice-card__location">
                المكان: {events[0].location}
              </span>
            ) : null}
            <Link className="button button--light" href="/events">
              تفاصيل الفعاليات
            </Link>
          </aside>
        </div>
      </section>

      <section className="section section--dark" aria-labelledby="help-title">
        <div className="container help-layout">
          <div>
            <p className="eyebrow eyebrow--light">خدمة أهلنا</p>
            <h2 id="help-title">
              {activeCampaign?.title || "حملة مساعدة أو تبرّع فعّالة؟"}
            </h2>
            <p>
              {activeCampaign?.excerpt ||
                "عندما تعتمد البلدية حملة، تظهر هنا معلوماتها الرسمية ورقم التحويل وتاريخ آخر تحديث، من دون استقبال أي دفعات داخل الموقع."}
            </p>
          </div>
          <div className="donation-preview">
            <img src="/wish-money-logo.png" alt="Wish Money" />
            <small>تحويل مباشر إلى الرقم الذي تعتمده البلدية</small>
            <strong>
              <bdi>{activeCampaign?.wishNumber || "يُضاف الرقم من البلدية"}</bdi>
            </strong>
            <span>
              {activeCampaign?.wishRecipient ||
                (activeCampaign
                  ? "تفاصيل المستفيد داخل صفحة الحملة"
                  : "لا توجد حملة فعّالة حالياً")}
            </span>
          </div>
          <Link
            className="button button--outline-light"
            href={
              activeCampaign
                ? `/item/${activeCampaign.slug}`
                : "/donations"
            }
          >
            {activeCampaign ? "تفاصيل الحملة" : "الحملات والمساعدات"}
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
