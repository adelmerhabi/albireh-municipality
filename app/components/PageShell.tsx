import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  ["الرئيسية", "/"],
  ["الإعلانات", "/announcements"],
  ["الفعاليات", "/events"],
  ["المشاريع", "/projects"],
  ["الحملات", "/donations"],
  ["أرسل طلباً", "/requests"],
  ["التواصل", "/contact"],
];

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <div className="prototype-bar">
        نسخة أولية خاصة للمراجعة — ليست الموقع الرسمي المنشور بعد
      </div>
      <header className="site-header">
        <div className="container site-header__inner">
          <Link className="brand" href="/" aria-label="بلدية البيرة – عكار">
            <span className="cedar-crop">
              <img src="/municipality-source.jpg" alt="" />
            </span>
            <span>
              <strong>بلدية البيرة – عكار</strong>
              <span>الموقع الرسمي</span>
            </span>
          </Link>

          <nav className="main-nav" aria-label="القائمة الرئيسية">
            <ul>
              {navigation.map(([label, href]) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="header-actions">
            <Link
              className="header-search"
              href="/search"
              aria-label="البحث في الموقع"
            >
              ⌕
            </Link>
            <Link className="admin-link" href="/admin">
              دخول البلدية
            </Link>
          </div>

          <details className="mobile-nav">
            <summary aria-label="فتح القائمة">القائمة</summary>
            <nav className="mobile-nav__panel" aria-label="قائمة الهاتف">
              {navigation.map(([label, href]) => (
                <Link href={href} key={href}>
                  {label}
                </Link>
              ))}
              <Link href="/admin">دخول البلدية</Link>
            </nav>
          </details>
        </div>
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container site-footer__main">
          <div className="footer-brand">
            <Link className="brand" href="/">
              <span className="cedar-crop">
                <img src="/municipality-source.jpg" alt="" />
              </span>
              <span>
                <strong style={{ color: "white" }}>بلدية البيرة – عكار</strong>
                <span>في خدمة أهلنا</span>
              </span>
            </Link>
            <p>
              الموقع الرسمي لمتابعة أخبار البلدية وإعلاناتها ومشاريعها
              وخدماتها. تُحدّث معلومات التواصل بعد اعتمادها من البلدية.
            </p>
          </div>
          <div>
            <h3>روابط سريعة</h3>
            <ul>
              <li>
                <Link href="/announcements">الإعلانات</Link>
              </li>
              <li>
                <Link href="/projects">المشاريع</Link>
              </li>
              <li>
                <Link href="/events">الفعاليات</Link>
              </li>
              <li>
                <Link href="/requests">أرسل طلباً أو شكوى</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>التواصل</h3>
            <ul>
              <li>
                <span>البيرة، عكار، لبنان</span>
              </li>
              <li>
                <Link href="/contact">أرقام البلدية</Link>
              </li>
              <li>
                <Link href="/contact">صفحة Facebook الرسمية</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="container site-footer__bottom">
          <span>© 2026 بلدية البيرة – عكار</span>
          <span>المحتوى التجريبي سيُستبدل قبل الإطلاق العام.</span>
        </div>
      </footer>
    </div>
  );
}
