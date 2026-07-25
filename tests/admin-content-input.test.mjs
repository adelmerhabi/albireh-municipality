import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeAttachments,
  parseAdminContentInput,
} from "../app/lib/admin-content-input.ts";

const base = {
  title: "عنوان رسمي",
  excerpt: "ملخص واضح للزائر",
  body: "تفاصيل المنشور",
  status: "published",
  attachments: [],
};

test("published events require both a date and a location", () => {
  const missingDate = parseAdminContentInput({
    ...base,
    type: "event",
    location: "ساحة البلدية",
  });
  assert.equal(missingDate.error, "موعد الفعالية ومكانها مطلوبان قبل النشر");

  const valid = parseAdminContentInput({
    ...base,
    type: "event",
    location: "ساحة البلدية",
    startsAt: "2026-08-10T18:00:00+03:00",
  });
  assert.equal(valid.error, undefined);
  assert.equal(valid.input.type, "event");
  assert.equal(valid.input.location, "ساحة البلدية");
});

test("published aid campaigns require a Wish number", () => {
  const missingWish = parseAdminContentInput({
    ...base,
    type: "donation",
  });
  assert.equal(
    missingWish.error,
    "رقم Wish مطلوب قبل نشر حملة المساعدة",
  );

  const valid = parseAdminContentInput({
    ...base,
    type: "donation",
    wishNumber: "03 123 456",
    wishRecipient: "بلدية البيرة",
    donationTarget: "دعم الحملة",
  });
  assert.equal(valid.error, undefined);
  assert.equal(valid.input.wishNumber, "03 123 456");
  assert.equal(valid.input.wishRecipient, "بلدية البيرة");
});

test("published projects and galleries enforce their type-specific fields", () => {
  const project = parseAdminContentInput({ ...base, type: "project" });
  assert.equal(project.error, "اختر حالة المشروع قبل النشر");

  const gallery = parseAdminContentInput({
    ...base,
    type: "gallery",
    excerpt: "",
  });
  assert.equal(
    gallery.error,
    "أضف صورة واحدة على الأقل إلى المعرض قبل النشر",
  );
});

test("attachments are normalized and unsafe incomplete entries are discarded", () => {
  const attachments = normalizeAttachments([
    {
      key: "content/one.jpg",
      filename: "one.jpg",
      mimeType: "image/jpeg",
      altText: "صورة",
    },
    {
      key: "content/report.pdf",
      filename: "report.pdf",
      mimeType: "application/pdf",
    },
    { key: "", filename: "invalid.jpg", mimeType: "image/jpeg" },
  ]);

  assert.deepEqual(
    attachments.map(({ kind, filename }) => ({ kind, filename })),
    [
      { kind: "image", filename: "one.jpg" },
      { kind: "file", filename: "report.pdf" },
    ],
  );
});

test("content cannot silently accept more than twelve attachments", () => {
  const tooMany = Array.from({ length: 13 }, (_, index) => ({
    key: `content/${index}.jpg`,
    filename: `${index}.jpg`,
    mimeType: "image/jpeg",
  }));
  const result = parseAdminContentInput({
    ...base,
    type: "announcement",
    attachments: tooMany,
  });

  assert.equal(
    result.error,
    "يمكن حفظ 12 صورة أو ملفاً كحد أقصى لكل مادة",
  );
});
