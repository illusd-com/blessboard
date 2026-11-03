import { NextRequest, NextResponse } from "next/server";
import { askBlessas } from "@/lib/ai/client";
import { tools } from "@/lib/ai/tools";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], canvasState } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const assistantMessage = await askBlessas(message, history, canvasState);

    return NextResponse.json({
      message: assistantMessage,
      tools: tools.map((t) => t.function.name),
    });
  } catch (error: any) {
    console.error("AI API error:", error);
    return NextResponse.json(
      {
        error: error.message || "AI request failed",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
