"use client";

import { useEffect } from "react";

// Progressive-enhancement scroll reveal: content is fully visible without JS.
// When JS runs (and motion is allowed), elements fade/slide in on scroll.
const SELECTORS = [
  ".section-heading",
  ".content-card",
  ".quick-card",
  ".project-row",
  ".value-card",
  ".landmark-card",
  ".village-gallery__item",
  ".about-fact",
  ".dyk-card",
  ".notice-card",
  ".about-figure",
  ".about-prose",
  ".crop-list",
  ".donation-preview",
].join(",");

export function Motion() {
  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTORS));
    if (els.length === 0) return;

    document.body.classList.add("motion-ready");
    els.forEach((el) => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -48px 0px" },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
