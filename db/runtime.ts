import { env } from "cloudflare:workers";

let schemaPromise: Promise<void> | null = null;

export async function ensureRuntimeSchema() {
  if (!env.DB) {
    throw new Error("D1 binding DB is unavailable");
  }

  schemaPromise ??= runRuntimeSchema().catch((error) => {
    // Allow a later request to retry instead of caching a failed init.
    schemaPromise = null;
    throw error;
  });
  return schemaPromise;
}

async function runRuntimeSchema() {
  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS content_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        excerpt TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'draft',
        category TEXT,
        location TEXT,
        cover_key TEXT,
        cover_alt TEXT,
        attachment_key TEXT,
        wish_number TEXT,
        wish_recipient TEXT,
        donation_target TEXT,
        featured INTEGER NOT NULL DEFAULT 0,
        starts_at TEXT,
        ends_at TEXT,
        published_at TEXT,
        created_by TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT '',
        updated_by TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS media_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        alt_text TEXT,
        uploaded_by TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        actor_email TEXT,
        details TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admin_users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'editor',
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS content_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id INTEGER NOT NULL,
        media_key TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'file',
        alt_text TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS resident_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference_code TEXT NOT NULL UNIQUE,
        kind TEXT NOT NULL,
        name TEXT,
        phone TEXT,
        location TEXT,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        source_hash TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS request_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        media_key TEXT NOT NULL,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES resident_requests(id) ON DELETE CASCADE
      )
    `),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS content_status_type_idx ON content_items (status, type, published_at)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS content_slug_idx ON content_items (slug)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS content_attachments_content_idx ON content_attachments (content_id, position)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS resident_requests_status_idx ON resident_requests (status, created_at)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS resident_requests_source_idx ON resident_requests (source_hash, created_at)",
    ),
    env.DB.prepare(
      "CREATE INDEX IF NOT EXISTS request_attachments_request_idx ON request_attachments (request_id, position)",
    ),
  ]);

  // Reconcile columns that were added by later migrations onto databases that
  // already contain a `content_items` table from an earlier deployment.
  // `CREATE TABLE IF NOT EXISTS` above never alters an existing table, so the
  // Wish campaign columns (migration 0003) must be backfilled idempotently
  // here. Existing rows and data are preserved.
  await ensureColumns("content_items", {
    wish_number: "TEXT",
    wish_recipient: "TEXT",
    donation_target: "TEXT",
  });
}

async function ensureColumns(
  table: string,
  columns: Record<string, string>,
) {
  const info = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{
    name: string;
  }>();
  const existing = new Set((info.results ?? []).map((column) => column.name));

  for (const [name, type] of Object.entries(columns)) {
    if (existing.has(name)) continue;
    try {
      await env.DB.prepare(
        `ALTER TABLE ${table} ADD COLUMN ${name} ${type}`,
      ).run();
    } catch {
      // A concurrent worker may have added the column first; ignore races.
    }
  }
}
