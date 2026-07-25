"use client";

import Link from "next/link";
import { useRef } from "react";

export function MobileNav({ items }: { items: string[][] }) {
  const ref = useRef<HTMLDetailsElement>(null);

  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details className="mobile-nav" ref={ref}>
      <summary aria-label="القائمة">القائمة</summary>
      <nav className="mobile-nav__panel" aria-label="قائمة الهاتف">
        {items.map(([label, href]) => (
          <Link href={href} key={href} onClick={close}>
            {label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
