import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const supportedLocales = ["en", "ja"];

// Get the preferred locale, similar to the above or using a library
function getLocale(request: NextRequest) {
  return request.headers.get("Accept-Language")?.startsWith("ja") ? "ja" : "en";
}

export const middleware = (request: NextRequest): NextResponse | undefined => {
  const { pathname } = request.nextUrl;

  // Skip internal paths (_next)
  if (pathname.startsWith("/_next")) {
    return undefined;
  }

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = supportedLocales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    return undefined;
  }

  // Redirect if there is no locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
};
