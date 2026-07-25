import assert from "node:assert/strict";
import test from "node:test";

import {
  hashPassword,
  verifyPassword,
} from "../app/lib/passwords.ts";

test("password hashes use the Cloudflare-compatible PBKDF2 format", async () => {
  const hash = await hashPassword("A strong municipal password");
  const [algorithm, iterations, salt, derivedKey] = hash.split("$");

  assert.equal(algorithm, "pbkdf2-sha256");
  assert.equal(iterations, "100000");
  assert.ok(salt.length >= 20);
  assert.ok(derivedKey.length >= 40);
});

test("password verification accepts only the correct password", async () => {
  const hash = await hashPassword("correct horse battery staple");

  assert.equal(
    await verifyPassword("correct horse battery staple", hash),
    true,
  );
  assert.equal(await verifyPassword("wrong password", hash), false);
});

test("password verification fails closed for malformed or weakened hashes", async () => {
  const hash = await hashPassword("another strong password");
  const tampered = `${hash.slice(0, -2)}AA`;

  assert.equal(await verifyPassword("another strong password", tampered), false);
  assert.equal(await verifyPassword("password", "not-a-password-hash"), false);
  assert.equal(
    await verifyPassword(
      "password",
      "pbkdf2-sha256$99999$c2FsdA==$ZGVyaXZlZA==",
    ),
    false,
  );
});
