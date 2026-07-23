import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "../components/PageShell";
import { VillageGallery, type GalleryPhoto } from "../components/VillageGallery";
import { getGalleryImages } from "../lib/content";

export const metadata: Metadata = {
  title: "عن البيرة",
  description:
    "هوية بلدة البيرة – عكار: شعار البلدية وقيمها، تاريخها كمركز لمنطقة الدريب («بيرة الحكم»)، سرايها ومسجدها الأثري، وطبيعتها البازلتية.",
};

// Reads admin-uploaded gallery photos from the database on each request.
export const dynamic = "force-dynamic";

const MAP_URL = "https://maps.app.goo.gl/HJ8JEpovcfEXJt2u6";

const values: Array<[string, string]> = [
  ["الشفافية", "وضوح القرارات والمعلومات أمام الأهالي."],
  ["التنمية", "مشاريع وخدمات تنهض بالبلدة وأهلها."],
  ["المشاركة", "قرارٌ يصنعه أهل البيرة معاً."],
];

const facts: Array<[string, string]> = [
  ["الموقع", "منطقة الدريب – محافظة عكار"],
  ["الارتفاع", "نحو ٥٣٠ متراً عن سطح البحر"],
  ["اللقب التاريخي", "«بيرة الحكم»"],
  ["الطابع العمراني", "حجر بازلتي أسود وأحراج بلوط"],
];

const landmarks: Array<{
  image: string;
  credit?: string;
  title: string;
  period: string;
  body: string;
}> = [
  {
    image: "/village/saray2.jpg",
    credit: "تصوير: عدنان مرعب",
    title: "سرايا البيرة التراثية",
    period: "قلعةٌ من الحجر الأسود، مركز «بيرة الحكم»",
    body: "بناءٌ حجريٌّ مهيب من الحجر البازلتي الأسود، بأقواسٍ وأروقةٍ واسعة. عُرفت بسرايا البيرة، وارتبطت بدور البلدة الإداري والعسكري القديم كمركزٍ لمنطقة الدريب.",
  },
  {
    image: "/village/masjid1.jpg",
    title: "مسجد البيرة الأثري",
    period: "بُني في أواخر القرن التاسع عشر (~١٨٨٢–١٨٨٣م)",
    body: "من أبرز معالم البلدة وأقدم مساجد المنطقة، بُني من الحجارة البركانية السوداء بطرازٍ يجمع الحجر الأسود والأبيض، وتتميّز عمارته بقبّةٍ ومئذنة عند الجهة الشمالية.",
  },
];

const gallery: Array<{ src: string; alt: string; credit?: string }> = [
  {
    src: "/village/masjid-saray.jpg",
    alt: "منظر جوي لمسجد البيرة وسرايها وسط البلدة",
    credit: "تصوير: أيمن مرعب",
  },
  {
    src: "/village/masjid2.jpg",
    alt: "الرواق الداخلي لمسجد البيرة بأقواسه وحجارته",
    credit: "تصوير: عدنان مرعب",
  },
];

const didYouKnow: string[] = [
  "كانت البيرة مركز مديرية الدريب التي ضمّت في إحدى المراحل التاريخية 57 قرية.",
  "عُرفت البلدة تاريخياً باسم «بيرة الحكم» بسبب دورها الإداري والقضائي.",
  "يُعدّ مسجد البيرة من أقدم مساجد المنطقة، ويحمل نقشاً يؤرّخ بناءه إلى أواخر القرن التاسع عشر.",
  "شُيّدت السرايا والمسجد من الحجر البركاني الأسود المنتشر في هضبة عكار.",
  "غدت البيرة في العهد العثماني مركزاً لناحية الدريب، ثم مركز مديريتها في فترة الانتداب.",
  "صنّفت دراسة نباتية البيرة ضمن المواقع ذات الغطاء الشجري الكثيف في الدريب.",
];

