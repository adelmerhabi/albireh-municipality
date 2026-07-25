import type { Metadata } from "next";
import { PageShell } from "../../components/PageShell";
import { DocumentRequestForm } from "./DocumentRequestForm";

export const metadata: Metadata = {
  title: "طلب معاملة",
  description:
    "اطلب معاملاتك من بلدية البيرة إلكترونياً — إخراج قيد، إفادة سكن، تصديق وغيرها — واحصل على رقم متابعة.",
};

const steps: Array<[string, string]> = [
  ["١", "املأ الطلب واختر نوع المعاملة."],
  ["٢", "تصلك رسالة برقم متابعة فور الإرسال."],
  ["٣", "تجهّز البلدية المعاملة وتتواصل معك."],
  ["٤", "تستلمها من مبنى البلدية مع إثبات هويتك."],
];

export default function DocumentsPage() {
  return (
    <PageShell>
      <section className="page-hero request-page-hero">
        <div className="container page-hero__inner">
          <p className="eyebrow">خدمات إلكترونية</p>
          <h1>طلب معاملة</h1>
          <p>
            وفّر وقتك: قدّم طلب معاملتك إلى بلدية البيرة من هنا، واحصل على رقم
            متابعة، ثم استلمها من البلدية عند جهوزها.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container request-page-layout">
          <div className="request-form-card">
            <div className="request-form-card__head">
              <h2>تفاصيل الطلب</h2>
              <p>الحقول الأساسية فقط — والبلدية تتولى الباقي.</p>
            </div>
            <DocumentRequestForm />
          </div>

          <aside className="request-guidance">
            <h3>كيف تعمل الخدمة؟</h3>
            <ol className="steps-list">
              {steps.map(([num, text]) => (
                <li key={num}>
                  <span className="steps-list__num">{num}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <div className="request-guidance__note">
              هذه الخدمة لتسهيل تقديم الطلب فقط؛ يبقى استلام المعاملة من مبنى
              البلدية مع إبراز الهوية. الرسوم الرسمية (إن وُجدت) تُدفع عند
              الاستلام.
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
