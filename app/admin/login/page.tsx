import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "../../lib/admin-auth";

export const metadata: Metadata = {
  title: "دخول البلدية",
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; return_to?: string }>;
}) {
  const identity = await getAdminIdentity();
  if (identity) redirect("/admin");

  const { error, return_to: returnTo = "/admin" } = await searchParams;

  return (
    <main className="login-page" dir="rtl">
      <section className="login-card">
        <a className="brand login-card__brand" href="/">
          <span className="cedar-crop cedar-crop--large">
            <img src="/municipality-source.jpg" alt="" />
          </span>
          <span>
            <strong>بلدية البيرة – عكار</strong>
            <span>لوحة إدارة المحتوى</span>
          </span>
        </a>
        <div className="login-card__intro">
          <p className="eyebrow">دخول الموظفين فقط</p>
          <h1>أهلاً وسهلاً</h1>
          <p>أدخل اسم المستخدم وكلمة المرور المخصصة لك من البلدية.</p>
        </div>
        {error ? (
          <div className="login-error">
            اسم المستخدم أو كلمة المرور غير صحيحة.
          </div>
        ) : null}
        <form className="admin-form login-form" action="/api/admin/login" method="post">
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="field">
            <label htmlFor="username">اسم المستخدم</label>
            <input
              className="form-control"
              id="username"
              name="username"
              autoComplete="username"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <input
              className="form-control"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <button className="button button--primary" type="submit">
            دخول إلى لوحة البلدية
          </button>
        </form>
        <a className="text-link login-back" href="/">
          العودة إلى الموقع العام
        </a>
      </section>
    </main>
  );
}
