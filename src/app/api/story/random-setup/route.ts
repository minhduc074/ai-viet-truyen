import { NextRequest, NextResponse } from "next/server";
import { generateRandomSetup } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logTag = `[api/story/random-setup:${requestId}]`;

  try {
    const body = await request.json();
    const genre = typeof body?.genre === "string" ? body.genre.trim() : "Phiêu lưu";

    if (!genre) {
      return NextResponse.json(
        { error: "genre is required", requestId },
        { status: 400 }
      );
    }

    const data = await generateRandomSetup(genre);
    return NextResponse.json({ ...data, requestId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`${logTag} unhandled_error`, err);
    return NextResponse.json(
      {
        error: "Không thể random thiết lập truyện bằng AI.",
        requestId,
        debug: { message },
      },
      { status: 500 }
    );
  }
}
