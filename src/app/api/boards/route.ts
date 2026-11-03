import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createBoard, getBoardBySlug } from "@/lib/board";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;

    const body = await req.json().catch(() => ({}));
    const { slug, title } = body;

    if (slug && !/^[a-z0-9-]{3,40}$/.test(slug)) {
      return NextResponse.json(
        { error: "slug 只能包含小寫英文、數字、連字號，長度 3-40" },
        { status: 400 }
      );
    }

    if (slug) {
      const existing = await getBoardBySlug(slug);
      if (existing) {
        return NextResponse.json(
          { error: "這個 slug 已被使用" },
          { status: 409 }
        );
      }
    }

    const board = await createBoard({
      slug,
      title,
      userId: userId || null,
    });

    return NextResponse.json({
      id: board.id,
      slug: board.slug,
      ownerToken: board.ownerToken,
      url: `/d/${board.slug}`,
      userId: userId || null,
    });
  } catch (error: any) {
    console.error("Create board error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create board" },
      { status: 500 }
    );
  }
}
