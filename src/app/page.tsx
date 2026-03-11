import Link from "next/link";
import { GENRES } from "@/lib/genres";

// Using cn + inline styles to avoid client-only buttonVariants in server component
import { cn } from "@/lib/utils";

const btnBase = "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";
const btnDefault = "bg-primary text-primary-foreground [a]:hover:bg-primary/80";
const btnOutline = "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50";
const btnLg = "h-9 gap-1.5 px-2.5";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-pink-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 md:py-36">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Miễn phí — Không cần đăng ký
            </div>

            <h1 className="mb-6 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Viết truyện{" "}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                tương tác
              </span>{" "}
              cùng AI
            </h1>

            <p className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Chọn thể loại yêu thích, tạo nhân vật của riêng bạn, và khám phá vô vàn cốt
              truyện khác nhau. Mỗi lựa chọn mở ra một hướng đi mới — câu chuyện là do{" "}
              <strong className="text-foreground">bạn</strong> quyết định.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/play/genre" className={cn(btnBase, btnDefault, btnLg, "gap-2 text-base px-8")}>
                ✨ Bắt đầu phiêu lưu
              </Link>
              <Link href="/gallery" className={cn(btnBase, btnOutline, btnLg, "gap-2 text-base px-8")}>
                📚 Khám phá truyện
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold">Cách chơi</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "1",
                icon: "🎭",
                title: "Chọn thể loại",
                desc: "Kiếm hiệp, tiên hiệp, kinh dị, lãng mạn... 10+ thể loại hấp dẫn",
              },
              {
                step: "2",
                icon: "👤",
                title: "Tạo nhân vật",
                desc: "Đặt tên, miêu tả ngoại hình, tính cách và bối cảnh câu chuyện",
              },
              {
                step: "3",
                icon: "🤖",
                title: "AI viết truyện",
                desc: "AI tạo ra chapter truyện hấp dẫn dựa trên sáng tạo của bạn",
              },
              {
                step: "4",
                icon: "🔀",
                title: "Chọn hướng đi",
                desc: "Mỗi chapter kết thúc bằng các lựa chọn — bạn quyết định câu chuyện",
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-3xl">
                    {item.icon}
                  </div>
                  <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {item.step}
                  </div>
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Genre Preview */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="mb-4 text-center text-3xl font-bold">Thể loại phong phú</h2>
          <p className="mb-12 text-center text-muted-foreground">
            Hàng chục thể loại truyện đang chờ bạn khám phá
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {GENRES.map((genre) => (
              <Link
                key={genre.id}
                href={`/play/setup?genre=${genre.id}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5"
              >
                <span className="text-4xl transition-transform group-hover:scale-110">
                  {genre.icon}
                </span>
                <span className="text-sm font-medium">{genre.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold">Tính năng nổi bật</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "🌲",
                title: "Cây phân nhánh",
                desc: "Quay lại bất kỳ chapter nào và thử lựa chọn khác. Khám phá mọi kết cục có thể.",
              },
              {
                icon: "📊",
                title: "Hồ sơ nhân vật",
                desc: "Theo dõi stats, kỹ năng, items của nhân vật chính. AI tự động cập nhật sau mỗi chapter.",
              },
              {
                icon: "🌐",
                title: "Cộng đồng",
                desc: "Chia sẻ truyện với cộng đồng. Đọc và like truyện từ những người chơi khác.",
              },
              {
                icon: "🎨",
                title: "Dark Mode",
                desc: "Giao diện tối mặc định, tối ưu cho trải nghiệm đọc truyện dài.",
              },
              {
                icon: "📱",
                title: "Mobile Friendly",
                desc: "Chơi mượt mà trên mọi thiết bị — điện thoại, tablet, máy tính.",
              },
              {
                icon: "💾",
                title: "Auto-save",
                desc: "Tự động lưu tiến trình. Quay lại bất cứ lúc nào để tiếp tục câu chuyện.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border/50 bg-card p-6"
              >
                <span className="mb-3 block text-3xl">{feature.icon}</span>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h2 className="mb-4 text-3xl font-bold">Sẵn sàng chưa?</h2>
          <p className="mb-8 text-muted-foreground">
            5 chapter miễn phí — Không cần đăng ký. Bắt đầu ngay!
          </p>
          <Link href="/play/genre" className={cn(btnBase, btnDefault, btnLg, "gap-2 text-base px-8")}>
            ✨ Bắt đầu viết truyện
          </Link>
        </div>
      </section>
    </div>
  );
}
