import { tmpdir } from "node:os";
import path from "node:path";
import type { TransliterationRecipe } from "@yosina-lib/yosina";
import { renderCodeExample, type SupportedLanguages } from "../codegen";
import { type BuildResult, buildWrappers } from "./build-wrappers";

// Define validation functions that run for all tests per language
const languageValidations: Record<SupportedLanguages, (code: string) => void> =
  {
    typescript: (code) => {
      expect(code).toContain("import { makeTransliterator");
      expect(code).toContain("TransliterationRecipe");
      // Verify ESM syntax
      expect(code).toContain("import {");
      expect(code).not.toContain("require(");
      expect(code).not.toContain("module.exports");
      expect(code).toContain("async function main()");
      expect(code).toContain("await makeTransliterator");

      // Should not use CommonJS-specific globals
      expect(code).not.toContain("require(");
      expect(code).not.toContain("module.exports");
      expect(code).not.toContain("exports.");

      expect(code).not.toContain("__dirname");
      expect(code).not.toContain("__filename");
      expect(code).not.toContain("require.resolve");
    },
    python: (code) => {
      expect(code).toContain("from yosina import");
      expect(code).toContain("make_transliterator");
    },
    go: (code) => {
      expect(code).toContain("package main");
      expect(code).toContain("github.com/yosina-lib/yosina/go/recipe");
    },
    rust: (code) => {
      expect(code).toContain("use yosina::");
      expect(code).toContain("make_transliterator");
    },
    ruby: (code) => {
      expect(code).toContain("require 'yosina'");
      expect(code).toContain("Yosina::TransliterationRecipe");
    },
    csharp: (code) => {
      expect(code).toContain("using Yosina;");
      expect(code).toContain("TransliterationRecipe");
    },
    java: (code) => {
      expect(code).toContain("import io.yosina");
      expect(code).toContain("TransliterationRecipe");
    },
    php: (code) => {
      expect(code).toContain("use Yosina\\TransliterationRecipe");
      expect(code).toContain("Yosina::makeTransliterator");
    },
    swift: (code) => {
      expect(code).toContain("import Yosina");
      expect(code).toContain("TransliterationRecipe");
    },
    dart: (code) => {
      expect(code).toContain("import 'package:yosina/yosina.dart'");
      expect(code).toContain("TransliterationRecipe");
    },
  };

// Test parameters for different recipe configurations
const testRecipes: {
  name: string;
  recipe: TransliterationRecipe;
  text: string;
  includeInBuildTest?: boolean; // Whether to include this recipe in build tests
  validations?: Partial<Record<SupportedLanguages, (code: string) => void>>; // Language-specific validations
}[] = [
  {
    name: "basic recipe with hiragana to katakana",
    recipe: { hiraKata: "hira-to-kata" },
    text: "ひらがな",
    includeInBuildTest: true,
  },
  {
    name: "recipe with full-width conversion",
    recipe: { toFullwidth: true },
    text: "ABC123",
  },
  {
    name: "recipe with full-width yen sign",
    recipe: { toFullwidth: "u005c-as-yen-sign" },
    text: "Path\\to\\file",
  },
  {
    name: "recipe with half-width conversion",
    recipe: { toHalfwidth: true },
    text: "ＡＢＣ１２３",
  },
  {
    name: "recipe with half-width kana",
    recipe: { toHalfwidth: "hankaku-kana" },
    text: "カタカナ",
  },
  {
    name: "recipe with multiple options",
    recipe: {
      hiraKata: "kata-to-hira",
      toFullwidth: true,
      replaceCircledOrSquaredCharacters: true,
      kanjiOldNew: true,
    },
    text: "旧字体のカタカナ㊀",
    includeInBuildTest: true,
  },
  {
    name: "recipe with all boolean options",
    recipe: {
      toFullwidth: true,
      replaceCircledOrSquaredCharacters: true,
      replaceHyphens: true,
      replaceCombinedCharacters: true,
      kanjiOldNew: true,
      removeIVSSVS: true,
    },
    text: "テスト文字列",
  },
  {
    name: "empty recipe",
    recipe: {},
    text: "そのまま",
    includeInBuildTest: true,
  },
  // Edge cases
  {
    name: "empty text",
    recipe: { hiraKata: "hira-to-kata" },
    text: "",
  },
  {
    name: "text with double quotes",
    recipe: {},
    text: 'Text with "quotes"',
  },
  {
    name: "text with single quotes",
    recipe: {},
    text: "Text with 'single quotes'",
  },
  {
    name: "text with backslash",
    recipe: {},
    text: "Text with \\backslash",
  },
  {
    name: "text with newline",
    recipe: {},
    text: "Text with\nnewline",
  },
  {
    name: "text with tab",
    recipe: {},
    text: "Text with\ttab",
  },
  {
    name: "recipe with all options disabled",
    recipe: {
      toFullwidth: false,
      toHalfwidth: false,
      replaceCircledOrSquaredCharacters: false,
      replaceHyphens: false,
      replaceCombinedCharacters: false,
      kanjiOldNew: false,
      removeIVSSVS: false,
    },
    text: "test",
    validations: {
      // For most languages, false values should not appear in the output
      typescript: (code) => {
        expect(code).not.toContain(": false");
        expect(code).not.toContain("= false");
      },
      python: (code) => {
        expect(code).not.toContain("False");
        expect(code).not.toContain("=False");
      },
      go: (code) => {
        expect(code).not.toContain("= false");
      },
      // Rust uses ..Default::default() so false values are expected to not appear
      ruby: (code) => {
        expect(code).not.toContain(": false");
        expect(code).not.toContain("false");
      },
      csharp: (code) => {
        expect(code).not.toContain("= false");
      },
      java: (code) => {
        expect(code).not.toContain("(false)");
      },
      php: (code) => {
        expect(code).not.toContain(": false");
      },
      swift: (code) => {
        expect(code).not.toContain(": false");
        expect(code).not.toContain("= false");
      },
      dart: (code) => {
        expect(code).not.toContain(": false");
      },
    },
  },
];

