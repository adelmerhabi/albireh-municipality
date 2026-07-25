import { getPublishedSlugs } from "../lib/content";

const staticPaths = [
  "",
  "announcements",
  "events",
  "projects",
  "donations",
  "gallery",
  "about",
  "contact",
  "requests",
  "services/documents",
];

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const slugs = await getPublishedSlugs();

  const urls = [
    ...staticPaths.map((path) => `${origin}/${path}`),
    ...slugs.map((slug) => `${origin}/item/${encodeURIComponent(slug)}`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
