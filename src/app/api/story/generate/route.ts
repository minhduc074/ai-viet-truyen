import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStoryChapter } from "@/lib/openrouter";
import { buildSystemPrompt, buildFirstChapterPrompt, buildNextChapterPrompt } from "@/lib/prompts";
import type { ChapterLength, StoryTone } from "@/types";

const GUEST_CHAPTER_LIMIT = 5;

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "Không tìm thấy truyện" }, { status: 404 });
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
      characterName: story.character_name || "Nhân vật chính",
      characterDescription: story.character_description || "Một người bình thường",
    });

    let userPrompt: string;
    if (nextChapterNumber === 1) {
      userPrompt = buildFirstChapterPrompt({
        title: story.title,
        premise: story.premise || "Một câu chuyện mới bắt đầu",
      });
    } else {
      // Get summaries of recent chapters (last 10)
      const recentSummaries = chapters
        .slice(-10)
        .map((ch) => ch.summary || `Chapter ${ch.chapter_number}`);

      userPrompt = buildNextChapterPrompt({
        chapterNumber: nextChapterNumber,
        choiceMade: choiceMade || "Tiếp tục",
        previousSummaries: recentSummaries,
      });
    }

    // Call AI
    const aiResponse = await generateStoryChapter(systemPrompt, userPrompt);

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

    // Update story chapter count
    await supabase
      .from("stories")
      .update({
        chapter_count: nextChapterNumber,
        updated_at: new Date().toISOString(),
      })
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
      story: { ...story, chapter_count: nextChapterNumber },
    });
  } catch (err) {
    console.error("Generate chapter error:", err);
    return NextResponse.json(
      { error: "Lỗi khi tạo chapter. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
