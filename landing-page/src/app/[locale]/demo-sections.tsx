"use client";

import type { ReactNode } from "react";
import { createContext, useCallback, useState } from "react";
import { default as SyntaxHighlighter } from "react-syntax-highlighter";
import { nord } from "react-syntax-highlighter/dist/esm/styles/hljs";
import type { SupportedLanguages } from "@/lib/codegen";
import { renderCodeExample } from "@/lib/codegen";
import { Tab, Tabs } from "./_components/tabs";
import type { RecipeAndText } from "./demo";
import { Demo } from "./demo";
import { defaultLocaleContext, type LocaleContext } from "./i18n";

const defaultRecipeAndText: RecipeAndText = {
  recipe: {
    toFullwidth: true,
  },
  text: "",
};

export const pageLocaleContext =
  createContext<LocaleContext>(defaultLocaleContext);

export default ({
  localeContext,
}: {
  localeContext: LocaleContext;
}): ReactNode => {
  const { catalog } = localeContext;
  const [language, setLanguage] = useState<SupportedLanguages>("typescript");
  const [recipeAndText, setRecipeAndText] =
    useState<RecipeAndText>(defaultRecipeAndText);
  const onLanguageChange = useCallback((value: string) => {
    setLanguage(value as SupportedLanguages);
  }, []);
  const onRecipeChange = useCallback((value: RecipeAndText) => {
    setRecipeAndText(value);
  }, []);

  return (
    <pageLocaleContext.Provider value={localeContext}>
      <section className="mt-3 flex-1 sm:mt-6 md:mt-14">
        <h2 className="mb-2 text-center text-gray-400 text-lg sm:mb-4 sm:text-2xl">
          {catalog["See it in action:"]}
        </h2>
        <Demo onRecipeChange={onRecipeChange} />
      </section>
      <section className="mt-3 sm:mt-8">
        <h2 className="mb-2 text-center text-gray-400 text-lg sm:mb-4 sm:text-2xl">
          {catalog["Actual code examples:"]}
        </h2>
        <Tabs
          tabHighlightClassName="text-blue-500 border-blue-500"
          name="code-example"
          onChange={onLanguageChange}
          defaultValue={language}
        >
          <Tab value="typescript">TypeScript</Tab>
          <Tab value="go">Go</Tab>
          <Tab value="rust">Rust</Tab>
          <Tab value="python">Python</Tab>
          <Tab value="ruby">Ruby</Tab>
          <Tab value="csharp">C#</Tab>
          <Tab value="java">Java</Tab>
          <Tab value="php">PHP</Tab>
          <Tab value="swift">Swift</Tab>
          <Tab value="dart">Dart</Tab>
        </Tabs>
        <SyntaxHighlighter
          language={language}
          className="h-80 text-xs md:text-sm"
          style={nord}
        >
          {renderCodeExample(language, recipeAndText)}
        </SyntaxHighlighter>
      </section>
    </pageLocaleContext.Provider>
  );
};
