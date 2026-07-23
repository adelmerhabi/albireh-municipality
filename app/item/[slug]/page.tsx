import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaGallery } from "../../components/MediaGallery";
import { PageShell } from "../../components/PageShell";
import { getContentBySlug } from "../../lib/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getContentBySlug(slug);
  return item
    ? { title: item.title, description: item.excerpt }
    : { title: "المادة غير موجودة" };
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getContentBySlug(slug);
  if (!item) notFound();
  const attachmentImages = item.attachments
    .filter((attachment) => attachment.kind === "image")
    .map((attachment) => ({
      url: attachment.url,
      filename: attachment.filename,
      altText: attachment.altText,
    }));
  const images =
    attachmentImages.length > 0
      ? attachmentImages
      : item.coverUrl
        ? [
            {
              url: item.coverUrl,
              filename: item.title,
              altText: item.coverAlt,
            },
          ]
        : [];
  const files = item.attachments.filter(
    (attachment) => attachment.kind === "file",
  );

  return (
    <PageShell>
      <article>
        <header className="detail-hero">
          <div className="container detail-hero__grid">
            <div>
              <Link className="detail-back" href={item.sectionHref}>
                الرجوع إلى {item.typeLabel} ←
              </Link>
              <p className="eyebrow">{item.typeLabel}</p>
              <h1>{item.title}</h1>
              <p className="detail-lead">{item.excerpt}</p>
              <div className="detail-meta">
                {item.type === "event" && item.startsAtLabel ? (
                  <span>الموعد: {item.startsAtLabel}</span>
                ) : (
                  <span>نُشر في {item.displayDate}</span>
                )}
                {item.location ? <span>المكان: {item.location}</span> : null}
                {item.category ? <span>{item.category}</span> : null}
                {item.endsAtLabel ? (
                  <span>
                    {item.type === "event"
                      ? `ينتهي: ${item.endsAtLabel}`
                      : item.type === "donation"
                        ? `الحملة حتى: ${item.endsAtLabel}`
                        : item.type === "project"
                          ? `تاريخ الإنجاز: ${item.endsAtLabel}`
                          : `متاح حتى: ${item.endsAtLabel}`}
                  </span>
                ) : null}
              </div>
            </div>
            <MediaGallery
              images={images}
              fallbackMark={item.visualMark}
              title={item.title}
            />
          </div>
        </header>
        <section className="section">
          <div className="container detail-layout">
            <div className="detail-body">
              {item.body
                .split(/\n+/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              {!item.body ? <p>{item.excerpt}</p> : null}
              {item.type === "donation" && item.wishNumber ? (
                <section className="wish-payment-card" aria-label="معلومات التحويل عبر Wish Money">
                  <div className="wish-payment-card__brand">
                    <img src="/wish-money-logo.png" alt="Wish Money" />
                    <span>معلومات التحويل الرسمية لهذه الحملة</span>
                  </div>
                  <div className="wish-payment-card__number">
                    <small>رقم Wish</small>
                    <strong>
                      <bdi>{item.wishNumber}</bdi>
                    </strong>
                  </div>
                  {item.wishRecipient ? (
                    <div>
                      <small>اسم المستفيد</small>
                      <strong>{item.wishRecipient}</strong>
                    </div>
                  ) : null}
                  {item.donationTarget ? (
                    <div>
                      <small>هدف الحملة</small>
                      <strong>{item.donationTarget}</strong>
                    </div>
                  ) : null}
                  <p>
                    تأكد من تطابق الرقم والاسم داخل تطبيق Wish قبل تأكيد
                    التحويل. الموقع لا يستقبل الأموال مباشرة.
                  </p>
                </section>
              ) : null}
            </div>
            <aside className="detail-aside">
              <strong>معلومات المادة</strong>
              <span>{item.typeLabel}</span>
              <span>{item.displayDate}</span>
              {item.location ? <span>{item.location}</span> : null}
              {item.startsAtLabel && item.type !== "event" ? (
                <span>البداية: {item.startsAtLabel}</span>
              ) : null}
              {item.endsAtLabel ? <span>النهاية: {item.endsAtLabel}</span> : null}
              {files.length > 0 ? (
                <div className="detail-files">
                  <strong>الملفات المرفقة</strong>
                  {files.map((file) => (
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      key={file.key}
                    >
                      <span>ملف</span>
                      {file.filename}
                    </a>
                  ))}
                </div>
              ) : item.attachmentUrl ? (
                <a
                  className="button button--primary"
                  href={item.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  فتح الملف المرفق
                </a>
              ) : null}
            </aside>
          </div>
        </section>
      </article>
    </PageShell>
  );
}
