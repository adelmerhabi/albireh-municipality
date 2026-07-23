"use client";

import { useState } from "react";

type GalleryImage = {
  url: string;
  filename: string;
  altText: string | null;
};

export function MediaGallery({
  images,
  fallbackMark,
  title,
}: {
  images: GalleryImage[];
  fallbackMark: string;
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="detail-visual">
        <span>{fallbackMark}</span>
      </div>
    );
  }

  const active = images[Math.min(activeIndex, images.length - 1)];

  function move(direction: number) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  return (
    <div className="media-gallery">
      <div className="media-gallery__stage">
        <a href={active.url} target="_blank" rel="noreferrer">
          <img
            src={active.url}
            alt={active.altText || `${title} — صورة ${activeIndex + 1}`}
          />
        </a>
        {images.length > 1 ? (
          <>
            <button
              className="media-gallery__control media-gallery__control--previous"
              type="button"
              onClick={() => move(-1)}
              aria-label="الصورة السابقة"
            >
              ›
            </button>
            <button
              className="media-gallery__control media-gallery__control--next"
              type="button"
              onClick={() => move(1)}
              aria-label="الصورة التالية"
            >
              ‹
            </button>
            <span className="media-gallery__counter">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="media-gallery__thumbs" aria-label="صور المادة">
          {images.map((image, index) => (
            <button
              className={index === activeIndex ? "is-active" : ""}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`عرض الصورة ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              key={`${image.url}-${index}`}
            >
              <img
                src={image.url}
                alt={image.altText || `صورة مصغّرة ${index + 1}`}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
