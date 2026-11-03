import { nanoid } from "nanoid";
import { db, boards, boardSnapshots } from "./db";
import { eq, desc } from "drizzle-orm";

export async function createBoard(options?: {
  slug?: string;
  title?: string;
  userId?: string | null;
}) {
  const id = nanoid();
  const slug = options?.slug || nanoid(10);
  const ownerToken = nanoid(32);
  const now = new Date();

  await db.insert(boards).values({
    id,
    slug,
    title: options?.title || "未命名白板",
    ownerToken,
    userId: options?.userId || null,
    isPublic: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(boardSnapshots).values({
    id: nanoid(),
    boardId: id,
    snapshot: JSON.stringify({}),
    version: 1,
    createdAt: now,
  });

  return { id, slug, ownerToken };
}

export async function getBoardBySlug(slug: string) {
  const result = await db
    .select()
    .from(boards)
    .where(eq(boards.slug, slug))
    .limit(1);
  return result[0] || null;
}

export async function getLatestSnapshot(boardId: string) {
  const result = await db
    .select()
    .from(boardSnapshots)
    .where(eq(boardSnapshots.boardId, boardId))
    .orderBy(desc(boardSnapshots.version))
    .limit(1);
  return result[0] || null;
}

export async function saveSnapshot(
  boardId: string,
  snapshot: string,
  version: number
) {
  const id = nanoid();
  const now = new Date();
  await db.insert(boardSnapshots).values({
    id,
    boardId,
    snapshot,
    version,
    createdAt: now,
  });
  await db
    .update(boards)
    .set({ updatedAt: now })
    .where(eq(boards.id, boardId));
  return id;
}
