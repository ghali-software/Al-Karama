import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

const supabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function middleware(request: NextRequest) {
  // Run next-intl middleware for locale routing
  const intlResponse = intlMiddleware(request);

  // Skip auth check if Supabase is not configured
  if (!supabaseConfigured) {
    return intlResponse;
  }

  // Run Supabase session refresh
  try {
    const { user, supabaseResponse } = await updateSession(request);

    // Copy Supabase cookies to the intl response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value);
    });

    // Check if the user is trying to access a protected route
    const pathname = request.nextUrl.pathname;
    const isLoginPage =
      pathname.includes("/login") || pathname === "/fr" || pathname === "/ar" || pathname === "/";
    const isApiRoute = pathname.startsWith("/api");

    if (!user && !isLoginPage && !isApiRoute) {
      const locale = pathname.startsWith("/ar") ? "ar" : "fr";
      const loginUrl = new URL(`/${locale}/login`, request.url);
      const redirectResponse = NextResponse.redirect(loginUrl);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }
  } catch {
    // Supabase error, continue without auth check
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
