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

function isMissingTableError(err: PgError, tableName: string): boolean {
  if (err.code === "42P01") return true;
  if (err.code === "PGRST205" && err.message?.includes(tableName)) return true;
  return false;
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
      world_setting,
      cultivation_system,
      ending_goal,
      character_name,
      character_description,
      companion_name,
      companion_role,
      companion_description,
      companion_goal,
      companion_arc,
      tone = "balanced",
      chapter_length = "medium",
      ai_model,
      guestToken,
    } = body;

    console.log(`${logTag} request_start`, {
      hasTitle: Boolean(title),
      hasGenre: Boolean(genre),
      hasPremise: Boolean(premise),
      hasWorldSetting: Boolean(world_setting),
      hasCultivationSystem: Boolean(cultivation_system),
      hasEndingGoal: Boolean(ending_goal),
      hasCharacterName: Boolean(character_name),
      hasCharacterDescription: Boolean(character_description),
      hasCompanionName: Boolean(companion_name),
      hasCompanionRole: Boolean(companion_role),
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
      if (err.message === "Auth session missing!") {
        console.info(`${logTag} auth_getUser_info`, {
          message: "Guest request without auth session",
        });
      } else {
        console.error(`${logTag} auth_getUser_error`, err);
      }
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

        if (isMissingTableError(err, "public.guest_sessions")) {
          // Graceful fallback: keep feature working even before SQL migration is applied.
          // Guest chapter limit tracking will be unavailable until migration is run.
          console.warn(
            `${logTag} guest_sessions_table_missing_lookup; falling back to cookie-only guest flow`
          );
          guestSessionId = null;
          resolvedGuestToken = token;
        }
      }

      if (existingSession) {
        guestSessionId = existingSession.id;
        console.log(`${logTag} guest_session_reused`, {
          guestSessionId,
        });
      } else if (guestSessionId === null) {
        // Missing table fallback path: skip session row creation.
        console.log(`${logTag} guest_session_skipped_missing_table`);
      } else {
        const { data: newSession, error: sessionError } = await supabase
          .from("guest_sessions")
          .insert({ session_token: token })
          .select("id")
          .single();

        if (sessionError) {
          const err = toPgError(sessionError);
          console.error(`${logTag} guest_session_create_error`, err);

          if (isMissingTableError(err, "public.guest_sessions")) {
            console.warn(
              `${logTag} guest_sessions_table_missing_create; continuing without guest_session_id`
            );
            guestSessionId = null;
          } else {
            return NextResponse.json(
              { error: "Không thể tạo phiên khách", requestId, debug: err },
              { status: 500 }
            );
          }
        } else {
          guestSessionId = newSession.id;
          console.log(`${logTag} guest_session_created`, {
            guestSessionId,
          });
        }
      }
    }

    // Create story
    // NOTE: We avoid `.select()` here because guest stories are not readable by current
    // select policies (is_public=false, user_id=null), which can trigger 42501 on RETURNING.
    const storyId = uuidv4();
    const nowIso = new Date().toISOString();
    const storyInsert = {
      id: storyId,
      user_id: user?.id || null,
      guest_session_id: guestSessionId,
      title,
      genre,
      premise,
      world_setting,
      cultivation_system,
      ending_goal,
      character_name,
      character_description,
      companion_name,
      companion_role,
      companion_description,
      companion_goal,
      companion_arc,
      tone,
      chapter_length,
      current_power_level: null,
      ai_model: ai_model || null,
    };

    const { error: storyError } = await supabase
      .from("stories")
      .insert(storyInsert);

    if (storyError) {
      const err = toPgError(storyError);
      console.error(`${logTag} story_create_error`, err);

      if (err.code === "42P01" || isMissingTableError(err, "public.stories")) {
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

    const story = {
      ...storyInsert,
      status: "active",
      is_public: false,
      chapter_count: 0,
      likes_count: 0,
      created_at: nowIso,
      updated_at: nowIso,
    };

    console.log(`${logTag} story_created`, {
      storyId: story.id,
      guestSessionId,
      isAuthenticated: Boolean(user),
    });

    const res = NextResponse.json({ story });

    // Set guest cookie if needed
    if (!user && resolvedGuestToken) {
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
