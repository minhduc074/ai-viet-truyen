"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

function TypewriterText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  const handleSkip = () => {
    setDisplayed(text);
    setDone(true);
  };

  return (
    <div className="relative">
      <div
        className="prose prose-invert max-w-none whitespace-pre-wrap text-base leading-relaxed md:text-lg md:leading-8"
        onClick={!done ? handleSkip : undefined}
      >
        {displayed}
        {!done && <span className="animate-pulse text-purple-400">▎</span>}
      </div>
      {!done && (
        <button
          onClick={handleSkip}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Nhấn để bỏ qua hiệu ứng ▶
        </button>
      )}
    </div>
  );
}

export default function StoryPlayPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.storyId as string;

  const {
    story,
    chapters,
    currentChapter,
    currentChoices,
    isGenerating,
    error,
    generateChapter,
    loadStory,
  } = useGameStore();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load story on mount
  useEffect(() => {
    if (!story || story.id !== storyId) {
      loadStory(storyId);
    }
  }, [storyId]);

  // Generate first chapter if none exist
  useEffect(() => {
    if (story && story.id === storyId && chapters.length === 0 && !isGenerating) {
      generateChapter(storyId);
    }
  }, [story, storyId, chapters.length]);

  // Scroll to top of content when new chapter arrives
  useEffect(() => {
    if (currentChapter) {
      contentRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentChapter?.id]);

  const handleChoice = async (choiceText: string) => {
    setSelectedChoice(choiceText);
    await generateChapter(storyId, choiceText);
    setSelectedChoice(null);
  };

  // Check for guest limit error
  useEffect(() => {
    if (error?.includes("đăng nhập")) {
      setShowAuthModal(true);
    }
  }, [error]);

  if (!story && !error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-3/4" />
      </div>
    );
  }

  if (error && !showAuthModal) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <div className="mb-6 text-5xl">😵</div>
        <h1 className="mb-2 text-2xl font-bold">Đã xảy ra lỗi</h1>
        <p className="mb-6 text-muted-foreground">{error}</p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => router.push("/play/genre")}>
            ← Quay lại
          </Button>
          <Button onClick={() => generateChapter(storyId)}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Story header */}
      <div ref={contentRef} className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">{story?.genre}</Badge>
            {currentChapter && (
              <Badge variant="outline">Chapter {currentChapter.chapter_number}</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">{story?.title}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/my-stories")}
          className="shrink-0"
        >
          📚
        </Button>
      </div>

      {/* Chapter navigation - show previous chapters */}
      {chapters.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-1">
          {chapters.map((ch) => (
            <button
              key={ch.id}
              onClick={() => {
                const idx = chapters.findIndex((c) => c.id === ch.id);
                if (idx >= 0) {
                  // Simple: just show that chapter's content
                  useGameStore.setState({
                    currentChapter: ch,
                    currentChoices:
                      ch.id === chapters[chapters.length - 1]?.id
                        ? currentChoices
                        : [],
                  });
                }
              }}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                currentChapter?.id === ch.id
                  ? "bg-purple-500/20 text-purple-400"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Ch.{ch.chapter_number}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isGenerating && !currentChapter && (
        <div className="flex flex-col items-center py-20">
          <div className="mb-4 text-4xl animate-bounce">✍️</div>
          <p className="text-lg font-medium">AI đang sáng tác...</p>
          <p className="text-sm text-muted-foreground">Chờ một lát nhé</p>
        </div>
      )}

      {/* Current chapter content */}
      {currentChapter && (
        <div className="mb-8">
          {currentChapter.chapter_title && (
            <h2 className="mb-6 text-xl font-semibold text-purple-400">
              {currentChapter.chapter_title}
            </h2>
          )}
          <TypewriterText text={currentChapter.content} />
        </div>
      )}

      {/* Choices */}
      {currentChoices.length > 0 && !isGenerating && currentChapter?.id === chapters[chapters.length - 1]?.id && (
        <div className="mt-10 space-y-3">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            ⚡ Bạn sẽ làm gì tiếp theo?
          </p>
          {currentChoices.map((choice, idx) => (
            <button
              key={choice.id || idx}
              onClick={() => handleChoice(choice.choice_text)}
              disabled={isGenerating}
              className={`group w-full rounded-xl border border-border/50 bg-card p-4 text-left transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedChoice === choice.choice_text
                  ? "border-purple-500 bg-purple-500/10"
                  : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-sm leading-relaxed md:text-base">
                  {choice.choice_text}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Generating next chapter */}
      {isGenerating && currentChapter && (
        <div className="mt-8 flex flex-col items-center py-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
            <span className="text-sm text-muted-foreground">
              AI đang viết chapter tiếp theo...
            </span>
          </div>
        </div>
      )}

      {/* Auth Modal for Guest Limit */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🔒 Đã hết lượt miễn phí</DialogTitle>
            <DialogDescription>
              Bạn đã sử dụng hết 5 chapter miễn phí cho khách. Đăng nhập hoặc đăng ký để
              tiếp tục viết truyện không giới hạn!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Link href="/auth/login" className={buttonVariants()}>
              Đăng nhập
            </Link>
            <Link href="/auth/register" className={buttonVariants({ variant: "outline" })}>
              Đăng ký tài khoản mới
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
