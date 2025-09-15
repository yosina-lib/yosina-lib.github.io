import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const supportedLocales = ["en", "ja"];

// Get the preferred locale, similar to the above or using a library
function getLocale(request: NextRequest) {
  return request.headers.get("Accept-Language")?.startsWith("ja") ? "ja" : "en";
}

export const middleware = (request: NextRequest): NextResponse | undefined => {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    return undefined;
  }

  // Redirect if there is no locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  // e.g. incoming request is /products
  // The new URL is now /en-US/products
  return NextResponse.redirect(request.nextUrl);
};

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!_next).*)",
    // Optional: only run on root (/) URL
    // '/'
  ],
};
