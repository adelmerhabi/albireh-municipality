// Cloudflare Workers caps PBKDF2 at 100_000 iterations; using more makes the
// runtime throw ("iteration counts above 100000 are not supported"), which the
// verify path would swallow and reject every login. Stay at the platform max.
export async function hashPassword(password: string) {
  const iterations = 100_000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derive(password, salt, iterations);
  return `pbkdf2-sha256$${iterations}$${toBase64(salt)}$${toBase64(derived)}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, iterationsRaw, saltRaw, expectedRaw] = encoded.split("$");
  const iterations = Number(iterationsRaw);
  if (
    algorithm !== "pbkdf2-sha256" ||
    !Number.isInteger(iterations) ||
    iterations < 100_000 ||
    !saltRaw ||
    !expectedRaw
  ) {
    return false;
  }

  try {
    const salt = fromBase64(saltRaw);
    const expected = fromBase64(expectedRaw);
    const actual = await derive(password, salt, iterations);
    if (actual.length !== expected.length) return false;

    let result = 0;
    for (let index = 0; index < actual.length; index += 1) {
      result |= actual[index] ^ expected[index];
    }
    return result === 0;
  } catch {
    return false;
  }
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const result = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: salt.buffer as ArrayBuffer,
      iterations,
    },
    key,
    256,
  );
  return new Uint8Array(result);
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
