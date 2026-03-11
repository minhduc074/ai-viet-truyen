"use client";

import Link from "next/link";
import { GENRES } from "@/lib/genres";

export default function GenreSelectionPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold md:text-4xl">Chọn thể loại truyện</h1>
        <p className="text-muted-foreground">
          Mỗi thể loại mang đến trải nghiệm hoàn toàn khác biệt
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GENRES.map((genre) => (
          <Link
            key={genre.id}
            href={`/play/setup?genre=${genre.id}`}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1"
          >
            {/* Gradient overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${genre.color} opacity-0 transition-opacity group-hover:opacity-5`}
            />

            <div className="relative">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-4xl transition-transform group-hover:scale-110">
                  {genre.icon}
                </span>
                <h2 className="text-xl font-bold">{genre.name}</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {genre.description}
              </p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-purple-400 opacity-0 transition-opacity group-hover:opacity-100">
                Chọn thể loại này →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Custom genre option */}
      <div className="mt-8 text-center">
        <Link
          href="/play/setup?genre=custom"
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-6 py-3 text-sm text-muted-foreground transition-colors hover:border-purple-500/50 hover:text-foreground"
        >
          ✏️ Thể loại tùy chỉnh — Tự nhập thể loại của riêng bạn
        </Link>
      </div>
    </div>
  );
}
