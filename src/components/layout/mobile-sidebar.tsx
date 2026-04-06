"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ScanLine,
  Users,
  Truck,
  FileText,
  Heart,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "scan", href: "/scan", icon: ScanLine },
  { key: "patients", href: "/patients", icon: Users },
  { key: "caravans", href: "/caravans", icon: Truck },
  { key: "reports", href: "/reports", icon: FileText },
] as const;

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side={locale === "ar" ? "right" : "left"} className="w-64 p-0">
        <div className="flex h-16 items-center gap-2 px-6 border-b border-border">
          <Heart className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">Al Karama</span>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const href = `/${locale}${item.href}`;
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={item.key}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
