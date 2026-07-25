import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "./components/PageShell";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
};

export default function NotFound() {
  return (
    <PageShell>
      <section
        className="section"
        style={{ textAlign: "center", paddingBlock: "clamp(70px, 14vw, 120px)" }}
      >
        <div className="container">
          <p className="eyebrow">خطأ 404</p>
          <h1
            style={{
              fontSize: "clamp(32px, 6vw, 56px)",
              color: "var(--green-950)",
              margin: "6px 0 14px",
            }}
          >
            الصفحة غير موجودة
          </h1>
          <p
            style={{
              color: "var(--muted)",
              maxWidth: "46ch",
              margin: "0 auto 28px",
              lineHeight: 1.9,
            }}
          >
            ربّما تغيّر الرابط أو حُذفت الصفحة. يمكنكم العودة إلى الصفحة الرئيسية
            أو تصفّح خدمات البلدية.
          </p>
          <Link className="button button--primary" href="/">
            العودة إلى الرئيسية
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
