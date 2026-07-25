"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

const certificateTypes = [
  "إخراج قيد إفرادي",
  "إخراج قيد عائلي",
  "إفادة سكن",
  "إفادة إقامة",
  "إفادة عمار / إشغال",
  "تصديق توقيع أو معاملة",
  "إفادة ولادة",
  "إفادة وفاة",
  "طلب رخصة بناء",
  "معاملة أخرى",
];

export function DocumentRequestForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [referenceCode, setReferenceCode] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setReferenceCode("");

    const form = event.currentTarget;
    const data = new FormData(form);
    const type = String(data.get("certificateType") || "").trim();
    const fullName = String(data.get("fullName") || "").trim();
    const details = String(data.get("details") || "").trim();

    // Compose the message the البلدية sees in its inbox.
    const message = [
      `نوع المعاملة: ${type}`,
      `الاسم الكامل: ${fullName}`,
      details ? `تفاصيل إضافية: ${details}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const payload = new FormData();
    payload.set("kind", "document");
    payload.set("name", fullName);
    payload.set("phone", String(data.get("phone") || ""));
    payload.set("message", message);
    payload.set(
      "privacyConsent",
      String(data.get("privacyConsent") || ""),
    );
    for (const photo of data.getAll("photos")) {
      if (photo instanceof File && photo.size > 0) payload.append("photos", photo);
    }

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        body: payload,
      });
      const result = (await response.json()) as {
        referenceCode?: string;
        error?: string;
      };
      if (!response.ok || !result.referenceCode) {
        throw new Error(result.error || "تعذّر إرسال الطلب");
      }
      setReferenceCode(result.referenceCode);
      form.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "تعذّر إرسال الطلب",
      );
    } finally {
      setBusy(false);
    }
  }

  if (referenceCode) {
    return (
      <div className="request-success request-success--lg">
        <strong>تم استلام طلبك بنجاح ✓</strong>
        <p>
          احتفظ برقم المتابعة التالي. ستراجع البلدية الطلب وتتواصل معك لتأكيد
          إمكان تقديم المعاملة والخطوات المطلوبة:
        </p>
        <div className="tracking-code">
          <bdi>{referenceCode}</bdi>
        </div>
        <button
          className="button button--ghost"
          type="button"
          onClick={() => setReferenceCode("")}
        >
          تقديم طلبٍ آخر
        </button>
      </div>
    );
  }

  return (
    <form className="resident-request-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="certificateType">نوع المعاملة المطلوبة</label>
        <select
          className="form-control"
          id="certificateType"
          name="certificateType"
          required
        >
          <option value="">اختر نوع المعاملة…</option>
          {certificateTypes.map((type) => (
            <option value={type} key={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="fullName">الاسم الكامل (كما في سجل النفوس)</label>
          <input
            className="form-control"
            id="fullName"
            name="fullName"
            maxLength={120}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="phone">رقم الهاتف</label>
          <input
            className="form-control"
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            maxLength={40}
            placeholder="ليتم التواصل معك"
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="details">تفاصيل إضافية (اختياري)</label>
        <textarea
          className="form-control"
          id="details"
          name="details"
          maxLength={2000}
          placeholder="رقم السجل، اسم الأب أو الأم، الغرض من المعاملة، أو أي ملاحظة تساعد البلدية…"
        />
      </div>

      <div className="field">
        <label htmlFor="doc-photos">مستندات داعمة (اختياري، حتى 3 صور)</label>
        <input
          className="form-control"
          id="doc-photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
        />
        <small className="field-help">
          مثلاً صورة عن معاملة سابقة. الحد الأقصى 8 MB لكل صورة.
        </small>
      </div>

      <label className="consent-field">
        <input
          type="checkbox"
          name="privacyConsent"
          value="accepted"
          required
        />
        <span>
          قرأت <Link href="/privacy">سياسة الخصوصية</Link> وأوافق على أن تصل بياناتي
          إلى موظفي البلدية لمعالجة هذا الطلب فقط.
        </span>
      </label>

      {error ? <div className="form-error">{error}</div> : null}

      <button className="button button--primary" type="submit" disabled={busy}>
        {busy ? "جارٍ الإرسال…" : "إرسال الطلب"}
      </button>
    </form>
  );
}
