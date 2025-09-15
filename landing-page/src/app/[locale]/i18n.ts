const defaultCatalog = {
  "A Japanese text normalization library you've always needed":
    "A Japanese text normalization library you've always needed",
  "Yosina is a transliteration library that deals with the Japanese characters and symbols.":
    "Yosina is a transliteration library that deals with the Japanese characters and symbols.",
  "See it in action:": "See it in action:",
  "Halfwidth to Fullwidth (U+005C treated as Yen sign)":
    "Halfwidth to Fullwidth (U+005C treated as Yen sign)",
  "Fullwidth to Halfwidth": "Fullwidth to Halfwidth",
  "Fullwidth to Halfwidth (including halfwidth katakana)":
    "Fullwidth to Halfwidth (including halfwidth katakana)",
  "Hiragana to Katakana": "Hiragana to Katakana",
  "Katakana to Hiragana": "Katakana to Hiragana",
  "Replace composed characters": "Replace composed characters",
  "Replace circled or squared characters":
    "Replace circled or squared characters",
  "Normalize hyphens": "Normalize hyphens",
  "Replace traditiona kanjis to new style ones":
    "Replace traditiona kanjis to new style ones",
  "None selected; click here to add transliteration options":
    "None selected; click here to add transliteration options",
  "Insert example text": "Insert example text",
  "Actual code examples:": "Actual code examples:",
  Code: "Code",
  Specification: "Specification",
  "Yosina on GitHub": "Yosina on GitHub",
  "Further reading:": "Further reading:",
  "Transliterator specification": "Transliterator specification",
};

export type SupportedLocales = "en" | "ja";

const dictionaries: { [k in SupportedLocales]: () => Promise<Catalog> } = {
  en: async () => defaultCatalog,
  ja: async () => (await import("./ja.json")).default,
};

export type Catalog = typeof defaultCatalog;

export type LocaleContext = { locale: SupportedLocales; catalog: Catalog };

export const defaultLocaleContext: LocaleContext = {
  locale: "en",
  catalog: defaultCatalog,
};

export const getCatalog = (locale: SupportedLocales) => dictionaries[locale]();
