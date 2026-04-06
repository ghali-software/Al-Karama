"use client";

import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const newLocale = locale === "fr" ? "ar" : "fr";
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  return (
    <a href={`/${newLocale}${pathWithoutLocale}`}>
      <Button variant="ghost" size="sm" className="gap-2">
        <Languages className="h-4 w-4" />
        {locale === "fr" ? "العربية" : "Français"}
      </Button>
    </a>
  );
}
