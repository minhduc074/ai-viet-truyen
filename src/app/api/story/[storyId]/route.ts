import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const supabase = await createClient();

    // Get story
    const { data: story, error: storyError } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      return NextResponse.json({ error: "Không tìm thấy truyện" }, { status: 404 });
    }

    // Get all chapters
    const { data: chapters } = await supabase
      .from("chapters")
      .select("*")
      .eq("story_id", storyId)
      .order("chapter_number", { ascending: true });

    // Get choices for the last chapter
    let currentChoices: unknown[] = [];
    if (chapters && chapters.length > 0) {
      const lastChapter = chapters[chapters.length - 1];
      const { data: choices } = await supabase
        .from("choices")
        .select("*")
        .eq("chapter_id", lastChapter.id)
        .order("choice_order", { ascending: true });
      currentChoices = choices || [];
    }

    return NextResponse.json({
      story,
      chapters: chapters || [],
      currentChoices,
    });
  } catch (err) {
    console.error("Get story error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const { data: story } = await supabase
      .from("stories")
      .select("user_id")
      .eq("id", storyId)
      .single();

    if (!story || story.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete story (cascades to chapters and choices)
    await supabase.from("stories").delete().eq("id", storyId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete story error:", err);
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 });
  }
}
