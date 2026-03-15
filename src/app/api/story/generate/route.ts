import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStoryChapter } from "@/lib/openrouter";
import { DEFAULT_MODEL } from "@/lib/models";
import { buildSystemPrompt, buildFirstChapterPrompt, buildNextChapterPrompt } from "@/lib/prompts";
import type { ChapterLength, StoryTone } from "@/types";

const GUEST_CHAPTER_LIMIT = 5;

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
  const logTag = `[api/story/generate:${requestId}]`;

  try {
    const body = await request.json();
    const { storyId, choiceMade } = body;

    if (!storyId) {
      return NextResponse.json({ error: "storyId is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get story
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      const err = toPgError(storyError);
      console.error(`${logTag} story_lookup_error`, {
        storyId,
        ...err,
      });

      const guidance =
        err.code === "42501"
          ? "RLS chặn truy cập story. Hãy chạy migration 002_guest_rls_patch.sql."
          : err.code === "PGRST116"
          ? "Không đọc được story (0 rows). Nếu là truyện guest, hãy chạy migration 002_guest_rls_patch.sql."
          : err.code === "PGRST205"
          ? "Thiếu bảng stories. Hãy chạy migration schema trong Supabase."
          : "Không tìm thấy truyện hoặc không có quyền truy cập.";

      return NextResponse.json(
        { error: guidance, requestId, debug: err },
        { status: 404 }
      );
    }

    // Guest chapter limit check
    if (!user && story.guest_session_id) {
      const { data: guestSession } = await supabase
        .from("guest_sessions")
        .select("*")
        .eq("id", story.guest_session_id)
        .single();

      if (guestSession && guestSession.chapters_used >= GUEST_CHAPTER_LIMIT) {
        return NextResponse.json(
          { error: "Bạn đã sử dụng hết 5 chapter miễn phí. Vui lòng đăng nhập để tiếp tục." },
          { status: 403 }
        );
      }
    }

    // Get existing chapters for context
    const { data: existingChapters } = await supabase
      .from("chapters")
      .select("*")
      .eq("story_id", storyId)
      .order("chapter_number", { ascending: true });

    const chapters = existingChapters || [];
    const nextChapterNumber = chapters.length + 1;

    // Build prompts
    const systemPrompt = buildSystemPrompt({
      genre: story.genre,
      tone: (story.tone || "balanced") as StoryTone,
      chapterLength: (story.chapter_length || "medium") as ChapterLength,
      worldSetting: story.world_setting || story.premise || "Một thế giới rộng lớn đang chờ được khám phá",
      cultivationSystem: story.cultivation_system || "Khởi đầu ở tầng thấp nhất và tiến lên từng bước hợp lý",
      endingGoal: story.ending_goal || "Hoàn thành mục tiêu lớn đã được gieo từ đầu truyện",
      characterName: story.character_name || "Nhân vật chính",
      characterDescription: story.character_description || "Một người bình thường",
      companionName: story.companion_name || "",
      companionRole: story.companion_role || "",
      companionDescription: story.companion_description || "",
      companionGoal: story.companion_goal || "",
      companionArc: story.companion_arc || "",
    });

    let userPrompt: string;
    if (nextChapterNumber === 1) {
      userPrompt = buildFirstChapterPrompt({
        title: story.title,
        premise: story.premise || "Một câu chuyện mới bắt đầu",
        worldSetting: story.world_setting || story.premise || "Một thế giới rộng lớn đang chờ được khám phá",
        cultivationSystem: story.cultivation_system || "Khởi đầu ở tầng thấp nhất và tiến lên từng bước hợp lý",
        endingGoal: story.ending_goal || "Hoàn thành mục tiêu lớn đã được gieo từ đầu truyện",
        companionName: story.companion_name || "Người đồng hành bí ẩn",
      });
    } else {
      // Get all chapter summaries for full context
      const allSummaries = chapters
        .map((ch) => ch.summary || `Chapter ${ch.chapter_number}`);

      userPrompt = buildNextChapterPrompt({
        chapterNumber: nextChapterNumber,
        choiceMade: choiceMade || "Tiếp tục",
        previousSummaries: allSummaries,
        worldSetting: story.world_setting || story.premise || "Một thế giới rộng lớn đang chờ được khám phá",
        cultivationSystem: story.cultivation_system || "Khởi đầu ở tầng thấp nhất và tiến lên từng bước hợp lý",
        endingGoal: story.ending_goal || "Hoàn thành mục tiêu lớn đã được gieo từ đầu truyện",
        companionName: story.companion_name || "",
        companionRole: story.companion_role || "",
        companionDescription: story.companion_description || "",
        companionGoal: story.companion_goal || "",
        companionArc: story.companion_arc || "",
        currentPowerLevel:
          story.current_power_level || "Tầng khởi điểm thấp nhất của hệ thống đã xác lập",
      });
    }

    // Call AI with story's selected model
    const aiModel = story.ai_model || DEFAULT_MODEL;
    const aiResponse = await generateStoryChapter(systemPrompt, userPrompt, [], aiModel);

    // If there was a choice made, mark it as selected in the previous chapter
    if (choiceMade && chapters.length > 0) {
      const lastChapter = chapters[chapters.length - 1];
      await supabase
        .from("choices")
        .update({ is_selected: true })
        .eq("chapter_id", lastChapter.id)
        .eq("choice_text", choiceMade);
    }

    // Save chapter
    const { data: newChapter, error: chapterError } = await supabase
      .from("chapters")
      .insert({
        story_id: storyId,
        chapter_number: nextChapterNumber,
        chapter_title: aiResponse.chapter_title,
        content: aiResponse.content,
        summary: aiResponse.summary,
        parent_chapter_id: chapters.length > 0 ? chapters[chapters.length - 1].id : null,
        choice_made: choiceMade || null,
      })
      .select()
      .single();

    if (chapterError || !newChapter) {
      console.error("Chapter save error:", chapterError);
      return NextResponse.json({ error: "Không thể lưu chapter" }, { status: 500 });
    }

    // Save choices
    const choiceInserts = aiResponse.choices.map((text, idx) => ({
      chapter_id: newChapter.id,
      choice_text: text,
      choice_order: idx + 1,
    }));

    const { data: savedChoices, error: choicesError } = await supabase
      .from("choices")
      .insert(choiceInserts)
      .select();

    if (choicesError) {
      console.error("Choices save error:", choicesError);
    }

    // Update story chapter count and status
    const storyUpdate: Record<string, unknown> = {
      chapter_count: nextChapterNumber,
      updated_at: new Date().toISOString(),
      current_power_level: aiResponse.power_level || story.current_power_level || null,
    };

    // If character died or reached max power, mark story as completed
    if (aiResponse.is_dead || aiResponse.is_ending) {
      storyUpdate.status = "completed";
    }

    await supabase
      .from("stories")
      .update(storyUpdate)
      .eq("id", storyId);

    // Update guest session chapter count
    if (!user && story.guest_session_id) {
      await supabase.rpc("increment_guest_chapters", {
        session_id: story.guest_session_id,
      });
    }

    return NextResponse.json({
      chapter: newChapter,
      choices: savedChoices || [],
      story: { 
        ...story, 
        chapter_count: nextChapterNumber,
        status: (aiResponse.is_dead || aiResponse.is_ending) ? "completed" : story.status,
      },
      is_dead: aiResponse.is_dead || false,
      is_ending: aiResponse.is_ending || false,
      power_level: aiResponse.power_level,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`${logTag} unhandled_error`, err);
    return NextResponse.json(
      {
        error: "Lỗi khi tạo chapter. Vui lòng thử lại.",
        requestId,
        debug: { message },
      },
      { status: 500 }
    );
  }
}
