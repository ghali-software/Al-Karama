"use client";

import { useTranslations, useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileSidebar } from "./mobile-sidebar";
import { LogOut } from "lucide-react";

export function Header() {
  const t = useTranslations("auth");
  const locale = useLocale();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${locale}/login`;
  }

  return (
    <header className="flex h-[64px] items-center justify-between border-b border-border/60 bg-white/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
        <MobileSidebar />
      </div>
      <div className="flex items-center gap-1">
        <LocaleSwitcher />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline text-[13px]">{t("logout")}</span>
        </Button>
      </div>
    </header>
  );
}
