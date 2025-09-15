"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { supportedLocales } from "@/middleware";

export default () => {
  const router = useRouter();
  useEffect(() => {
    const userLang = window.navigator.language;
    const supportedLang =
      supportedLocales.find((locale) => userLang.startsWith(locale)) ?? "en";
    router.push(`/${supportedLang}`);
  }, [router]);
};
