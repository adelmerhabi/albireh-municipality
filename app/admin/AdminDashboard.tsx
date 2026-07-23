"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { contentItems } from "../../db/schema";
import type {
  AdminResidentRequest,
  ResidentRequestStatus,
} from "../lib/requests";

type AdminItem = typeof contentItems.$inferSelect;
type ContentFormType = "announcement" | "event" | "project" | "donation";

const contentTypes: Array<[ContentFormType, string]> = [
  ["announcement", "إعلان"],
  ["event", "فعالية"],
  ["project", "مشروع"],
  ["donation", "حملة مساعدة"],
];

const statusLabels: Record<string, string> = {
  published: "منشور",
  draft: "مسودة",
  archived: "مؤرشف",
};

export function AdminDashboard({
  initialItems,
  initialRequests,
}: {
  initialItems: AdminItem[];
  initialRequests: AdminResidentRequest[];
}) {
  const [items, setItems] = useState(initialItems);
  const [requests, setRequests] = useState(initialRequests);
  const [selectedType, setSelectedType] =
    useState<ContentFormType>("announcement");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const stats = useMemo(
    () => ({
      published: items.filter((item) => item.status === "published").length,
      draft: items.filter((item) => item.status === "draft").length,
      archived: items.filter((item) => item.status === "archived").length,
      newRequests: requests.filter((request) => request.status === "new").length,
    }),
    [items, requests],
  );

  async function submitContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      const files = data
        .getAll("media")
        .filter((value): value is File => value instanceof File && value.size > 0);
      if (files.length > 12) {
        throw new Error("يمكن رفع 12 صورة أو ملفاً كحد أقصى لكل مادة.");
      }

      const attachments: Array<{
        key: string;
        filename: string;
        mimeType: string;
        altText: string;
      }> = [];

      for (const [index, file] of files.entries()) {
        setMessage(`جارٍ رفع الملف ${index + 1} من ${files.length}...`);
        const mediaData = new FormData();
        mediaData.set("file", file);
        mediaData.set("alt", String(data.get("coverAlt") || ""));
        const mediaResponse = await fetch("/api/admin/media", {
          method: "POST",
          body: mediaData,
        });
        const mediaResult = (await mediaResponse.json()) as {
          key?: string;
          filename?: string;
          mimeType?: string;
          error?: string;
        };
        if (
          !mediaResponse.ok ||
          !mediaResult.key ||
          !mediaResult.mimeType
        ) {
          throw new Error(mediaResult.error || "تعذّر رفع الملف");
        }
        attachments.push({
          key: mediaResult.key,
          filename: mediaResult.filename || file.name,
          mimeType: mediaResult.mimeType,
          altText: String(data.get("coverAlt") || ""),
        });
      }

      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: data.get("type"),
          title: data.get("title"),
          excerpt: data.get("excerpt"),
          body: data.get("body"),
          status: data.get("status"),
          category: data.get("category"),
          location: data.get("location"),
          startsAt: data.get("startsAt"),
          endsAt: data.get("endsAt"),
          wishNumber: data.get("wishNumber"),
          wishRecipient: data.get("wishRecipient"),
          donationTarget: data.get("donationTarget"),
          coverAlt: data.get("coverAlt"),
          attachments,
        }),
      });
      const result = (await response.json()) as {
        item?: AdminItem;
        error?: string;
      };
      if (!response.ok || !result.item) {
        throw new Error(result.error || "تعذّر حفظ المحتوى");
      }

      setItems((current) => [result.item!, ...current]);
      form.reset();
      setSelectedType("announcement");
      setMessage(
        result.item.status === "published"
          ? "تمّ نشر المحتوى بنجاح."
          : "تمّ حفظ المسودة بنجاح.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(
    id: number,
    status: "published" | "draft" | "archived",
  ) {
    if (
      status === "archived" &&
      !window.confirm(
        "ستُزال المادة عن الموقع العام وتبقى محفوظة في سجل الإدارة. هل نتابع؟",
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/content/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as {
        item?: AdminItem;
        error?: string;
      };
      if (!response.ok || !result.item) {
        throw new Error(result.error || "تعذّرت الأرشفة");
      }
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status } : item,
        ),
      );
      setMessage(
        status === "published"
          ? "تمّ نشر المادة وأصبحت ظاهرة على الموقع."
          : status === "archived"
            ? "أُزيلت المادة عن الموقع وبقيت محفوظة في السجل."
            : "عادت المادة إلى المسودات.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  async function changeRequestStatus(
    id: number,
    status: ResidentRequestStatus,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "تعذّر تحديث الرسالة");
      }
      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? {
                ...request,
                status,
                updatedAt: new Date().toISOString(),
              }
            : request,
        ),
      );
      setMessage("تمّ تحديث حالة الرسالة.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat">
          <small>المواد المنشورة</small>
          <strong>{stats.published}</strong>
        </div>
        <div className="admin-stat">
          <small>المسودات</small>
          <strong>{stats.draft}</strong>
        </div>
        <div className="admin-stat">
          <small>المؤرشف</small>
          <strong>{stats.archived}</strong>
        </div>
        <div className="admin-stat admin-stat--attention">
          <small>رسائل جديدة من الأهالي</small>
          <strong>{stats.newRequests}</strong>
        </div>
      </div>

      <div className="admin-layout">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>إضافة محتوى</h2>
            <p>الحقول الواضحة فقط، والتصميم يتولى الباقي.</p>
          </div>
          <form className="admin-form" onSubmit={submitContent}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="type">نوع المحتوى</label>
                <select
                  className="form-control"
                  id="type"
                  name="type"
                  value={selectedType}
                  onChange={(event) =>
                    setSelectedType(event.target.value as ContentFormType)
                  }
                >
                  {contentTypes.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="status">الحالة</label>
                <select className="form-control" id="status" name="status">
                  <option value="draft">حفظ كمسودة</option>
                  <option value="published">نشر مباشرة</option>
                </select>
              </div>
            </div>

            <div className={`content-type-guide content-type-guide--${selectedType}`}>
              <strong>{contentTypeGuide(selectedType).title}</strong>
              <span>{contentTypeGuide(selectedType).description}</span>
            </div>

            <div className="field">
              <label htmlFor="title">العنوان</label>
              <input
                className="form-control"
                id="title"
                name="title"
                maxLength={160}
                placeholder={contentTypeGuide(selectedType).titlePlaceholder}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="excerpt">ملخص قصير</label>
              <textarea
                className="form-control"
                id="excerpt"
                name="excerpt"
                maxLength={320}
                placeholder={contentTypeGuide(selectedType).excerptPlaceholder}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="body">التفاصيل</label>
              <textarea className="form-control" id="body" name="body" />
            </div>

            {selectedType === "announcement" ? (
              <div className="content-type-fields">
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="category">تصنيف الإعلان (اختياري)</label>
                    <input
                      className="form-control"
                      id="category"
                      name="category"
                      placeholder="خبر، تنبيه، تعميم..."
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="location">المكان (اختياري)</label>
                    <input
                      className="form-control"
                      id="location"
                      name="location"
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="endsAt">يبقى الإعلان ظاهراً حتى (اختياري)</label>
                  <input
                    className="form-control"
                    id="endsAt"
                    name="endsAt"
                    type="datetime-local"
                  />
                </div>
              </div>
            ) : null}

            {selectedType === "event" ? (
              <div className="content-type-fields">
                <div className="field">
                  <label htmlFor="location">مكان الفعالية</label>
                  <input
                    className="form-control"
                    id="location"
                    name="location"
                    placeholder="مثلاً: الساحة العامة"
                    required
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="startsAt">موعد البداية</label>
                    <input
                      className="form-control"
                      id="startsAt"
                      name="startsAt"
                      type="datetime-local"
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="endsAt">موعد الانتهاء (اختياري)</label>
                    <input
                      className="form-control"
                      id="endsAt"
                      name="endsAt"
                      type="datetime-local"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {selectedType === "project" ? (
              <div className="content-type-fields">
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="category">حالة المشروع</label>
                    <select
                      className="form-control"
                      id="category"
                      name="category"
                      required
                    >
                      <option value="مخطط له">مخطط له</option>
                      <option value="قيد التنفيذ">قيد التنفيذ</option>
                      <option value="متوقف مؤقتاً">متوقف مؤقتاً</option>
                      <option value="مكتمل">مكتمل</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="location">مكان المشروع</label>
                    <input
                      className="form-control"
                      id="location"
                      name="location"
                    />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="startsAt">تاريخ بدء العمل (اختياري)</label>
                    <input
                      className="form-control"
                      id="startsAt"
                      name="startsAt"
                      type="datetime-local"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="endsAt">تاريخ الإنجاز (متوقع أو فعلي)</label>
                    <input
                      className="form-control"
                      id="endsAt"
                      name="endsAt"
                      type="datetime-local"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {selectedType === "donation" ? (
              <div className="content-type-fields donation-admin-fields">
                <div className="wish-admin-mark">
                  <img src="/wish-money-logo.png" alt="Wish Money" />
                  <span>بيانات التحويل الخاصة بهذه الحملة</span>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="wishNumber">رقم Wish</label>
                    <input
                      className="form-control"
                      id="wishNumber"
                      name="wishNumber"
                      inputMode="tel"
                      dir="ltr"
                      placeholder="+961 ..."
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="wishRecipient">اسم صاحب الحساب</label>
                    <input
                      className="form-control"
                      id="wishRecipient"
                      name="wishRecipient"
                      placeholder="الاسم كما يظهر في Wish"
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="donationTarget">هدف الحملة أو المبلغ المطلوب</label>
                  <input
                    className="form-control"
                    id="donationTarget"
                    name="donationTarget"
                    placeholder="مثلاً: مساعدة 20 عائلة أو جمع 5,000 دولار"
                  />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="startsAt">تاريخ بدء الحملة (اختياري)</label>
                    <input
                      className="form-control"
                      id="startsAt"
                      name="startsAt"
                      type="datetime-local"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="endsAt">تاريخ انتهاء الحملة (اختياري)</label>
                    <input
                      className="form-control"
                      id="endsAt"
                      name="endsAt"
                      type="datetime-local"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="media">صور وملفات مرفقة</label>
              <input
                className="form-control"
                id="media"
                name="media"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
              />
              <small className="field-help">
                يمكنك اختيار عدة صور وملفات معاً، حتى 12 مرفقاً. ستظهر الصور
                كمعرض يمكن للزائر التنقّل داخله.
              </small>
            </div>

            <div className="field">
              <label htmlFor="coverAlt">وصف الصورة</label>
              <input
                className="form-control"
                id="coverAlt"
                name="coverAlt"
                placeholder="مثلاً: أعمال صيانة الطريق"
              />
            </div>

            {message ? <div className="form-message">{message}</div> : null}

            <button
              className="button button--primary"
              type="submit"
              disabled={busy}
            >
              {busy ? "لحظة..." : "حفظ المحتوى"}
            </button>
          </form>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>المحتوى المحفوظ</h2>
            <p>الأرشفة تُخفي المادة عن الجمهور وتحافظ عليها في السجل.</p>
          </div>
          <div className="content-list">
            {items.length ? (
              items.map((item) => (
                <div className="content-list__item" key={item.id}>
                  <div>
                    <small>
                      {contentTypes.find(([value]) => value === item.type)?.[1] ||
                        item.type}
                    </small>
                    <strong>{item.title}</strong>
                    <span
                      className={`admin-status admin-status--${item.status}`}
                    >
                      {item.status === "archived"
                        ? "مزال عن الموقع — محفوظ في السجل"
                        : statusLabels[item.status] || item.status}
                    </span>
                    <span>
                      آخر تحديث{" "}
                      {new Intl.DateTimeFormat("ar-LB").format(
                        new Date(item.updatedAt),
                      )}
                    </span>
                  </div>
                  <div className="content-list__actions">
                  {item.status === "published" ? (
                    <button
                      className="danger-button"
                      type="button"
                      disabled={busy}
                      onClick={() => changeStatus(item.id, "archived")}
                    >
                      إزالة عن الموقع
                    </button>
                  ) : (
                    <button
                      className="publish-button"
                      type="button"
                      disabled={busy}
                      onClick={() => changeStatus(item.id, "published")}
                    >
                      {item.status === "archived" ? "إعادة النشر" : "نشر"}
                    </button>
                  )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state" style={{ marginBlock: 22 }}>
                لا يوجد محتوى محفوظ بعد. ابدأ بإضافة أول إعلان أو مشروع.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="admin-panel resident-inbox">
        <div className="admin-panel__head resident-inbox__head">
          <div>
            <h2>رسائل الأهالي</h2>
            <p>
              الشكاوى والطلبات والاقتراحات خاصة بموظفي البلدية ولا تظهر على
              الموقع العام.
            </p>
          </div>
          <span>{requests.length} رسالة</span>
        </div>
        <div className="resident-request-list">
          {requests.length ? (
            requests.map((request) => (
              <article className="resident-request-card" key={request.id}>
                <div className="resident-request-card__top">
                  <div>
                    <small>{requestKindLabel(request.kind)}</small>
                    <strong>{request.referenceCode}</strong>
                  </div>
                  <span
                    className={`request-status request-status--${request.status}`}
                  >
                    {requestStatusLabel(request.status)}
                  </span>
                </div>
                <p>{request.message}</p>
                <dl className="resident-request-card__meta">
                  {request.location ? (
                    <>
                      <dt>المكان</dt>
                      <dd>{request.location}</dd>
                    </>
                  ) : null}
                  {request.name ? (
                    <>
                      <dt>الاسم</dt>
                      <dd>{request.name}</dd>
                    </>
                  ) : null}
                  {request.phone ? (
                    <>
                      <dt>الهاتف</dt>
                      <dd>
                        <a href={`tel:${request.phone}`}>{request.phone}</a>
                      </dd>
                    </>
                  ) : null}
                  <dt>تاريخ الإرسال</dt>
                  <dd>
                    {new Intl.DateTimeFormat("ar-LB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(request.createdAt))}
                  </dd>
                </dl>
                {request.attachments.length ? (
                  <div className="resident-request-card__photos">
                    {request.attachments.map((attachment) => (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        key={attachment.id}
                      >
                        <img
                          src={attachment.url}
                          alt={`صورة مرفقة بالرسالة ${request.referenceCode}`}
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
                <div className="resident-request-card__actions">
                  {request.status !== "in_review" ? (
                    <button
                      className="publish-button"
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        changeRequestStatus(request.id, "in_review")
                      }
                    >
                      قيد المتابعة
                    </button>
                  ) : null}
                  {request.status !== "resolved" ? (
                    <button
                      className="publish-button"
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        changeRequestStatus(request.id, "resolved")
                      }
                    >
                      تمّت المعالجة
                    </button>
                  ) : null}
                  {request.status !== "archived" ? (
                    <button
                      className="danger-button"
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        changeRequestStatus(request.id, "archived")
                      }
                    >
                      أرشفة
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state" style={{ margin: 22 }}>
              لا توجد رسائل من الأهالي بعد.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function contentTypeGuide(type: ContentFormType) {
  if (type === "event") {
    return {
      title: "فعالية أو مناسبة",
      description:
        "أضف الموعد والمكان بوضوح ليظهر للزائر كدعوة مرتبة وسهلة القراءة.",
      titlePlaceholder: "مثلاً: لقاء أهالي البلدة",
      excerptPlaceholder: "ما هي الفعالية ولمن هي؟",
    };
  }
  if (type === "project") {
    return {
      title: "مشروع بلدي",
      description:
        "حدّد حالة المشروع ومكانه وتواريخه، ويمكن تحديث الحالة لاحقاً عند تقدّم العمل.",
      titlePlaceholder: "مثلاً: تأهيل الطريق الرئيسي",
      excerptPlaceholder: "ما هدف المشروع وما الذي يشمله؟",
    };
  }
  if (type === "donation") {
    return {
      title: "حملة مساعدة",
      description:
        "أدخل رقم Wish المعتمد لهذه الحملة واسم صاحب الحساب حتى يعرف الزائر أين يحوّل بأمان.",
      titlePlaceholder: "مثلاً: حملة دعم العائلات المحتاجة",
      excerptPlaceholder: "لمن الحملة وما نوع المساعدة المطلوبة؟",
    };
  }
  return {
    title: "إعلان أو خبر",
    description:
      "استخدم هذا النوع للأخبار، التنبيهات، التعاميم والمعلومات العامة التي تنشرها البلدية.",
    titlePlaceholder: "مثلاً: بدء أعمال صيانة الطريق",
    excerptPlaceholder: "اكتب أهم معلومة باختصار...",
  };
}

function requestKindLabel(kind: string) {
  if (kind === "complaint") return "شكوى أو مشكلة";
  if (kind === "suggestion") return "اقتراح أو ملاحظة";
  return "طلب من البلدية";
}

function requestStatusLabel(status: string) {
  if (status === "in_review") return "قيد المتابعة";
  if (status === "resolved") return "تمّت المعالجة";
  if (status === "archived") return "مؤرشفة";
  return "جديدة";
}
