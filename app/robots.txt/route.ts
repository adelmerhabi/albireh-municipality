export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${origin}/sitemap.xml
`;
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
