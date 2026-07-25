"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { contentItems } from "../../db/schema";
import type { AdminContentDetails } from "../lib/content";
import type {
  AdminResidentRequest as ResidentRequestDetails,
  ResidentRequestStatus,
} from "../lib/requests";
import type { EmployeeUser } from "../lib/admin-users";
import type { PublicSiteSettings } from "../lib/site-settings";

type AdminItem = typeof contentItems.$inferSelect;
type AdminResidentRequest = ResidentRequestDetails;
type ContentFormType =
  | "announcement"
  | "event"
  | "project"
  | "donation"
  | "gallery";

const contentTypes: Array<[ContentFormType, string]> = [
  ["announcement", "إعلان"],
  ["event", "فعالية"],
  ["project", "مشروع"],
  ["donation", "حملة مساعدة"],
  ["gallery", "معرض صور"],
];

const statusLabels: Record<string, string> = {
  published: "منشور",
  draft: "مسودة",
  archived: "مؤرشف",
};

export function AdminDashboard({
  initialItems,
  initialRequests,
  initialEmployees,
  initialSettings,
  canManageUsers,
}: {
  initialItems: AdminItem[];
  initialRequests: AdminResidentRequest[];
  initialEmployees: EmployeeUser[];
  initialSettings: PublicSiteSettings;
  canManageUsers: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [requests, setRequests] = useState(initialRequests);
  const [employees, setEmployees] = useState(initialEmployees);
  const [settings, setSettings] = useState(initialSettings);
  const [editingItem, setEditingItem] =
    useState<AdminContentDetails | null>(null);
  const [selectedType, setSelectedType] =
    useState<ContentFormType>("announcement");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<
    "create" | "content" | "requests" | "settings" | "employees"
  >("create");

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
      const retainedAttachmentIds = data
        .getAll("retainAttachmentId")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0);
      if (files.length + retainedAttachmentIds.length > 12) {
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

      const response = await fetch(
        editingItem
          ? `/api/admin/content/${editingItem.id}`
          : "/api/admin/content",
        {
        method: editingItem ? "PATCH" : "POST",
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
          retainedAttachmentIds,
        }),
      });
      const result = (await response.json()) as {
        item?: AdminItem;
        error?: string;
      };
      if (!response.ok || !result.item) {
        throw new Error(result.error || "تعذّر حفظ المحتوى");
      }

      setItems((current) =>
        editingItem
          ? current.map((item) =>
              item.id === result.item!.id ? result.item! : item,
            )
          : [result.item!, ...current],
      );
      form.reset();
      setSelectedType("announcement");
      const wasEditing = Boolean(editingItem);
      setEditingItem(null);
      setTab("content");
      setMessage(
        wasEditing
          ? "تمّ حفظ تعديلات المادة بنجاح."
          : result.item.status === "published"
            ? "تمّ نشر المحتوى بنجاح."
            : "تمّ حفظ المسودة بنجاح.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  async function editContent(id: number) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/content/${id}`);
      const result = (await response.json()) as {
        item?: AdminContentDetails;
        error?: string;
      };
      if (!response.ok || !result.item) {
        throw new Error(result.error || "تعذّر تحميل المادة للتعديل");
      }
      if (
        !contentTypes.some(([type]) => type === result.item!.type)
      ) {
        throw new Error("هذا النوع القديم من المحتوى لا يمكن تعديله من النموذج الحالي.");
      }
      setEditingItem(result.item);
      setSelectedType(result.item.type as ContentFormType);
      setTab("create");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  function startNewContent() {
    setEditingItem(null);
    setSelectedType("announcement");
    setMessage("");
    setTab("create");
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
          item.id === id ? result.item! : item,
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

  async function deleteRequest(id: number, referenceCode: string) {
    if (
      !window.confirm(
        `حذف الرسالة ${referenceCode} نهائياً سيحذف بياناتها وصورها ولا يمكن التراجع عنه. هل أنت متأكد؟`,
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/requests/${id}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "تعذّر حذف الرسالة");
      }
      setRequests((current) => current.filter((request) => request.id !== id));
      setMessage(`تمّ حذف الرسالة ${referenceCode} ومرفقاتها نهائياً.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  async function submitEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      const password = String(data.get("password") || "");
      const confirmation = String(data.get("passwordConfirmation") || "");
      if (password !== confirmation) {
        throw new Error("كلمتا المرور غير متطابقتين.");
      }
      const username = String(data.get("username") || "").trim().toLowerCase();
      const existing = employees.find((employee) => employee.username === username);
      if (
        existing &&
        !window.confirm(
          "هذا الحساب موجود. سيؤدي الحفظ إلى تفعيله وتعيين كلمة المرور الجديدة. هل نتابع؟",
        )
      ) {
        return;
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username,
          displayName: data.get("displayName"),
          password,
        }),
      });
      const result = (await response.json()) as {
        user?: EmployeeUser;
        error?: string;
      };
      if (!response.ok || !result.user) {
        throw new Error(result.error || "تعذّر حفظ حساب الموظف");
      }

      setEmployees((current) => [
        result.user!,
        ...current.filter((employee) => employee.username !== result.user!.username),
      ]);
      form.reset();
      setMessage("تمّ حفظ حساب الموظف. يمكنه تسجيل الدخول باسم المستخدم وكلمة المرور الجديدين.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  async function changeEmployeeActive(username: string, active: boolean) {
    if (
      !active &&
      !window.confirm(
        "لن يتمكن هذا الموظف من تسجيل الدخول بعد التعطيل. هل نتابع؟",
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(username)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ active }),
        },
      );
      const result = (await response.json()) as {
        user?: EmployeeUser;
        error?: string;
      };
      if (!response.ok || !result.user) {
        throw new Error(result.error || "تعذّر تحديث حساب الموظف");
      }
      setEmployees((current) =>
        current.map((employee) =>
          employee.username === username ? result.user! : employee,
        ),
      );
      setMessage(active ? "تمّ تفعيل حساب الموظف." : "تمّ تعطيل حساب الموظف.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "حدث خطأ غير متوقع");
    } finally {
      setBusy(false);
    }
  }

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const data = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          municipalityPhone: data.get("municipalityPhone"),
          municipalityEmail: data.get("municipalityEmail"),
          municipalityAddress: data.get("municipalityAddress"),
          officeHours: data.get("officeHours"),
          whatsappNumber: data.get("whatsappNumber"),
          mapUrl: data.get("mapUrl"),
        }),
      });
      const result = (await response.json()) as {
        settings?: PublicSiteSettings;
        error?: string;
      };
      if (!response.ok || !result.settings) {
        throw new Error(result.error || "تعذّر حفظ معلومات التواصل");
      }
      setSettings(result.settings);
      setMessage("تمّ حفظ معلومات التواصل وظهرت على الموقع العام.");
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

      <div className="admin-tabs" role="tablist">
        <button
          type="button"
          className={`admin-tab${tab === "create" ? " is-active" : ""}`}
          onClick={startNewContent}
        >
          ＋ إضافة محتوى
        </button>
        <button
          type="button"
          className={`admin-tab${tab === "content" ? " is-active" : ""}`}
          onClick={() => setTab("content")}
        >
          المحتوى المنشور
        </button>
        <button
          type="button"
          className={`admin-tab${tab === "requests" ? " is-active" : ""}`}
          onClick={() => setTab("requests")}
        >
          رسائل الأهالي
          {stats.newRequests > 0 ? (
            <span className="admin-tab__badge">{stats.newRequests}</span>
          ) : null}
        </button>
        <button
          type="button"
          className={`admin-tab${tab === "settings" ? " is-active" : ""}`}
          onClick={() => setTab("settings")}
        >
          معلومات التواصل
        </button>
        {canManageUsers ? (
          <button
            type="button"
            className={`admin-tab${tab === "employees" ? " is-active" : ""}`}
            onClick={() => setTab("employees")}
          >
            حساب الموظف
          </button>
        ) : null}
      </div>

      {message ? <div className="form-message admin-global-message">{message}</div> : null}

      {tab === "create" ? (
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>{editingItem ? "تعديل المحتوى" : "إضافة محتوى"}</h2>
              <p>
                {editingItem
                  ? "عدّل المعلومات أو المرفقات ثم احفظ التغييرات."
                  : "الحقول الواضحة فقط، والتصميم يتولى الباقي."}
              </p>
            </div>
            {editingItem ? (
              <button
                className="button button--ghost"
                type="button"
                onClick={startNewContent}
                disabled={busy}
              >
                إلغاء التعديل
              </button>
            ) : null}
          </div>
          <form
            className="admin-form"
            key={editingItem?.id ?? "new"}
            onSubmit={submitContent}
          >
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
                <select
                  className="form-control"
                  id="status"
                  name="status"
                  defaultValue={editingItem?.status || "draft"}
                >
                  <option value="draft">حفظ كمسودة</option>
                  <option value="published">نشر مباشرة</option>
                  {editingItem?.status === "archived" ? (
                    <option value="archived">إبقاء المادة مؤرشفة</option>
                  ) : null}
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
                defaultValue={editingItem?.title || ""}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="excerpt">
                {selectedType === "gallery" ? "ملخص قصير (اختياري)" : "ملخص قصير"}
              </label>
              <textarea
                className="form-control"
                id="excerpt"
                name="excerpt"
                maxLength={320}
                placeholder={contentTypeGuide(selectedType).excerptPlaceholder}
                defaultValue={editingItem?.excerpt || ""}
                required={selectedType !== "gallery"}
              />
            </div>

            {selectedType !== "gallery" ? (
              <div className="field">
                <label htmlFor="body">التفاصيل</label>
                <textarea
                  className="form-control"
                  id="body"
                  name="body"
                  defaultValue={editingItem?.body || ""}
                />
              </div>
            ) : null}

            {selectedType === "gallery" ? (
              <div className="content-type-fields">
                <p className="field-help">
                  اختر الصور التي تريد إضافتها إلى «معرض الصور» في صفحة «عن
                  البيرة». ستظهر كل الصور المنشورة معاً في المعرض العام. لإضافة
                  المزيد من الصور لاحقاً، أنشئ معرضاً جديداً في أي وقت.
                </p>
              </div>
            ) : null}

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
                      defaultValue={editingItem?.category || ""}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="location">المكان (اختياري)</label>
                    <input
                      className="form-control"
                      id="location"
                      name="location"
                      defaultValue={editingItem?.location || ""}
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
                    defaultValue={formatDateTimeLocal(editingItem?.endsAt)}
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
                    defaultValue={editingItem?.location || ""}
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
                      defaultValue={formatDateTimeLocal(editingItem?.startsAt)}
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
                      defaultValue={formatDateTimeLocal(editingItem?.endsAt)}
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
                      defaultValue={editingItem?.category || "مخطط له"}
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
                      defaultValue={editingItem?.location || ""}
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
                      defaultValue={formatDateTimeLocal(editingItem?.startsAt)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="endsAt">تاريخ الإنجاز (متوقع أو فعلي)</label>
                    <input
                      className="form-control"
                      id="endsAt"
                      name="endsAt"
                      type="datetime-local"
                      defaultValue={formatDateTimeLocal(editingItem?.endsAt)}
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
                      defaultValue={editingItem?.wishNumber || ""}
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
                      defaultValue={editingItem?.wishRecipient || ""}
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
                    defaultValue={editingItem?.donationTarget || ""}
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
                      defaultValue={formatDateTimeLocal(editingItem?.startsAt)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="endsAt">تاريخ انتهاء الحملة (اختياري)</label>
                    <input
                      className="form-control"
                      id="endsAt"
                      name="endsAt"
                      type="datetime-local"
                      defaultValue={formatDateTimeLocal(editingItem?.endsAt)}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {editingItem?.attachments.length ? (
              <div className="field">
                <span className="field-label">المرفقات الحالية</span>
                <div className="admin-attachment-list">
                  {editingItem.attachments.map((attachment) => (
                    <label
                      className="admin-attachment-item"
                      key={attachment.id}
                    >
                      <input
                        type="checkbox"
                        name="retainAttachmentId"
                        value={attachment.id}
                        defaultChecked
                      />
                      {attachment.kind === "image" ? (
                        <img src={attachment.url} alt={attachment.altText || ""} />
                      ) : (
                        <span className="admin-attachment-file" aria-hidden="true">
                          PDF
                        </span>
                      )}
                      <span>
                        <strong>{attachment.filename}</strong>
                        <small>أبقِ علامة الصح للاحتفاظ بالمرفق</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="field">
              <label htmlFor="media">
                {editingItem ? "إضافة صور أو ملفات جديدة" : "صور وملفات مرفقة"}
              </label>
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
                defaultValue={editingItem?.coverAlt || ""}
              />
            </div>

            <button
              className="button button--primary"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "لحظة..."
                : editingItem
                  ? "حفظ التعديلات"
                  : "حفظ المحتوى"}
            </button>
          </form>
        </section>
      ) : null}

      {tab === "content" ? (
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
                  {contentTypes.some(([type]) => type === item.type) ? (
                    <button
                      className="button button--ghost"
                      type="button"
                      disabled={busy}
                      onClick={() => editContent(item.id)}
                    >
                      تعديل
                    </button>
                  ) : null}
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
      ) : null}

      {tab === "requests" ? (
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
                  {request.phone ? (
                    <a
                      className="whatsapp-button"
                      href={whatsappNotifyUrl(request)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      إبلاغ عبر واتساب
                    </a>
                  ) : null}
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
                  <button
                    className="permanent-delete-button"
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      deleteRequest(request.id, request.referenceCode)
                    }
                  >
                    حذف نهائي
                  </button>
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
      ) : null}

      {tab === "employees" && canManageUsers ? (
        <section className="admin-panel employee-management">
          <div className="admin-panel__head">
            <div>
              <h2>حساب الموظف</h2>
              <p>
                يحتفظ مدير النظام بحساب الاسترداد، ويمكن تفعيل حساب موظف واحد
                لإدارة المحتوى اليومي.
              </p>
            </div>
          </div>

          <form className="admin-form employee-form" onSubmit={submitEmployee}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="employeeDisplayName">اسم الموظف الظاهر</label>
                <input
                  className="form-control"
                  id="employeeDisplayName"
                  name="displayName"
                  maxLength={80}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="employeeUsername">اسم المستخدم</label>
                <input
                  className="form-control"
                  id="employeeUsername"
                  name="username"
                  minLength={3}
                  maxLength={40}
                  pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,39}"
                  dir="ltr"
                  autoComplete="username"
                  required
                />
                <small className="field-help">
                  أحرف إنكليزية وأرقام فقط، ويمكن استخدام النقطة أو الشرطة.
                </small>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="employeePassword">كلمة مرور جديدة</label>
                <input
                  className="form-control"
                  id="employeePassword"
                  name="password"
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="employeePasswordConfirmation">
                  تأكيد كلمة المرور
                </label>
                <input
                  className="form-control"
                  id="employeePasswordConfirmation"
                  name="passwordConfirmation"
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
            <small className="field-help">
              إذا أدخلت اسم حساب موجود، ستُستبدل كلمة مروره ويُفعّل من جديد بعد
              تأكيدك.
            </small>
            <button
              className="button button--primary"
              type="submit"
              disabled={busy}
            >
              {busy ? "لحظة..." : "حفظ حساب الموظف"}
            </button>
          </form>

          <div className="employee-list">
            {employees.length ? (
              employees.map((employee) => (
                <article className="employee-card" key={employee.username}>
                  <div>
                    <strong>{employee.displayName}</strong>
                    <span dir="ltr">{employee.username}</span>
                    <small>
                      آخر تحديث{" "}
                      {new Intl.DateTimeFormat("ar-LB").format(
                        new Date(employee.updatedAt),
                      )}
                    </small>
                  </div>
                  <div>
                    <span
                      className={`admin-status admin-status--${
                        employee.active ? "published" : "archived"
                      }`}
                    >
                      {employee.active ? "نشط" : "معطّل"}
                    </span>
                    <button
                      className={
                        employee.active ? "danger-button" : "publish-button"
                      }
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        changeEmployeeActive(
                          employee.username,
                          !employee.active,
                        )
                      }
                    >
                      {employee.active ? "تعطيل الدخول" : "إعادة التفعيل"}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state" style={{ marginBlock: 22 }}>
                لا يوجد حساب موظف إضافي بعد.
              </div>
            )}
          </div>
        </section>
      ) : null}

      {tab === "settings" ? (
        <section className="admin-panel">
          <div className="admin-panel__head">
            <div>
              <h2>معلومات التواصل الرسمية</h2>
              <p>
                حدّث الهاتف والبريد والدوام والخريطة من هنا. الحقول الفارغة لا
                تظهر للزوار.
              </p>
            </div>
          </div>
          <form
            className="admin-form"
            key={JSON.stringify(settings)}
            onSubmit={submitSettings}
          >
            <div className="field-row">
              <div className="field">
                <label htmlFor="municipalityPhone">هاتف البلدية</label>
                <input
                  className="form-control"
                  id="municipalityPhone"
                  name="municipalityPhone"
                  type="tel"
                  inputMode="tel"
                  maxLength={60}
                  defaultValue={settings.municipalityPhone}
                  placeholder="+961 ..."
                />
              </div>
              <div className="field">
                <label htmlFor="whatsappNumber">رقم واتساب البلدية</label>
                <input
                  className="form-control"
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  inputMode="tel"
                  maxLength={60}
                  defaultValue={settings.whatsappNumber}
                  placeholder="+961 ..."
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="municipalityEmail">البريد الإلكتروني</label>
                <input
                  className="form-control"
                  id="municipalityEmail"
                  name="municipalityEmail"
                  type="email"
                  maxLength={160}
                  defaultValue={settings.municipalityEmail}
                  placeholder="info@example.gov.lb"
                />
              </div>
              <div className="field">
                <label htmlFor="officeHours">أوقات الدوام</label>
                <input
                  className="form-control"
                  id="officeHours"
                  name="officeHours"
                  maxLength={240}
                  defaultValue={settings.officeHours}
                  placeholder="مثلاً: الاثنين إلى الجمعة، 8:00–14:00"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="municipalityAddress">العنوان</label>
              <input
                className="form-control"
                id="municipalityAddress"
                name="municipalityAddress"
                maxLength={240}
                defaultValue={settings.municipalityAddress}
              />
            </div>
            <div className="field">
              <label htmlFor="mapUrl">رابط الموقع على Google Maps</label>
              <input
                className="form-control"
                id="mapUrl"
                name="mapUrl"
                type="url"
                inputMode="url"
                dir="ltr"
                maxLength={500}
                defaultValue={settings.mapUrl}
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>
            <small className="field-help">
              احفظ فقط البيانات التي اعتمدتها البلدية رسمياً. معلومات حملات
              المساعدة ورقم Wish تُدار من كل حملة، وليست من هذه الصفحة.
            </small>
            <button
              className="button button--primary"
              type="submit"
              disabled={busy}
            >
              {busy ? "جارٍ الحفظ..." : "حفظ معلومات التواصل"}
            </button>
          </form>
        </section>
      ) : null}
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
  if (type === "gallery") {
    return {
      title: "معرض صور",
      description:
        "ارفع صوراً من البيرة لتظهر في «معرض الصور» ضمن صفحة «عن البيرة». يكفي عنوانٌ للمجموعة واختيار الصور.",
      titlePlaceholder: "مثلاً: صور من ساحة البلدة",
      excerptPlaceholder: "وصفٌ مختصر للمجموعة (اختياري)...",
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
  if (kind === "document") return "استفسار عن معاملة";
  return "طلب من البلدية";
}

function requestStatusLabel(status: string) {
  if (status === "in_review") return "قيد المتابعة";
  if (status === "resolved") return "تمّت المعالجة";
  if (status === "archived") return "مؤرشفة";
  return "جديدة";
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  const localOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - localOffset).toISOString().slice(0, 16);
}

// Convert a locally-typed Lebanese phone into wa.me international format.
function toWhatsAppNumber(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("961")) return digits;
  if (digits.startsWith("0")) digits = digits.slice(1);
  return `961${digits}`;
}

// Build a wa.me link that opens WhatsApp with a status message pre-written.
function whatsappNotifyUrl(request: AdminResidentRequest) {
  const statusLine =
    request.status === "resolved"
      ? "تمّت معالجة طلبك."
      : request.status === "in_review"
        ? "طلبك قيد المتابعة حالياً."
        : "استلمنا طلبك وسنعالجه قريباً.";
  const greeting = request.name ? `مرحباً ${request.name}،` : "مرحباً،";
  const text = `${greeting}
بخصوص طلبك لدى بلدية البيرة (رقم المتابعة: ${request.referenceCode}):
${statusLine}
شكراً لتواصلكم مع بلدية البيرة.`;
  return `https://wa.me/${toWhatsAppNumber(
    request.phone || "",
  )}?text=${encodeURIComponent(text)}`;
}
