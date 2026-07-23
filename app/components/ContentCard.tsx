import Link from "next/link";
import type { PublicContent } from "../lib/content";

export function ContentCard({ item }: { item: PublicContent }) {
  return (
    <Link
      className="content-card"
      id={`item-${item.id}`}
      href={`/item/${item.slug}`}
      aria-label={`فتح تفاصيل: ${item.title}`}
    >
      <div className="content-card__visual">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.coverAlt || ""} />
        ) : (
          <span className="content-card__visual-mark" aria-hidden="true">
            {item.visualMark}
          </span>
        )}
      </div>
      <div className="content-card__body">
        <div className="content-card__meta">
          <span>{item.typeLabel}</span>
          <time>{item.displayDate}</time>
        </div>
        <h3>{item.title}</h3>
        <p>{item.excerpt}</p>
      </div>
      <span className="content-card__footer">
        <span>التفاصيل</span>
        <span aria-hidden="true">←</span>
      </span>
    </Link>
  );
}
