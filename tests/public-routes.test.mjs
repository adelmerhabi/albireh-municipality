import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { GET as getRobots } from "../app/robots.txt/route.ts";

test("robots.txt permits the public site and protects private surfaces", async () => {
  const response = await getRobots(
    new Request("https://baladiya.albireh.workers.dev/robots.txt"),
  );
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/plain\b/);
  assert.match(body, /^User-agent: \*\s*$/m);
  assert.match(body, /^Allow: \/$/m);
  assert.match(body, /^Disallow: \/admin$/m);
  assert.match(body, /^Disallow: \/api$/m);
  assert.match(
    body,
    /^Sitemap: https:\/\/baladiya\.albireh\.workers\.dev\/sitemap\.xml$/m,
  );
});

test("the Arabic privacy policy is public and linked from site navigation", async () => {
  const [policy, shell, sitemap] = await Promise.all([
    readFile(new URL("../app/privacy/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../app/components/PageShell.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../app/sitemap.xml/route.ts", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(policy, /سياسة الخصوصية/);
  assert.match(policy, /مدة الاحتفاظ/);
  assert.match(policy, /طلبات السكان/);
  assert.match(shell, /href="\/privacy"/);
  assert.match(sitemap, /"privacy"/);
});
