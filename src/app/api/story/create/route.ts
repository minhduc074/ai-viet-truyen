import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

type PgError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function toPgError(err: unknown): PgError {
  if (!err || typeof err !== "object") return {};
  const e = err as Record<string, unknown>;
  return {
    code: typeof e.code === "string" ? e.code : undefined,
    message: typeof e.message === "string" ? e.message : undefined,
    details: typeof e.details === "string" ? e.details : undefined,
    hint: typeof e.hint === "string" ? e.hint : undefined,
  };
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logTag = `[api/story/create:${requestId}]`;

  try {
    const body = await request.json();
    const guestTokenFromCookie = request.cookies.get("guest_token")?.value;
    const {
      title,
      genre,
      premise,
      character_name,
      character_description,
      tone = "balanced",
      chapter_length = "medium",
      guestToken,
    } = body;

    console.log(`${logTag} request_start`, {
      hasTitle: Boolean(title),
      hasGenre: Boolean(genre),
      hasPremise: Boolean(premise),
      hasCharacterName: Boolean(character_name),
      hasCharacterDescription: Boolean(character_description),
      tone,
      chapter_length,
      hasGuestTokenBody: Boolean(guestToken),
      hasGuestTokenCookie: Boolean(guestTokenFromCookie),
    });

    if (!title || !genre) {
      return NextResponse.json(
        { error: "Tiêu đề và thể loại là bắt buộc", requestId },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      const err = toPgError(authError);
      console.error(`${logTag} auth_getUser_error`, err);
    }

    console.log(`${logTag} auth_state`, {
      isAuthenticated: Boolean(user),
      userId: user?.id ?? null,
    });

    let guestSessionId: string | null = null;
    let resolvedGuestToken: string | null = null;

    if (!user) {
      // Handle guest session
      let token = guestToken || guestTokenFromCookie;
      if (!token) {
        token = uuidv4();
      }
      resolvedGuestToken = token;

      // Find or create guest session
      const { data: existingSession, error: existingSessionError } = await supabase
        .from("guest_sessions")
        .select("id, session_token")
        .eq("session_token", token)
        .maybeSingle();

      if (existingSessionError) {
        const err = toPgError(existingSessionError);
        console.error(`${logTag} guest_session_lookup_error`, err);
      }

      if (existingSession) {
        guestSessionId = existingSession.id;
        console.log(`${logTag} guest_session_reused`, {
          guestSessionId,
        });
      } else {
        const { data: newSession, error: sessionError } = await supabase
          .from("guest_sessions")
          .insert({ session_token: token })
          .select("id")
          .single();

        if (sessionError) {
          const err = toPgError(sessionError);
          console.error(`${logTag} guest_session_create_error`, err);

          if (err.code === "42P01") {
            return NextResponse.json(
              {
                error: "Database chưa được setup. Hãy chạy file SQL migration trong Supabase trước.",
                requestId,
                debug: err,
              },
              { status: 500 }
            );
          }

          return NextResponse.json(
            { error: "Không thể tạo phiên khách", requestId, debug: err },
            { status: 500 }
          );
        }
        guestSessionId = newSession.id;
        console.log(`${logTag} guest_session_created`, {
          guestSessionId,
        });
      }
    }

    // Create story
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .insert({
        user_id: user?.id || null,
        guest_session_id: guestSessionId,
        title,
        genre,
        premise,
        character_name,
        character_description,
        tone,
        chapter_length,
      })
      .select()
      .single();

    if (storyError) {
      const err = toPgError(storyError);
      console.error(`${logTag} story_create_error`, err);

      if (err.code === "42P01") {
        return NextResponse.json(
          {
            error: "Database chưa có bảng stories. Hãy chạy SQL migration trong Supabase.",
            requestId,
            debug: err,
          },
          { status: 500 }
        );
      }

      if (err.code === "42501") {
        return NextResponse.json(
          {
            error: "Bị từ chối bởi RLS policy. Kiểm tra lại policy của bảng stories/guest_sessions.",
            requestId,
            debug: err,
          },
          { status: 500 }
        );
      }

      if (err.code === "23503") {
        return NextResponse.json(
          {
            error: "Lỗi khóa ngoại (profile/guest session chưa hợp lệ). Kiểm tra trigger tạo profiles hoặc dữ liệu liên quan.",
            requestId,
            debug: err,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: "Không thể tạo truyện", requestId, debug: err },
        { status: 500 }
      );
    }

    console.log(`${logTag} story_created`, {
      storyId: story.id,
      guestSessionId,
      isAuthenticated: Boolean(user),
    });

    const res = NextResponse.json({ story });

    // Set guest cookie if needed
    if (!user && guestSessionId && resolvedGuestToken) {
      res.cookies.set("guest_token", resolvedGuestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    console.log(`${logTag} request_success`);
    return res;
  } catch (err) {
    console.error(`${logTag} unhandled_error`, err);
    return NextResponse.json(
      { error: "Lỗi server", requestId },
      { status: 500 }
    );
  }
}
