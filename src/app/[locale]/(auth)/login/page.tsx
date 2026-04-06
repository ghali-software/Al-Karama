"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(t("loginError"));
      setLoading(false);
      return;
    }

    window.location.href = `/${locale}/dashboard`;
  }

  return (
    <div className="min-h-[100dvh] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[480px] bg-[#0f3d2e] flex-col justify-between p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <Heart className="h-5 w-5 text-emerald-300" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Al Karama</span>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            Gestion des caravanes medicales
          </h2>
          <p className="text-emerald-200/70 text-sm leading-relaxed max-w-[340px]">
            Numerisez vos formulaires, suivez vos beneficiaires et generez des
            rapports professionnels automatiquement.
          </p>
        </div>

        <p className="text-[11px] text-emerald-200/30">
          Association Al Karama pour le developpement et la Solidarite
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#f8faf9]">
        <div className="w-full max-w-[380px] space-y-8">
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Al Karama</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("loginTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {t("loginDescription")}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">{t("email")}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
                dir="ltr"
                className="h-11 rounded-xl border-border/60 bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">{t("password")}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                className="h-11 rounded-xl border-border/60 bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-medium text-[13px] transition-all duration-200 active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("loginButton")
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
