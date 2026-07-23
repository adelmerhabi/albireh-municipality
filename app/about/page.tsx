import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "../components/PageShell";

export const metadata: Metadata = {
  title: "عن البيرة",
  description:
    "هوية بلدة البيرة – عكار: تاريخها كمركز لمنطقة الدريب («بيرة الحكم»)، سرايها ومسجدها الأثري، وطبيعتها البازلتية وأحراج البلوط.",
};

const MAP_URL = "https://maps.app.goo.gl/HJ8JEpovcfEXJt2u6";

const facts: Array<[string, string]> = [
  ["الموقع", "منطقة الدريب – محافظة عكار"],
  ["الارتفاع", "نحو ٥٣٠ متراً عن سطح البحر"],
  ["اللقب التاريخي", "«بيرة الحكم»"],
  ["الطابع العمراني", "حجر بازلتي أسود وأحراج بلوط"],
];

const landmarks: Array<{
  mark: string;
  title: string;
  period: string;
  body: string;
}> = [
  {
    mark: "سراي",
    title: "سراي البيرة التراثية",
    period: "تعود إلى نحو عام ١٨٧٠",
    body: "بناءٌ حجريٌّ مهيب من الحجر الأسود، تزيّنه أحزمة وأقواس وإطارات من الحجر الأبيض. عُرفت بسراي آل مرعب، وارتبطت بدور البلدة الإداري القديم كمركز لمنطقة الدريب.",
  },
  {
    mark: "مسجد",
    title: "مسجد البيرة الأثري",
    period: "نقشٌ يؤرّخ بناءه بسنة ١٣٠٠ هـ (~١٨٨٢ م)",
    body: "من أبرز معالم البلدة، بُني من الحجارة البركانية السوداء، وتتميّز عمارته بقبّة ترتكز على قاعدة مثمّنة ومئذنة عند الجهة الشمالية من بيت الصلاة.",
  },
];

const didYouKnow: string[] = [
  "كانت البيرة مركز مديرية الدريب التي ضمّت في إحدى المراحل التاريخية 57 قرية.",
  "عُرفت البلدة تاريخياً باسم «بيرة الحكم» بسبب دورها الإداري والقضائي.",
  "يعود بناء سراي البيرة التراثية إلى نحو عام ١٨٧٠.",
  "يحمل مسجد البيرة نقشاً يؤرّخ بناءه بسنة ١٣٠٠ هـ، الموافقة تقريباً لعام ١٨٨٢ م.",
  "تتميّز عمارة المسجد باستخدام الحجر البركاني الأسود المنتشر في المنطقة.",
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

export default function AboutPage() {
  return (
    <PageShell>
      <section className="page-hero about-hero">
        <div className="container page-hero__inner">
          <p className="eyebrow">هوية البلدة</p>
          <h1>البيرة… تاريخٌ متجذّر وطبيعةٌ عكاريّة أصيلة</h1>
          <p>
            تقع بلدة البيرة في قلب منطقة الدريب في محافظة عكار، على ارتفاع
            يقارب ٥٣٠ متراً عن سطح البحر، حيث تلتقي الطبيعة الخضراء بالمناخ
            المعتدل والعمارة المبنيّة من الحجر البازلتي الأسود. عُرفت البيرة
            تاريخياً باسم «بيرة الحكم» بعدما شكّلت مركزاً إدارياً لمنطقة الدريب
            والقرى المحيطة بها، وما تزال سرايها التاريخية ومسجدها الأثري شاهدَين
            على هذا الدور، إلى جانب أحراج البلوط والأراضي الزراعية التي تمنح
            البلدة هويتها الطبيعية والريفية المميّزة.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-facts">
            {facts.map(([label, value]) => (
              <div className="about-fact" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <figure className="about-figure">
            <img src="/municipality-source.jpg" alt="من معالم بلدة البيرة – عكار" />
            <figcaption>معلم من معالم البيرة العريقة.</figcaption>
          </figure>
        </div>
      </section>

      <section className="section section--paper">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">التاريخ والدور الإداري</p>
            <h2>مركز الدريب وموطن «بيرة الحكم»</h2>
          </div>
          <div className="about-prose">
            <p>
              لم تكن البيرة مجرّد قرية زراعية، بل مركزاً إدارياً لمنطقة الدريب.
              تُظهر الدراسات التاريخية أنه في عشرينيات القرن الماضي وُجدت
              «مديرية البيرة»، ثم أصبحت البلدة مركز «مديرية الدريب» التي كانت
              تتبع لها 57 قرية. من هذا الدور الإداري والقضائي ارتبط بالبلدة
              اسمها التاريخي: «بيرة الحكم».
            </p>
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
                <div className="landmark-card__visual" aria-hidden="true">
                  <span>{item.mark}</span>
                </div>
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
            <p className="eyebrow">الطبيعة والبيئة</p>
            <h2>طبيعة البيرة وتنوّعها البيئي</h2>
          </div>
          <div className="about-prose">
            <p>
              تمتدّ البيرة فوق هضبة بازلتية في عكار، وصنّفتها دراسة علمية للغطاء
              النباتي ضمن المواقع ذات الكثافة الشجرية المرتفعة في الدريب. سجّلت
              الدراسة في مواقع البلدة تجمّعات من أنواع البلوط — منها بلوط إيثابور
              وبلوط العفص — ضمن تكوينات حرجية مفتوحة تمنح البلدة غطاءً أخضر
              متجدّداً على مدار الفصول. هذه الطبيعة تفتح المجال لمسارات المشي
              والتعرّف إلى الأحراج، مع أهمية حمايتها من الحرائق والتعدّي.
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
            قبل اعتمادها كقائمة منتجات نهائية للبلدة.
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
            المصادر والصور الرسمية والشهادات المحلية تباعاً. لأي تصحيح أو إضافة
            يمكن التواصل عبر{" "}
            <Link href="/contact">صفحة التواصل</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
