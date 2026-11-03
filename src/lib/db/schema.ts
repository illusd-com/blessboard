import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  name: text("name"),
  image: text("image"),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title"),
  ownerToken: text("owner_token").notNull(),
  userId: text("user_id"),
  passwordHash: text("password_hash"),
  isPublic: integer("is_public", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const boardSnapshots = sqliteTable("board_snapshots", {
  id: text("id").primaryKey(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  snapshot: text("snapshot").notNull(),
  version: integer("version").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
export type BoardSnapshot = typeof boardSnapshots.$inferSelect;
