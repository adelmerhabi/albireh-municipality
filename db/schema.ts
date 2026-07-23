import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const contentItems = sqliteTable("content_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  body: text("body").notNull().default(""),
  status: text("status").notNull().default("draft"),
  category: text("category"),
  location: text("location"),
  coverKey: text("cover_key"),
  coverAlt: text("cover_alt"),
  attachmentKey: text("attachment_key"),
  wishNumber: text("wish_number"),
  wishRecipient: text("wish_recipient"),
  donationTarget: text("donation_target"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  startsAt: text("starts_at"),
  endsAt: text("ends_at"),
  publishedAt: text("published_at"),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const contentAttachments = sqliteTable("content_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentId: integer("content_id")
    .notNull()
    .references(() => contentItems.id, { onDelete: "cascade" }),
  mediaKey: text("media_key").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  kind: text("kind").notNull().default("file"),
  altText: text("alt_text"),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedBy: text("updated_by"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const mediaFiles = sqliteTable("media_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  altText: text("alt_text"),
  uploadedBy: text("uploaded_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  actorEmail: text("actor_email"),
  details: text("details"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminUsers = sqliteTable("admin_users", {
  username: text("username").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("editor"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const residentRequests = sqliteTable("resident_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  referenceCode: text("reference_code").notNull().unique(),
  kind: text("kind").notNull(),
  name: text("name"),
  phone: text("phone"),
  location: text("location"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  sourceHash: text("source_hash"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const requestAttachments = sqliteTable("request_attachments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requestId: integer("request_id")
    .notNull()
    .references(() => residentRequests.id, { onDelete: "cascade" }),
  mediaKey: text("media_key").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
