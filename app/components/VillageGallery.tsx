"use client";

import { useCallback, useEffect, useState } from "react";

export type GalleryPhoto = {
  src: string;
  alt: string;
  credit?: string;
};

export function VillageGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = useState<number | null>(null);
  const isOpen = active !== null;
  const count = photos.length;

  const close = useCallback(() => setActive(null), []);
  const next = useCallback(
    () => setActive((i) => (i === null ? i : (i + 1) % count)),
    [count],
  );
  const prev = useCallback(
    () => setActive((i) => (i === null ? i : (i - 1 + count) % count)),
    [count],
  );

  useEffect(() => {
    if (!isOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      // RTL: the Left arrow moves forward, the Right arrow moves back.
      else if (event.key === "ArrowLeft") next();
      else if (event.key === "ArrowRight") prev();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close, next, prev]);

  if (count === 0) return null;

  return (
    <>
      <div className="village-gallery">
        {photos.map((photo, index) => (
          <figure className="village-gallery__item" key={`${photo.src}-${index}`}>
            <button
              type="button"
              className="village-gallery__btn"
              onClick={() => setActive(index)}
              aria-label={`فتح الصورة ${index + 1}`}
            >
              <img src={photo.src} alt={photo.alt} loading="lazy" />
              <span className="village-gallery__zoom" aria-hidden="true">
                ⤢
              </span>
            </button>
            {photo.credit ? <figcaption>{photo.credit}</figcaption> : null}
          </figure>
        ))}
      </div>

      {isOpen ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="عارض الصور"
          onClick={close}
        >
          <button
            className="lightbox__close"
            type="button"
            onClick={close}
            aria-label="إغلاق"
          >
            ×
          </button>
          {count > 1 ? (
            <button
              className="lightbox__nav lightbox__nav--prev"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                prev();
              }}
              aria-label="الصورة السابقة"
            >
              ›
            </button>
          ) : null}
          <figure
            className="lightbox__stage"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={photos[active].src} alt={photos[active].alt} />
            <figcaption>
              <span>{photos[active].credit || photos[active].alt}</span>
              {count > 1 ? (
                <span className="lightbox__counter">
                  {active + 1} / {count}
                </span>
              ) : null}
            </figcaption>
          </figure>
          {count > 1 ? (
            <button
              className="lightbox__nav lightbox__nav--next"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                next();
              }}
              aria-label="الصورة التالية"
            >
              ‹
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
