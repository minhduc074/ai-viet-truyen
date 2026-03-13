"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGenreById } from "@/lib/genres";
import { FREE_MODELS, DEFAULT_MODEL, type AIModel } from "@/lib/models";
import { useGameStore } from "@/stores/gameStore";
import type { StoryTone, ChapterLength } from "@/types";

const TONES: { value: StoryTone; label: string; icon: string }[] = [
  { value: "humorous", label: "Hài hước", icon: "😄" },
  { value: "serious", label: "Nghiêm túc", icon: "😐" },
  { value: "dark", label: "Đen tối", icon: "🌑" },
  { value: "wholesome", label: "Ấm áp", icon: "☀️" },
  { value: "balanced", label: "Cân bằng", icon: "⚖️" },
];

const LENGTHS: { value: ChapterLength; label: string; desc: string }[] = [
  { value: "short", label: "Ngắn", desc: "~100 từ" },
  { value: "medium", label: "Trung bình", desc: "~200 từ" },
  { value: "long", label: "Dài", desc: "~300 từ" },
];

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const genreId = searchParams.get("genre") || "";
  const genre = getGenreById(genreId);

  const { createStory, setSetup, generateChapter } = useGameStore();

  const [form, setForm] = useState({
    title: "",
    customGenre: "",
    premise: "",
    character_name: "",
    character_description: "",
    tone: "balanced" as StoryTone,
    chapter_length: "medium" as ChapterLength,
    ai_model: DEFAULT_MODEL,
  });
  const [loading, setLoading] = useState(false);
  const [randomLoading, setRandomLoading] = useState(false);
  const [error, setError] = useState("");

  const genreName = genreId === "custom" ? form.customGenre : genre?.name || genreId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.premise.trim() || !form.character_name.trim()) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    if (genreId === "custom" && !form.customGenre.trim()) {
      setError("Vui lòng nhập thể loại tùy chỉnh");
      return;
    }

    setLoading(true);
    setError("");

    const setup = {
      title: form.title.trim(),
      genre: genreName,
      premise: form.premise.trim(),
      character_name: form.character_name.trim(),
      character_description: form.character_description.trim(),
      tone: form.tone,
      chapter_length: form.chapter_length,
      ai_model: form.ai_model,
    };

    // Get guest token from cookie if exists
    const guestToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("guest_token="))
      ?.split("=")[1];

    const storyId = await createStory(setup, guestToken);
    if (storyId) {
      setSetup(setup);
      router.push(`/play/${storyId}`);
    } else {
      setLoading(false);
      setError("Không thể tạo truyện. Vui lòng thử lại.");
    }
  };

  const handleRandomSetup = async () => {
    if (genreId === "custom" && !form.customGenre.trim()) {
      setError("Nhập thể loại tùy chỉnh trước khi random bằng AI");
      return;
    }

    setRandomLoading(true);
    setError("");
    try {
      const genreForRandom = genreId === "custom" ? form.customGenre.trim() : genreName;
      const res = await fetch("/api/story/random-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre: genreForRandom, model: form.ai_model }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Random setup thất bại");
      }

      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        premise: data.premise || prev.premise,
        character_name: data.character_name || prev.character_name,
        character_description: data.character_description || prev.character_description,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể random thiết lập truyện");
    } finally {
      setRandomLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          {genre && <span className="text-3xl">{genre.icon}</span>}
          <Badge variant="secondary" className="text-sm">
            {genreId === "custom" ? "Tùy chỉnh" : genre?.name || genreId}
          </Badge>
        </div>
        <h1 className="mb-2 text-3xl font-bold">Thiết lập câu chuyện</h1>
        <p className="text-muted-foreground">Tạo nên thế giới và nhân vật của riêng bạn</p>
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleRandomSetup}
            disabled={randomLoading}
          >
            {randomLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                AI đang random...
              </>
            ) : (
              <>🎲 AI random thiết lập</>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {genreId === "custom" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thể loại tùy chỉnh</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="VD: Hậu tận thế, Cyberpunk, Trường học..."
                value={form.customGenre}
                onChange={(e) => setForm({ ...form, customGenre: e.target.value })}
                maxLength={50}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">📖 Thông tin truyện</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">
                Tên truyện <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="VD: Kiếm Đạo Vô Song, Thần Giới Truyền Kỳ..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                maxLength={100}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="premise">
                Bối cảnh & cốt truyện <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="premise"
                placeholder="Mô tả bối cảnh thế giới, tình huống mở đầu, và điều gì thúc đẩy câu chuyện. VD: Trong một thế giới nơi tu tiên giả thống trị, một thiếu niên bình thường tình cờ nhặt được một viên đá bí ẩn..."
                value={form.premise}
                onChange={(e) => setForm({ ...form, premise: e.target.value })}
                rows={4}
                maxLength={1000}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.premise.length}/1000 ký tự
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">👤 Nhân vật chính</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="character_name">
                Tên nhân vật <span className="text-destructive">*</span>
              </Label>
              <Input
                id="character_name"
                placeholder="VD: Lâm Phong, Minh Anh..."
                value={form.character_name}
                onChange={(e) => setForm({ ...form, character_name: e.target.value })}
                maxLength={50}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="character_description">Mô tả nhân vật</Label>
              <Textarea
                id="character_description"
                placeholder="Miêu tả ngoại hình, tính cách, kỹ năng/sức mạnh đặc biệt. VD: Thiếu niên 18 tuổi, tóc đen, tính cách lạnh lùng nhưng trọng nghĩa, là đệ tử cuối cùng của một môn phái đã bị tiêu diệt..."
                value={form.character_description}
                onChange={(e) =>
                  setForm({ ...form, character_description: e.target.value })
                }
                rows={3}
                maxLength={500}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.character_description.length}/500 ký tự
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">⚙️ Tùy chỉnh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-3 block">Phong cách kể chuyện</Label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, tone: t.value })}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${
                      form.tone === t.value
                        ? "border-purple-500 bg-purple-500/10 text-purple-400"
                        : "border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-3 block">Độ dài mỗi chapter</Label>
              <div className="flex flex-wrap gap-2">
                {LENGTHS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setForm({ ...form, chapter_length: l.value })}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${
                      form.chapter_length === l.value
                        ? "border-purple-500 bg-purple-500/10 text-purple-400"
                        : "border-border text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    <span>{l.label}</span>
                    <span className="text-xs text-muted-foreground">({l.desc})</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">🤖 Chọn AI Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="ai_model" className="text-sm text-muted-foreground">
                Model được sử dụng để viết truyện (tất cả đều miễn phí)
              </Label>
              <select
                id="ai_model"
                value={form.ai_model}
                onChange={(e) => setForm({ ...form, ai_model: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {FREE_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.provider}: {model.name} ({Math.round(model.contextLength / 1000)}K context)
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Model lớn hơn thường viết tốt hơn nhưng có thể chậm hơn khi bị rate limit.
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full gap-2 text-base"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Đang tạo truyện...
            </>
          ) : (
            <>✨ Bắt đầu phiêu lưu</>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function StorySetupPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
      <SetupForm />
    </Suspense>
  );
}
