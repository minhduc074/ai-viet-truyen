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
import { FREE_MODELS, DEFAULT_MODEL } from "@/lib/models";
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

  const { createStory, setSetup } = useGameStore();

  const [form, setForm] = useState({
    title: "",
    customGenre: "",
    premise: "",
    world_setting: "",
    cultivation_system: "",
    ending_goal: "",
    character_name: "",
    character_description: "",
    companion_name: "",
    companion_role: "",
    companion_description: "",
    companion_goal: "",
    companion_arc: "",
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
    if (
      !form.title.trim() ||
      !form.premise.trim() ||
      !form.world_setting.trim() ||
      !form.cultivation_system.trim() ||
      !form.ending_goal.trim() ||
      !form.character_name.trim() ||
      !form.companion_name.trim()
    ) {
      setError("Vui lòng điền đủ thông tin cốt lõi: truyện, thế giới, cảnh giới, kết thúc, main và đồng hành");
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
      world_setting: form.world_setting.trim(),
      cultivation_system: form.cultivation_system.trim(),
      ending_goal: form.ending_goal.trim(),
      character_name: form.character_name.trim(),
      character_description: form.character_description.trim(),
      companion_name: form.companion_name.trim(),
      companion_role: form.companion_role.trim(),
      companion_description: form.companion_description.trim(),
      companion_goal: form.companion_goal.trim(),
      companion_arc: form.companion_arc.trim(),
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
        world_setting: data.world_setting || prev.world_setting,
        cultivation_system: data.cultivation_system || prev.cultivation_system,
        ending_goal: data.ending_goal || prev.ending_goal,
        character_name: data.character_name || prev.character_name,
        character_description: data.character_description || prev.character_description,
        companion_name: data.companion_name || prev.companion_name,
        companion_role: data.companion_role || prev.companion_role,
        companion_description:
          data.companion_description || prev.companion_description,
        companion_goal: data.companion_goal || prev.companion_goal,
        companion_arc: data.companion_arc || prev.companion_arc,
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
            <CardTitle className="text-base">🌍 Kinh thánh thế giới</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="world_setting">
                Bối cảnh thế giới <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="world_setting"
                placeholder="Miêu tả địa lý, lịch sử, trật tự xã hội, thế lực, luật vận hành của thế giới. Đây là canon mà các chapter sau phải tuân theo."
                value={form.world_setting}
                onChange={(e) => setForm({ ...form, world_setting: e.target.value })}
                rows={4}
                maxLength={1200}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.world_setting.length}/1200 ký tự
              </p>
            </div>
            <div>
              <Label htmlFor="cultivation_system">
                Cảnh giới tu luyện / hệ thống sức mạnh <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="cultivation_system"
                placeholder="VD: Phàm Thể → Luyện Khí → Trúc Cơ → Kim Đan → Nguyên Anh... Kèm logic đột phá, giới hạn và cái giá phải trả."
                value={form.cultivation_system}
                onChange={(e) =>
                  setForm({ ...form, cultivation_system: e.target.value })
                }
                rows={4}
                maxLength={1200}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.cultivation_system.length}/1200 ký tự
              </p>
            </div>
            <div>
              <Label htmlFor="ending_goal">
                Kết thúc mục tiêu <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="ending_goal"
                placeholder="Mô tả đích đến lớn của truyện: main phải đạt điều gì, trả giá gì, và khi nào truyện nên khép lại."
                value={form.ending_goal}
                onChange={(e) => setForm({ ...form, ending_goal: e.target.value })}
                rows={3}
                maxLength={800}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.ending_goal.length}/800 ký tự
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
            <CardTitle className="text-base">🤝 Đồng hành</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="companion_name">
                Tên đồng hành <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companion_name"
                placeholder="VD: Tô Vãn, Bạch Hồ, A Kỳ..."
                value={form.companion_name}
                onChange={(e) => setForm({ ...form, companion_name: e.target.value })}
                maxLength={50}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="companion_role">Vai trò</Label>
              <Input
                id="companion_role"
                placeholder="VD: Sư tỷ bị lưu đày, kiếm linh cổ xưa, thích khách thuê bất đắc dĩ..."
                value={form.companion_role}
                onChange={(e) => setForm({ ...form, companion_role: e.target.value })}
                maxLength={120}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="companion_description">Mô tả đồng hành</Label>
              <Textarea
                id="companion_description"
                placeholder="Miêu tả ngoại hình, tính cách, cách suy nghĩ, sở trường và điểm dễ mâu thuẫn với main."
                value={form.companion_description}
                onChange={(e) =>
                  setForm({ ...form, companion_description: e.target.value })
                }
                rows={3}
                maxLength={600}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.companion_description.length}/600 ký tự
              </p>
            </div>
            <div>
              <Label htmlFor="companion_goal">Mục tiêu riêng</Label>
              <Textarea
                id="companion_goal"
                placeholder="Điều đồng hành thật sự theo đuổi ngoài việc đi cùng main."
                value={form.companion_goal}
                onChange={(e) => setForm({ ...form, companion_goal: e.target.value })}
                rows={2}
                maxLength={400}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.companion_goal.length}/400 ký tự
              </p>
            </div>
            <div>
              <Label htmlFor="companion_arc">Quãng đường đồng hành</Label>
              <Textarea
                id="companion_arc"
                placeholder="Nêu rõ họ đi cùng main một chặng hay cả hành trình, và điều gì có thể khiến họ rời đi hoặc ở lại."
                value={form.companion_arc}
                onChange={(e) => setForm({ ...form, companion_arc: e.target.value })}
                rows={2}
                maxLength={400}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.companion_arc.length}/400 ký tự
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