const crops = [
  "الزيتون",
  "اللوز",
  "التين",
  "الرمان",
  "الجوز",
  "العنب",
  "الصنوبر",
  "الزعتر البري",
  "الهليون",
];

export default async function AboutPage() {
  const adminPhotos = await getGalleryImages();
  const galleryPhotos: GalleryPhoto[] = [
    ...gallery.map((photo) => ({
      src: photo.src,
      alt: photo.alt,
      credit: photo.credit,
    })),
    ...adminPhotos.map((photo) => ({
      src: photo.url,
      alt: photo.alt || "صورة من البيرة",
    })),
  ];

  return (
    <PageShell>
      <section
        className="identity-hero"
        style={{ backgroundImage: "url('/village/masjid-saray.jpg')" }}
      >
        <div className="identity-hero__overlay" />
        <div className="container identity-hero__inner">
          <p className="eyebrow eyebrow--light">بلدية البيرة – عكار</p>
          <h1>معاً… نبني ونزدهر</h1>
          <p className="identity-hero__lead">
            رؤيةٌ تقوم على الشفافية والتنمية والمشاركة، وهويةٌ متجذّرة في تاريخ
            البيرة وطبيعتها العكاريّة الأصيلة.
          </p>
          <div className="value-chips">
            {values.map(([title]) => (
              <span className="value-chip" key={title}>
                {title}
              </span>
            ))}
          </div>
          <span className="identity-hero__credit">تصوير: أيمن مرعب</span>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="values-grid">
            {values.map(([title, body]) => (
              <div className="value-card" key={title}>
                <strong>{title}</strong>
                <span>{body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">هوية البلدة</p>
            <h2>البيرة… تاريخٌ متجذّر وطبيعةٌ عكاريّة أصيلة</h2>
          </div>
          <div className="about-prose">
            <p>
              تقع بلدة البيرة في قلب منطقة الدريب في محافظة عكار، على ارتفاع
              يقارب ٥٣٠ متراً عن سطح البحر، حيث تلتقي الطبيعة الخضراء بالمناخ
              المعتدل والعمارة المبنيّة من الحجر البازلتي الأسود. عُرفت البيرة
              تاريخياً باسم «بيرة الحكم» بعدما شكّلت مركزاً إدارياً لمنطقة الدريب
              والقرى المحيطة بها، وما تزال سرايها التاريخية ومسجدها الأثري
              شاهدَين على هذا الدور، إلى جانب أحراج البلوط والأراضي الزراعية التي
              تمنح البلدة هويتها الطبيعية والريفية المميّزة.
            </p>
          </div>
          <div className="about-facts">
            {facts.map(([label, value]) => (
              <div className="about-fact" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">معالم البلدة</p>
            <h2>شواهد من حجر البيرة الأسود</h2>
          </div>
          <div className="cards-grid cards-grid--two">
            {landmarks.map((item) => (
              <article className="landmark-card" key={item.title}>
                <figure className="landmark-card__visual">
                  <img src={item.image} alt={item.title} loading="lazy" />
                  {item.credit ? <figcaption>{item.credit}</figcaption> : null}
                </figure>
                <div className="landmark-card__body">
                  <h3>{item.title}</h3>
                  <p className="landmark-card__period">{item.period}</p>
                  <p>{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">قصة مكان</p>
            <h2>سرايا البيرة… شاهدٌ على حكم عكار</h2>
          </div>
          <figure className="about-figure about-figure--wide">
            <img
              src="/village/saray3.jpg"
              alt="جدران وأقواس سرايا البيرة التاريخية"
              loading="lazy"
            />
            <figcaption>سرايا البيرة التراثية، من معالم «بيرة الحكم».</figcaption>
          </figure>
          <div className="about-prose">
            <p>
              تقف سرايا البيرة شامخةً في قلب عكار، لا كقلعةٍ حجريةٍ فحسب، بل
              كشهادةٍ على قرونٍ من الحكم والتاريخ. تشير الروايات المحلية إلى
              نشأتها القديمة، وقد بُنيت من الحجر الأسود القوي لتكون مركزاً
              إدارياً وعسكرياً يتحكّم بسهل عكار والمناطق المحيطة به.
            </p>
            <p>
              لم تكن البيرة بلدةً حديثة، بل من أقدم المراكز السياسية والإدارية في
              عكار، ويؤكّد ذلك مسجدها التاريخي الذي يُعدّ من أقدم مساجد المنطقة.
              وفي العهد العثماني ازدادت مكانة البلدة كمركزٍ لناحية الدريب، ثم
              غدت في فترة الانتداب الفرنسي مركز مديرية الدريب التي ضمّت عشرات
              القرى.
            </p>
            <p>
              تتألّف السرايا من قلعةٍ رئيسية ومسجدٍ كبير ومرافق كانت جزءاً من
              الحياة اليومية، وقد عُرفت باسم «بيرة الحكم» لدورها المحوري في
              السيطرة على مساحةٍ واسعة من المنطقة. وتبقى اليوم رمزاً حيّاً لتاريخ
              عكار العريق، وذاكرةً تنادي كلّ من يحبّ أن يعرف أصالة هذه الأرض
              وقصصها العتيقة.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading section-heading--compact">
            <p className="eyebrow">صور من البيرة</p>
            <h2>معرض الصور</h2>
          </div>
          <VillageGallery photos={galleryPhotos} />
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">الطبيعة والبيئة</p>
            <h2>طبيعة البيرة وتنوّعها البيئي</h2>
          </div>
          <div className="about-prose">
            <p>
              تمتدّ البيرة فوق هضبةٍ بازلتية في عكار، وصنّفتها دراسةٌ علميةٌ
              للغطاء النباتي ضمن المواقع ذات الكثافة الشجرية المرتفعة في الدريب.
              سجّلت الدراسة في مواقع البلدة تجمّعات من أنواع البلوط ضمن تكويناتٍ
              حرجيةٍ مفتوحة تمنح البلدة غطاءً أخضر متجدّداً على مدار الفصول، وهو
              ما يفتح المجال لمسارات المشي والتعرّف إلى الأحراج، مع أهمية حمايتها
              من الحرائق والتعدّي.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">من أرض البيرة</p>
            <h2>زراعاتٌ ومنتجاتٌ محلية</h2>
          </div>
          <p className="about-note">
            القائمة التالية أوليّة وتُثبَّت رسمياً بالتعاون مع البلدية والمزارعين
            قبل اعتمادها كقائمة منتجاتٍ نهائية للبلدة.
          </p>
          <ul className="crop-list">
            {crops.map((crop) => (
              <li key={crop}>{crop}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <div className="section-heading section-heading--compact">
            <p className="eyebrow eyebrow--light">هل تعلم؟</p>
            <h2>لمحات سريعة عن البيرة</h2>
          </div>
          <div className="dyk-grid">
            {didYouKnow.map((fact, index) => (
              <div className="dyk-card" key={index}>
                <span className="dyk-card__mark">؟</span>
                <p>{fact}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container about-location">
          <div className="section-heading section-heading--compact">
            <p className="eyebrow">الموقع الجغرافي</p>
            <h2>البيرة على الخريطة</h2>
          </div>
          <p>البيرة – الدريب – محافظة عكار، شمال لبنان.</p>
          <a
            className="button button--primary"
            href={MAP_URL}
            target="_blank"
            rel="noreferrer"
          >
            فتح الموقع على خرائط Google
          </a>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="about-sources">
            المحتوى التاريخي والطبيعي قيد التوثيق بالتعاون مع البلدية، وتُضاف
            المصادر والصور الرسمية والشهادات المحلية تباعاً. الصور مقدَّمة من
            مصوّرين من أبناء البلدة، ونشكرهم على مشاركتها. لأي تصحيح أو إضافة
            يمكن التواصل عبر <Link href="/contact">صفحة التواصل</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
