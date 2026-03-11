"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Simple flow: sign up xong đăng nhập luôn.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const msg = signInError.message.toLowerCase();
        if (
          msg.includes("email") &&
          (msg.includes("confirm") || msg.includes("verify"))
        ) {
          setError(
            "Project Supabase của bạn đang bật xác thực email. Vào Supabase > Authentication > Providers > Email và tắt 'Confirm email' để đăng ký không cần xác nhận."
          );
        } else {
          setError(signInError.message);
        }
        setLoading(false);
        return;
      }

      router.push("/play/genre");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Đăng ký</CardTitle>
          <CardDescription>
            Tạo tài khoản nhanh và vào chơi ngay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Tên hiển thị</Label>
              <Input
                id="displayName"
                placeholder="Nhà văn sáng tạo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1.5"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Đang đăng ký...
                </span>
              ) : (
                "Đăng ký"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/auth/login" className="font-medium text-foreground hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
