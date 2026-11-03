import { NextRequest, NextResponse } from "next/server";
import { getBoardBySlug, getLatestSnapshot, saveSnapshot } from "@/lib/board";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const board = await getBoardBySlug(slug);
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  const snapshot = await getLatestSnapshot(board.id);

  return NextResponse.json({
    id: board.id,
    slug: board.slug,
    title: board.title,
    isPublic: board.isPublic,
    snapshot: snapshot ? JSON.parse(snapshot.snapshot) : null,
    version: snapshot?.version || 0,
    updatedAt: board.updatedAt,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();
  const { snapshot, version, ownerToken } = body;

  const board = await getBoardBySlug(slug);
  if (!board) {
    return NextResponse.json({ error: "Board not found" }, { status: 404 });
  }

  if (ownerToken && ownerToken !== board.ownerToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!snapshot) {
    return NextResponse.json({ error: "snapshot required" }, { status: 400 });
  }

  const newVersion = (version || 0) + 1;
  await saveSnapshot(board.id, JSON.stringify(snapshot), newVersion);

  return NextResponse.json({ success: true, version: newVersion });
}
