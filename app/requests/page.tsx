import type { Metadata } from "next";
import { PageShell } from "../components/PageShell";
import { ResidentRequestForm } from "./ResidentRequestForm";

export const metadata: Metadata = {
  title: "أرسل طلباً أو شكوى",
  description:
    "إرسال طلب أو شكوى أو اقتراح خاص إلى بلدية البيرة مع إمكانية إرفاق صور.",
};

export default function RequestsPage() {
  return (
    <PageShell>
      <section className="page-hero request-page-hero">
        <div className="container page-hero__inner">
          <p className="eyebrow">صوتك يوصل</p>
          <h1>أرسل طلباً أو شكوى</h1>
          <p>
            اشرح الموضوع، حدّد المكان وأرفق صورة إن وجدت. تصل الرسالة مباشرة
            إلى صندوق البلدية الخاص ولا تظهر للزوار.
          </p>
        </div>
      </section>
      <section className="section section--paper">
        <div className="container request-page-layout">
          <div className="request-form-card">
            <div className="request-form-card__head">
              <span>رسالة خاصة</span>
              <h2>كيف يمكن للبلدية مساعدتك؟</h2>
              <p>لا تحتاج إلى إنشاء حساب أو تسجيل الدخول.</p>
            </div>
            <ResidentRequestForm />
          </div>
          <aside className="request-guidance">
            <strong>لرسالة أوضح وأسرع</strong>
            <ol>
              <li>اكتب مكان المشكلة بشكل دقيق.</li>
              <li>اشرح ما حدث وما المطلوب من البلدية.</li>
              <li>أرفق صورة واضحة إذا كانت مفيدة.</li>
            </ol>
            <p>
              الحالات التي تشكّل خطراً فورياً يجب الإبلاغ عنها هاتفياً عبر
              أرقام الطوارئ بعد اعتمادها، وليس عبر هذا النموذج فقط.
            </p>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