// Get recipes for build testing
const buildTestRecipes = testRecipes.filter((r) => r.includeInBuildTest);

// Unified language configuration with metadata and build wrappers
const languageConfig: {
  [key in SupportedLanguages]: {
    name: string;
    buildWrapper?: (typeof buildWrappers)[SupportedLanguages];
  };
} = {
  typescript: {
    name: "TypeScript",
    get buildWrapper() {
      return buildWrappers.typescript;
    },
  },
  python: {
    name: "Python",
    get buildWrapper() {
      return buildWrappers.python;
    },
  },
  go: {
    name: "Go",
    get buildWrapper() {
      return buildWrappers.go;
    },
  },
  rust: {
    name: "Rust",
    get buildWrapper() {
      return buildWrappers.rust;
    },
  },
  ruby: {
    name: "Ruby",
    get buildWrapper() {
      return buildWrappers.ruby;
    },
  },
  csharp: {
    name: "C#",
    get buildWrapper() {
      return buildWrappers.csharp;
    },
  },
  java: {
    name: "Java",
    get buildWrapper() {
      return buildWrappers.java;
    },
  },
  php: {
    name: "PHP",
    get buildWrapper() {
      return buildWrappers.php;
    },
  },
  swift: {
    name: "Swift",
    get buildWrapper() {
      return buildWrappers.swift;
    },
  },
  dart: {
    name: "Dart",
    get buildWrapper() {
      return buildWrappers.dart;
    },
  },
};

// Extract languages array from the config
const languages = Object.keys(languageConfig) as SupportedLanguages[];

describe("Code Generation Tests", () => {
  const tempDir = path.join(tmpdir(), "codegen-tests");

  // Create test cases for each language and recipe combination
  const testCases = languages.flatMap((language) =>
    testRecipes.map((recipe) => ({
      language,
      languageName: languageConfig[language].name,
      ...recipe,
    })),
  );

  // Test code generation for each language
  describe("renderCodeExample", () => {
    test.each(testCases)(
      "$languageName: $name",
      ({ language, recipe, text, validations }) => {
        const code = renderCodeExample(language, { recipe, text });

        // Basic validation
        expect(code).toBeTruthy();
        expect(code.length).toBeGreaterThan(50); // Should generate substantial code

        // Run base language validations
        languageValidations[language](code);

        // Check that the input text is included
        if (text) {
          // For special characters, check if the text appears literally or escaped
          if (
            text.includes("\\") ||
            text.includes('"') ||
            text.includes("'") ||
            text.includes("\n") ||
            text.includes("\t")
          ) {
            // For special characters, just verify the code is properly generated
            // The exact escaping varies by language, so we just check length
            expect(code.length).toBeGreaterThan(text.length);
          } else {
            // For regular text, it should appear in the code
            expect(code).toContain(text);
          }
        }

        // Run test-specific language validation if provided
        if (validations?.[language]) {
          validations[language](code);
        }
      },
    );
  });

  // Build validation tests
  describe("Build Validation", () => {
    // Set longer timeout for build tests
    jest.setTimeout(60000); // 60 seconds

    // Create build test cases for each language and build recipe combination
    const buildTestCases = languages.flatMap((language) =>
      buildTestRecipes.map((recipe) => ({
        language,
        languageName: languageConfig[language].name,
        config: languageConfig[language],
        ...recipe,
      })),
    );

    test.each(buildTestCases)(
      "$languageName: $name",
      async ({ language, config, recipe, text }) => {
        const code = renderCodeExample(language, { recipe, text });

        if (!config.buildWrapper) {
          console.warn(
            `No build wrapper for ${config.name}, skipping build test`,
          );
          return;
        }

        let result: BuildResult;
        try {
          result = await config.buildWrapper(code, tempDir);
        } catch (error) {
          // If the toolchain is not available, skip the test
          if (
            error instanceof Error &&
            (error.message.includes("command not found") ||
              error.message.includes("not found") ||
              error.message.includes("not recognized"))
          ) {
            console.warn(
              `${config.name} toolchain not available, skipping build test`,
            );
            return;
          }
          throw error;
        }

        if (!result.success) {
          console.error(`Build failed for ${config.name}:`);
          console.error("STDOUT:", result.stdout);
          console.error("STDERR:", result.stderr);
        }

        expect(result.success).toBe(true);
      },
    );
  });
});
