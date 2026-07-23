"use client";

import { useState, type FormEvent } from "react";

export function ResidentRequestForm() {
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
    const photos = data
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (photos.length > 3) {
      setError("يمكن إرفاق ثلاث صور كحد أقصى.");
      setBusy(false);
      return;
    }

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        body: data,
      });
      const result = (await response.json()) as {
        referenceCode?: string;
        error?: string;
      };
      if (!response.ok || !result.referenceCode) {
        throw new Error(result.error || "تعذّر إرسال الرسالة");
      }

      setReferenceCode(result.referenceCode);
      form.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "تعذّر إرسال الرسالة",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="resident-request-form" onSubmit={submit}>
      <div className="field-row">
        <div className="field">
          <label htmlFor="request-kind">نوع الرسالة</label>
          <select
            className="form-control"
            id="request-kind"
            name="kind"
            required
          >
            <option value="complaint">شكوى أو مشكلة</option>
            <option value="request">طلب من البلدية</option>
            <option value="suggestion">اقتراح أو ملاحظة</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="request-location">المكان</label>
          <input
            className="form-control"
            id="request-location"
            name="location"
            maxLength={180}
            placeholder="مثلاً: الطريق قرب المدرسة"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="request-message">اشرح المشكلة أو الطلب</label>
        <textarea
          className="form-control"
          id="request-message"
          name="message"
          minLength={10}
          maxLength={4000}
          placeholder="اكتب التفاصيل التي تساعد البلدية على فهم الموضوع..."
          required
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="request-name">الاسم (اختياري)</label>
          <input
            className="form-control"
            id="request-name"
            name="name"
            maxLength={100}
          />
        </div>
        <div className="field">
          <label htmlFor="request-phone">رقم الهاتف (اختياري)</label>
          <input
            className="form-control"
            id="request-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            maxLength={40}
            placeholder="للتواصل معك عند الحاجة"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="request-photos">صور للمشكلة (حتى 3 صور)</label>
        <input
          className="form-control"
          id="request-photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
        />
        <small className="field-help">
          يمكن تصوير حفرة، عطل إنارة، نفايات أو أي مشكلة تساعد الصورة على
          توضيحها. الحد الأقصى 8 MB لكل صورة.
        </small>
      </div>

      <div className="honeypot-field" aria-hidden="true">
        <label htmlFor="request-website">اترك هذا الحقل فارغاً</label>
        <input id="request-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <label className="consent-field">
        <input type="checkbox" required />
        <span>
          أفهم أن الرسالة والصور ستصل إلى موظفي البلدية فقط ولن تُنشر على
          الموقع.
        </span>
      </label>

      {error ? <div className="form-error">{error}</div> : null}
      {referenceCode ? (
        <div className="request-success">
          <strong>وصلت رسالتك إلى البلدية.</strong>
          <span>
            رقم المتابعة: <bdi>{referenceCode}</bdi>
          </span>
        </div>
      ) : null}

      <button className="button button--primary" type="submit" disabled={busy}>
        {busy ? "جارٍ الإرسال..." : "إرسال إلى البلدية"}
      </button>
    </form>
  );
}
