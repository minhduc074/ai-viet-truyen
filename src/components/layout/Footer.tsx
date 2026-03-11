import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">📖</span>
          <span>AI Viết Truyện — Tạo truyện tương tác cùng AI</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/play/genre" className="hover:text-foreground transition-colors">
            Chơi ngay
          </Link>
          <Link href="/gallery" className="hover:text-foreground transition-colors">
            Cộng đồng
          </Link>
        </div>
      </div>
    </footer>
  );
}
