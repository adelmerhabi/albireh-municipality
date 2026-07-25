import Link from "next/link";
import { getAdminContent } from "../lib/content";
import { requireAdmin } from "../lib/admin-auth";
import { getAdminResidentRequests } from "../lib/requests";
import { getEmployeeUsers } from "../lib/admin-users";
import { getPublicSiteSettings } from "../lib/site-settings";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const identity = await requireAdmin("/admin");
  const canManageUsers = identity.role === "bootstrap";
  const [items, requests, employees, settings] = await Promise.all([
    getAdminContent(),
    getAdminResidentRequests(),
    canManageUsers ? getEmployeeUsers() : Promise.resolve([]),
    getPublicSiteSettings(),
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
            <Link
              className="button button--ghost"
              href="/api/admin/logout"
              prefetch={false}
              style={{ marginInlineStart: 12, minHeight: 38, padding: "7px 12px" }}
            >
              خروج
            </Link>
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
          <Link className="button button--ghost" href="/">
            معاينة الموقع
          </Link>
        </div>
        <AdminDashboard
          initialItems={items}
          initialRequests={requests}
          initialEmployees={employees}
          initialSettings={settings}
          canManageUsers={canManageUsers}
        />
      </main>
    </div>
  );
}
