import { env } from "cloudflare:workers";
import { and, desc, eq, ne } from "drizzle-orm";
import { getDb } from "../../db";
import { ensureRuntimeSchema } from "../../db/runtime";
import { adminUsers, auditLog } from "../../db/schema";
import { hashPassword } from "./passwords";

export type EmployeeUser = {
  username: string;
  displayName: string;
  role: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export function isBootstrapAdmin(username: string) {
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const bootstrapUsername = String(
    runtimeEnv.ADMIN_BOOTSTRAP_USERNAME || "admin",
  )
    .trim()
    .toLowerCase();
  return Boolean(bootstrapUsername) && username.toLowerCase() === bootstrapUsername;
}

export async function getEmployeeUsers(): Promise<EmployeeUser[]> {
  await ensureRuntimeSchema();
  return getDb()
    .select({
      username: adminUsers.username,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      active: adminUsers.active,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
    })
    .from(adminUsers)
    .orderBy(desc(adminUsers.updatedAt))
    .limit(20);
}

export async function createOrResetEmployee(
  input: {
    username: string;
    displayName: string;
    password: string;
  },
  actorEmail: string,
) {
  await ensureRuntimeSchema();
  const db = getDb();
  const [otherActive] = await db
    .select({ username: adminUsers.username })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.active, true),
        ne(adminUsers.username, input.username),
      ),
    )
    .limit(1);
  if (otherActive) {
    throw new Error(
      "يوجد حساب موظف نشط حالياً. عطّله أولاً قبل تفعيل حساب موظف آخر.",
    );
  }

  const [existing] = await db
    .select({ username: adminUsers.username })
    .from(adminUsers)
    .where(eq(adminUsers.username, input.username))
    .limit(1);
  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password);
  await db
    .insert(adminUsers)
    .values({
      username: input.username,
      displayName: input.displayName,
      passwordHash,
      role: "editor",
      active: true,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: adminUsers.username,
      set: {
        displayName: input.displayName,
        passwordHash,
        role: "editor",
        active: true,
        updatedAt: now,
      },
    });

  await db.insert(auditLog).values({
    action: existing ? "employee:reset" : "employee:create",
    entityType: "admin_user",
    entityId: input.username,
    actorEmail,
    details: JSON.stringify({ displayName: input.displayName }),
  });

  const [employee] = await getEmployeeUsers().then((users) =>
    users.filter((user) => user.username === input.username),
  );
  return employee;
}

export async function setEmployeeActive(
  username: string,
  active: boolean,
  actorEmail: string,
) {
  await ensureRuntimeSchema();
  const db = getDb();
  if (active) {
    const [otherActive] = await db
      .select({ username: adminUsers.username })
      .from(adminUsers)
      .where(
        and(eq(adminUsers.active, true), ne(adminUsers.username, username)),
      )
      .limit(1);
    if (otherActive) {
      throw new Error(
        "يوجد حساب موظف نشط حالياً. عطّله أولاً قبل تفعيل حساب آخر.",
      );
    }
  }

  const now = new Date().toISOString();
  const [employee] = await db
    .update(adminUsers)
    .set({ active, updatedAt: now })
    .where(eq(adminUsers.username, username))
    .returning({
      username: adminUsers.username,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      active: adminUsers.active,
      createdAt: adminUsers.createdAt,
      updatedAt: adminUsers.updatedAt,
    });
  if (!employee) return null;

  await db.insert(auditLog).values({
    action: active ? "employee:activate" : "employee:deactivate",
    entityType: "admin_user",
    entityId: username,
    actorEmail,
    details: JSON.stringify({ displayName: employee.displayName }),
  });
  return employee;
}
