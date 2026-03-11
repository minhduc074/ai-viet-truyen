"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Story } from "@/types";

export default function MyStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<unknown>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("stories")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });
        setStories(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (storyId: string) => {
    if (!confirm("Bạn có chắc muốn xóa truyện này?")) return;
    const res = await fetch(`/api/story/${storyId}`, { method: "DELETE" });
    if (res.ok) {
      setStories(stories.filter((s) => s.id !== storyId));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex justify-center py-20">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <div className="mb-6 text-5xl">🔒</div>
        <h1 className="mb-2 text-2xl font-bold">Đăng nhập để xem truyện</h1>
        <p className="mb-6 text-muted-foreground">
          Bạn cần đăng nhập để quản lý các truyện đã tạo
        </p>
        <Link href="/auth/login" className={buttonVariants()}>
          Đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Truyện của tôi</h1>
          <p className="text-muted-foreground">{stories.length} truyện</p>
        </div>
        <Link href="/play/genre" className={buttonVariants()}>
          + Tạo truyện mới
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="mb-4 text-5xl">📝</div>
          <h2 className="mb-2 text-xl font-semibold">Chưa có truyện nào</h2>
          <p className="mb-6 text-muted-foreground">
            Bắt đầu tạo câu chuyện tương tác đầu tiên của bạn!
          </p>
          <Link href="/play/genre" className={buttonVariants()}>
            ✨ Bắt đầu viết truyện
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {stories.map((story) => (
            <div
              key={story.id}
              className="group flex items-start justify-between rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-purple-500/30"
            >
              <Link href={`/play/${story.id}`} className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {story.genre}
                  </Badge>
                  <Badge
                    variant={story.status === "active" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {story.status === "active"
                      ? "Đang chơi"
                      : story.status === "completed"
                      ? "Hoàn thành"
                      : "Bỏ dở"}
                  </Badge>
                </div>
                <h3 className="mb-1 text-lg font-semibold group-hover:text-purple-400 transition-colors">
                  {story.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {story.chapter_count} chapters •{" "}
                  {new Date(story.updated_at).toLocaleDateString("vi-VN")}
                </p>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(story.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                🗑️
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
