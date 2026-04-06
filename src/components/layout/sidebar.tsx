"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  LayoutDashboard,
  ScanLine,
  Users,
  Truck,
  FileText,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "scan", href: "/scan", icon: ScanLine },
  { key: "patients", href: "/patients", icon: Users },
  { key: "caravans", href: "/caravans", icon: Truck },
  { key: "reports", href: "/reports", icon: FileText },
] as const;

export function Sidebar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-[260px] md:flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-[72px] items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary/20">
          <Heart className="h-5 w-5 text-sidebar-primary" />
        </div>
        <div>
          <span className="text-base font-semibold tracking-tight text-white">
            Al Karama
          </span>
          <p className="text-[11px] text-sidebar-foreground/50 leading-none mt-0.5">
            Caravanes Medicales
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-1">
        {navItems.map((item) => {
          const href = `/${locale}${item.href}`;
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
                  : "text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors",
                  isActive ? "text-sidebar-primary" : ""
                )}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4">
        <div className="rounded-xl bg-sidebar-accent/40 p-3">
          <p className="text-[11px] text-sidebar-foreground/40 leading-relaxed">
            Association Al Karama pour le developpement et la Solidarite
          </p>
        </div>
      </div>
    </aside>
  );
}
