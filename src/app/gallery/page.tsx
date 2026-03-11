"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { Story } from "@/types";
import { GENRES } from "@/lib/genres";

export default function GalleryPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("stories")
        .select("*")
        .eq("is_public", true)
        .order("likes_count", { ascending: false })
        .limit(50);

      if (filterGenre !== "all") {
        query = query.eq("genre", filterGenre);
      }

      const { data } = await query;
      setStories(data || []);
      setLoading(false);
    }
    load();
  }, [filterGenre]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Cộng đồng truyện</h1>
        <p className="text-muted-foreground">
          Khám phá những câu chuyện thú vị từ cộng đồng
        </p>
      </div>

      {/* Genre filter */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setFilterGenre("all")}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            filterGenre === "all"
              ? "bg-purple-500/20 text-purple-400"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Tất cả
        </button>
        {GENRES.map((g) => (
          <button
            key={g.id}
            onClick={() => setFilterGenre(g.name)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              filterGenre === g.name
                ? "bg-purple-500/20 text-purple-400"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {g.icon} {g.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="mb-4 text-5xl">🌐</div>
          <h2 className="mb-2 text-xl font-semibold">Chưa có truyện công khai</h2>
          <p className="mb-6 text-muted-foreground">
            Hãy là người đầu tiên chia sẻ câu chuyện với cộng đồng!
          </p>
          <Link href="/play/genre" className={buttonVariants()}>
            ✨ Viết truyện ngay
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/play/${story.id}`}
              className="group rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-purple-500/30 hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {story.genre}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {story.chapter_count} chapters
                </span>
              </div>
              <h3 className="mb-2 font-semibold group-hover:text-purple-400 transition-colors line-clamp-1">
                {story.title}
              </h3>
              {story.premise && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {story.premise}
                </p>
              )}
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>❤️ {story.likes_count}</span>
                <span>{new Date(story.created_at).toLocaleDateString("vi-VN")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
