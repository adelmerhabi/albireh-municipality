import Link from "next/link";
import { getAdminContent } from "../lib/content";
import { requireAdmin } from "../lib/admin-auth";
import { getAdminResidentRequests } from "../lib/requests";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [identity, items, requests] = await Promise.all([
    requireAdmin("/admin"),
    getAdminContent(),
    getAdminResidentRequests(),
  ]);

  return (
    <div className="admin-page" dir="rtl">
      <header className="admin-header">
        <div className="container admin-header__inner">
          <Link className="brand" href="/">
            <span className="cedar-crop">
              <img src="/municipality-source.jpg" alt="" />
            </span>
            <span>
              <strong>إدارة بلدية البيرة</strong>
              <span>لوحة المحتوى</span>
            </span>
          </Link>
          <div>
            <span className="admin-header__user">{identity.displayName}</span>
            <a
              className="button button--ghost"
              href="/api/admin/logout"
              style={{ marginInlineStart: 12, minHeight: 38, padding: "7px 12px" }}
            >
              خروج
            </a>
          </div>
        </div>
      </header>
      <main className="container admin-main">
        <div className="admin-intro">
          <div>
            <h1>أهلاً في لوحة البلدية</h1>
            <p>
              أضف الإعلانات والمشاريع والفعاليات والحملات، وتابع رسائل الأهالي
              من مكان واحد.
            </p>
          </div>
          <a className="button button--ghost" href="/">
            معاينة الموقع
          </a>
        </div>
        <AdminDashboard initialItems={items} initialRequests={requests} />
      </main>
    </div>
  );
}
