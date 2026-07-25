import type { ReactNode } from "react";
import Link from "next/link";
import { ContentCard } from "./components/ContentCard";
import { PageShell } from "./components/PageShell";
import {
  VillageGallery,
  type GalleryPhoto,
} from "./components/VillageGallery";
import { getPublishedContent } from "./lib/content";

export const dynamic = "force-dynamic";

const villagePhotos: GalleryPhoto[] = [
  {
    src: "/village/masjid-saray.jpg",
    alt: "منظر جوي لمسجد البيرة وسرايها",
    credit: "تصوير: أيمن مرعب",
  },
  {
    src: "/village/saray2.jpg",
    alt: "سرايا البيرة التاريخية",
    credit: "تصوير: عدنان مرعب",
  },
  {
    src: "/village/masjid2.jpg",
    alt: "رواق مسجد البيرة الأثري",
    credit: "تصوير: عدنان مرعب",
  },
  { src: "/village/snow2.jpg", alt: "البيرة تحت الثلج" },
  { src: "/village/saray3.jpg", alt: "أطلال سرايا البيرة" },
  { src: "/village/snow1.jpg", alt: "شتاء في البيرة" },
];

type Service = {
  href: string;
  title: string;
  desc: string;
  icon: ReactNode;
};

const services: Service[] = [
  {
    href: "/services/documents",
    title: "استفسار عن معاملة",
    desc: "طلب أولي ومتابعة مع الموظف المختص",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <path d="M14 3v6h6M8 13h8M8 17h5" />
      </svg>
    ),
  },
  {
    href: "/requests",
    title: "شكوى أو طلب",
    desc: "أبلغ عن مشكلة أو قدّم اقتراحاً",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M12 7v4M12 14h.01" />
      </svg>
    ),
  },
  {
    href: "/announcements",
    title: "الأخبار والإعلانات",
    desc: "آخر ما تنشره البلدية",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 11l18-5v12L3 14zM11.6 16.8a3 3 0 0 1-5.8-1.6" />
      </svg>
    ),
  },
  {
    href: "/projects",
    title: "مشاريع البلدية",
    desc: "متابعة التنفيذ والإنجاز",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    href: "/events",
    title: "الفعاليات",
    desc: "مواعيد ومناسبات البلدة",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/donations",
    title: "الحملات والمساعدات",
    desc: "ادعم أهل البلدة",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.5 1-1a5.5 5.5 0 0 0 0-7.9z" />
      </svg>
    ),
  },
  {
    href: "/about",
    title: "عن البيرة",
    desc: "تاريخها ومعالمها وطبيعتها",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 21h18M5 21V10l7-6 7 6v11M10 21v-5h4v5" />
      </svg>
    ),
  },
  {
    href: "/contact",
    title: "تواصل ودليل",
    desc: "أرقام البلدية والطوارئ",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
      </svg>
    ),
  },
];

const homeValues: Array<[string, string]> = [
  ["الشفافية", "وضوح القرارات والمعلومات أمام الأهالي."],
  ["التنمية", "مشاريع وخدمات تنهض بالبلدة وأهلها."],
  ["المشاركة", "قرارٌ يصنعه أهل البيرة معاً."],
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
      <section className="home-hero">
        <video
          className="home-hero__bg"
          autoPlay
          muted
          loop
          playsInline
          poster="/village/masjid-saray.jpg"
        >
          <source src="/village/video6.mp4" type="video/mp4" />
        </video>
        <div className="container home-hero__inner">
          <p className="eyebrow eyebrow--light">
            بلدية البيرة – عكار · الموقع الرسمي
          </p>
          <h1 className="home-hero__title">معاً… نبني ونزدهر</h1>
          <p className="home-hero__lead">
            بوابتكم إلى خدمات البلدة وأخبارها ومشاريعها، وقناةٌ مباشرة لإرسال
            طلبٍ أو شكوى للبلدية.
          </p>
          <div className="hero__actions">
            <Link className="button button--primary" href="/announcements">
              آخر الأخبار
            </Link>
            <Link className="button button--outline-light" href="/requests">
              الخدمات والطلبات
            </Link>
          </div>
        </div>
      </section>

      <section className="brand-band" aria-label="قيم البلدية">
        <div className="container brand-band__grid">
          {homeValues.map(([title, body], index) => (
            <div className="brand-value" key={title}>
              <span className="brand-value__num">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="services" aria-labelledby="services-title">
        <div className="container">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">خدمات البلدية</p>
              <h2 id="services-title">كل ما تحتاجه من البلدية</h2>
            </div>
          </div>
          <div className="service-grid">
            {services.map((item) => (
              <Link className="service-card" href={item.href} key={item.href}>
                <span className="service-card__icon">{item.icon}</span>
                <strong>{item.title}</strong>
                <small>{item.desc}</small>
                <span className="service-card__arrow" aria-hidden="true">
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

      <section className="section section--paper heritage-teaser">
        <div className="container heritage-teaser__grid">
          <figure className="heritage-teaser__media">
            <img
              src="/village/masjid2.jpg"
              alt="الرواق الداخلي لمسجد البيرة الأثري"
              loading="lazy"
            />
            <figcaption>تصوير: عدنان مرعب</figcaption>
          </figure>
          <div className="heritage-teaser__body">
            <p className="eyebrow">هويتنا</p>
            <h2>البيرة… تاريخٌ من حجرٍ وذاكرة</h2>
            <p>
              من «بيرة الحكم» ومركزِ الدريب، إلى سرايها ومسجدها الأثري المبنيّ
              من الحجر الأسود وأحراج بلوطها — تعرّفوا إلى قصّة البلدة وطبيعتها
              العكاريّة الأصيلة.
            </p>
            <Link className="button button--primary" href="/about">
              تعرّف على البيرة
            </Link>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="gallery-title">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">صور من البلدة</p>
              <h2 id="gallery-title">معرض البيرة</h2>
            </div>
            <Link className="text-link" href="/about">
              كل الصور ←
            </Link>
          </div>
          <VillageGallery photos={villagePhotos} />
        </div>
      </section>

      <section className="section section--paper" aria-labelledby="projects-title">
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
