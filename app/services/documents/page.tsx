import type { Metadata } from "next";
import { PageShell } from "../../components/PageShell";
import { DocumentRequestForm } from "./DocumentRequestForm";

export const metadata: Metadata = {
  title: "طلب معاملة أولي",
  description:
    "أرسل طلباً أولياً إلى بلدية البيرة للاستفسار عن معاملة أو البدء بمتابعتها، واحصل على رقم متابعة.",
};

const steps: Array<[string, string]> = [
  ["١", "املأ الطلب واختر المعاملة التي تريد الاستفسار عنها."],
  ["٢", "يظهر لك رقم متابعة فور الإرسال."],
  ["٣", "تراجع البلدية صلاحيتها لتقديم المعاملة والمستندات المطلوبة."],
  ["٤", "يتواصل معك الموظف لتأكيد الخطوات الرسمية التالية."],
];

export default function DocumentsPage() {
  return (
    <PageShell>
      <section className="page-hero request-page-hero">
        <div className="container page-hero__inner">
          <p className="eyebrow">طلب أولي ومتابعة</p>
          <h1>الاستفسار عن معاملة</h1>
          <p>
            أرسل طلباً أولياً إلى بلدية البيرة واحصل على رقم متابعة. يراجع
            الموظف نوع المعاملة ثم يتواصل معك لتأكيد إمكان تقديمها، المستندات
            المطلوبة، الرسوم والمدة المتوقعة.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container request-page-layout">
          <div className="request-form-card">
            <div className="request-form-card__head">
              <h2>تفاصيل الطلب</h2>
              <p>لا يُعدّ إرسال النموذج موافقة نهائية أو إصداراً للمعاملة.</p>
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
              هذه القناة للاستفسار وتسهيل بدء المتابعة فقط. تؤكد البلدية
              رسمياً ما إذا كانت المعاملة من صلاحيتها وما يلزمها من مستندات
              ورسوم قبل أي التزام. لا ترسل صورة هوية كاملة إلا إذا طلبها موظف
              مخوّل عبر قناة رسمية.
            </div>
          </aside>
        </div>
      </section>
    </PageShell>
  );
}
