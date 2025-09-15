import type { TransliterationRecipe } from "@yosina-lib/yosina";

export type SupportedLanguages =
  | "typescript"
  | "go"
  | "rust"
  | "python"
  | "ruby"
  | "csharp"
  | "java"
  | "php"
  | "swift"
  | "dart";

// String escape functions for different languages
const escapeForJavaScript = (str: string): string => {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
};

const escapeForDoubleQuotedString = (str: string): string => {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
};

const escapeForPHP = (str: string): string => {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
};

const codeExampleRenderers: {
  [key in SupportedLanguages]: (recipeAndText: {
    recipe: TransliterationRecipe;
    text: string;
  }) => string;
} = {
  typescript: (recipeAndText) => {
    const recipeFields = Object.entries(recipeAndText.recipe)
      .flatMap(([key, value]) => {
        if (value === undefined || value === false) return [];
        // TypeScript accepts boolean or string literals for toFullwidth and toHalfwidth
        return [`${key}: ${typeof value === "string" ? `"${value}"` : value}`];
      })
      .join(",\n        ");

    const inputText = recipeAndText.text || "こんにちは世界";
    const escapedInputText = escapeForJavaScript(inputText);

    const recipeContent = recipeFields
      ? `\n        ${recipeFields}\n      `
      : "";

    return `
    import { makeTransliterator, TransliterationRecipe } from '@yosina-lib/yosina';

    async function main() {
      // Create a recipe with the same options from the demo
      const recipe: TransliterationRecipe = {${recipeContent}};

      const transliterator = await makeTransliterator(recipe);
      const result = transliterator('${escapedInputText}');
      console.log(result);
    }

    main().catch(console.error);
  `;
  },
  go: (recipeAndText) => {
    const recipeAssignments = Object.entries(recipeAndText.recipe)
      .flatMap(([key, value]) => {
        if (value === undefined || value === false) return [];
        // Convert camelCase to PascalCase for Go
        const goKey = key.charAt(0).toUpperCase() + key.slice(1);
        if (key === "toFullwidth") {
          // Go uses enum values: No, Yes, U005cAsYenSign
          if (value === true) {
            return [`r.${goKey} = recipe.Yes`];
          } else if (value === "u005c-as-yen-sign") {
            return [`r.${goKey} = recipe.U005cAsYenSign`];
          }
          // false is handled by the initial check above
          return [];
        }
        if (key === "toHalfwidth") {
          // Go uses enum values: No, Yes, HankakuKana
          if (value === true) {
            return [`r.${goKey} = recipe.Yes`];
          } else if (value === "hankaku-kana") {
            return [`r.${goKey} = recipe.HankakuKana`];
          }
          return [];
        }
        // HiraKata is a string field in Go
        if (key === "hiraKata" && typeof value === "string") {
          return [`r.${goKey} = "${value}"`];
        }
        // ReplaceCircledOrSquaredCharacters uses TransliterationRecipeOptionValue
        if (key === "replaceCircledOrSquaredCharacters" && value === true) {
          return [`r.ReplaceCircledOrSquaredCharacters = recipe.Yes`];
        }
        // ReplaceHyphens uses ReplaceHyphensOption struct
        if (key === "replaceHyphens" && value === true) {
          return [`r.ReplaceHyphens = recipe.NewReplaceHyphensOption(true)`];
        }
        // Most boolean fields are just bool type
        if (typeof value === "boolean") {
          return [`r.${goKey} = ${value}`];
        }
        return [
          `r.${goKey} = ${typeof value === "string" ? `"${value}"` : value}`,
        ];
      })
      .join("\n        ");

    const inputText = recipeAndText.text || "こんにちは世界";
    const escapedInputText = escapeForDoubleQuotedString(inputText);

    const assignmentsSection = recipeAssignments
      ? `\n        ${recipeAssignments}\n        `
      : "";

    return `
    package main

    import (
        "fmt"
        "log"
        "github.com/yosina-lib/yosina/go/recipe"
    )

    func main() {
        r := recipe.NewTransliterationRecipe()${assignmentsSection}
        transliterator, err := recipe.MakeTransliterator(r)
        if err != nil {
            log.Fatal(err)
        }
        
        result := transliterator("${escapedInputText}")
        fmt.Println(result)
    }
  `;
  },
  rust: (recipeAndText) => {
    // Track which types we need to import
    const usedTypes = new Set<string>();

    // Generate Rust struct fields from the recipe
    const rustRecipeFields = Object.entries(recipeAndText.recipe)
      .flatMap(([key, value]) => {
        if (value === undefined || value === false) return [];

        // Convert camelCase to snake_case for Rust
        const rustKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();

        // Handle special boolean options that need enum values
        if (rustKey === "to_fullwidth") {
          usedTypes.add("ToFullWidthOptions");
          if (value === true) {
            return [
              "to_fullwidth: ToFullWidthOptions::Yes { u005c_as_yen_sign: false }",
            ];
          } else if (value === "u005c-as-yen-sign") {
            return [
              "to_fullwidth: ToFullWidthOptions::Yes { u005c_as_yen_sign: true }",
            ];
          } else {
            return ["to_fullwidth: ToFullWidthOptions::No"];
          }
        } else if (rustKey === "to_halfwidth") {
          usedTypes.add("ToHalfwidthOptions");
          if (value === true) {
            return [
              "to_halfwidth: ToHalfwidthOptions::Yes { hankaku_kana: false }",
            ];
          } else if (value === "hankaku-kana") {
            return [
              "to_halfwidth: ToHalfwidthOptions::Yes { hankaku_kana: true }",
            ];
          }
          return [];
        } else if (
          rustKey === "replace_circled_or_squared_characters" &&
          typeof value === "boolean" &&
          value
        ) {
          usedTypes.add("ReplaceCircledOrSquaredCharactersOptions");
          return [
            "replace_circled_or_squared_characters: ReplaceCircledOrSquaredCharactersOptions::Yes { exclude_emojis: false }",
          ];
        } else if (
          rustKey === "replace_hyphens" &&
          typeof value === "boolean" &&
          value
        ) {
          usedTypes.add("ReplaceHyphensOptions");
          return [
            "replace_hyphens: ReplaceHyphensOptions::Yes { precedence: vec![] }",
          ];
        } else if (
          rustKey === "remove_ivs_svs" &&
          typeof value === "boolean" &&
          value
        ) {
          usedTypes.add("RemoveIVSSVSOptions");
          return [
            "remove_ivs_svs: RemoveIVSSVSOptions::Yes { drop_all_selectors: false }",
          ];
        } else if (rustKey === "hira_kata" && typeof value === "string") {
          usedTypes.add("HiraKataOptions");
          if (value === "hira-to-kata") {
            return ["hira_kata: HiraKataOptions::HiraToKata"];
          } else if (value === "kata-to-hira") {
            return ["hira_kata: HiraKataOptions::KataToHira"];
          }
          return [];
        }

        // Handle regular boolean values
        if (typeof value === "boolean") {
          return [`${rustKey}: ${value}`];
        }

        return [
          `${rustKey}: ${
            typeof value === "string" ? `"${value}".to_string()` : value
          }`,
        ];
      })
      .join(",\n            ");

    const inputText = recipeAndText.text || "こんにちは世界";

    const fieldsContent = rustRecipeFields
      ? `\n            ${rustRecipeFields},\n            `
      : "\n            ";

    // Build the use statement with only the types we need
    const useStatement =
      usedTypes.size > 0
        ? `use yosina::recipes::{${Array.from(usedTypes).join(", ")}};\n    `
        : "";

    return `
    use yosina::{make_transliterator, TransliterationRecipe};
    ${useStatement}
    fn main() {
        let recipe = TransliterationRecipe {${fieldsContent}..Default::default()
        };

        let transliterator = make_transliterator(&recipe)
            .expect("Failed to create transliterator");
        let result = transliterator("${escapeForDoubleQuotedString(inputText)}")
            .expect("Failed to transliterate");
        println!("{}", result);
    }
  `;
  },
  python: (recipeAndText) => {
    const recipeArgs = Object.entries(recipeAndText.recipe)
      .flatMap(([key, value]) => {
        if (value === undefined || value === false) return [];
        // Convert camelCase to snake_case for Python
        const pythonKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        // Python accepts bool or string literals for to_fullwidth, to_halfwidth and hira_kata
        return [
          `${pythonKey}=${typeof value === "string" ? `"${value}"` : "True"}`,
        ];
      })
      .join(",\n        ");

    const inputText = recipeAndText.text || "こんにちは世界";
    const escapedInputText = escapeForDoubleQuotedString(inputText);

    const argsContent = recipeArgs ? `\n        ${recipeArgs}\n    ` : "";

    return `
    from yosina import make_transliterator, TransliterationRecipe

    # Create a recipe with the same options from the demo
    recipe = TransliterationRecipe(${argsContent})

    transliterator = make_transliterator(recipe)
    result = transliterator("${escapedInputText}")
    print(result)
  `;
  },
  ruby: (recipeAndText) => {
    const recipeParams = Object.entries(recipeAndText.recipe)
      .flatMap(([key, value]) => {
        if (value === undefined || value === false) return [];
        // Convert camelCase to snake_case for Ruby
        const rubyKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        // Ruby accepts bool or string for to_fullwidth and to_halfwidth
        return [
          `${rubyKey}: ${typeof value === "string" ? `'${value}'` : value}`,
        ];
      })
      .join(",\n      ");

    const inputText = recipeAndText.text || "こんにちは世界";
    const escapedInputText = escapeForDoubleQuotedString(inputText);

    const paramsContent = recipeParams ? `\n      ${recipeParams}\n    ` : "";

    return `
    require 'yosina'

    # Create a recipe with the same options from the demo
    recipe = Yosina::TransliterationRecipe.new(${paramsContent})

    transliterator = Yosina.make_transliterator(recipe)
    result = transliterator.call("${escapedInputText}")
    puts result
  `;
  },
  csharp: (recipeAndText) => {
    const recipeProperties = Object.entries(recipeAndText.recipe)
      .flatMap(([key, value]) => {
        if (value === undefined || value === false) return [];
        // Convert camelCase to PascalCase for C#
        const csharpKey = key.charAt(0).toUpperCase() + key.slice(1);
        if (key === "toFullwidth") {
          // C# uses ToFullwidthOptions struct
          if (value === true) {
            return [
              `${csharpKey} = TransliterationRecipe.ToFullwidthOptions.Enabled`,
            ];
          } else if (value === "u005c-as-yen-sign") {
            return [
              `${csharpKey} = TransliterationRecipe.ToFullwidthOptions.U005cAsYenSign`,
            ];
          } else {
            return [
              `${csharpKey} = TransliterationRecipe.ToFullwidthOptions.Disabled`,
            ];
          }
        }
        if (key === "toHalfwidth") {
          // C# uses ToHalfwidthOptions struct
          if (value === true) {
            return [
              `${csharpKey} = TransliterationRecipe.ToHalfwidthOptions.Enabled`,
            ];
          } else if (value === "hankaku-kana") {
            return [
              `${csharpKey} = TransliterationRecipe.ToHalfwidthOptions.HankakuKana`,
            ];
          }
          return [];
        }
        if (key === "hiraKata" && typeof value === "string") {
          // C# uses HiraKataTransliterator.Mode enum
          if (value === "hira-to-kata") {
            return [`${csharpKey} = HiraKataTransliterator.Mode.HiraToKata`];
          } else if (value === "kata-to-hira") {
            return [`${csharpKey} = HiraKataTransliterator.Mode.KataToHira`];
          }
          return [];
        }
        return [
          `${csharpKey} = ${typeof value === "string" ? `"${value}"` : value}`,
        ];
      })
      .join(",\n        ");

    const inputText = recipeAndText.text || "こんにちは世界";
    const escapedInputText = escapeForDoubleQuotedString(inputText);

    const propertiesContent = recipeProperties
      ? `\n    {\n        ${recipeProperties}\n    }`
      : "()";

    return `
    using Yosina;
    using Yosina.Transliterators;

    // Create a recipe with the same options from the demo
    var recipe = new TransliterationRecipe${propertiesContent};

    var transliterator = Entrypoint.MakeTransliterator(recipe);
    var result = transliterator("${escapedInputText}");
    Console.WriteLine(result);
  `;
  },
  java: (recipeAndText) => {
    const recipeSetters = Object.entries(recipeAndText.recipe)
      .flatMap(([key, value]) => {
        if (value === undefined || value === false) return [];
        if (key === "toFullwidth") {
          // Java uses ToFullwidthOptions inner class
          if (value === true) {
            return [
              `.withToFullwidth(TransliterationRecipe.ToFullwidthOptions.ENABLED)`,
            ];
          } else if (value === "u005c-as-yen-sign") {
            return [
              `.withToFullwidth(TransliterationRecipe.ToFullwidthOptions.U005C_AS_YEN_SIGN)`,
            ];
          }
          return [];
        }
        if (key === "toHalfwidth") {
          // Java uses ToHalfwidthOptions inner class
          if (value === true) {
            return [
              `.withToHalfwidth(TransliterationRecipe.ToHalfwidthOptions.ENABLED)`,
            ];
          } else if (value === "hankaku-kana") {
            return [
              `.withToHalfwidth(TransliterationRecipe.ToHalfwidthOptions.HANKAKU_KANA)`,
            ];
          }
          return [];
        }
        if (key === "hiraKata" && typeof value === "string") {
          // Java uses withHiraKata method
          return [`.withHiraKata("${value}")`];
        }
        // Special handling for properties that have different names in Java
        if (key === "replaceCircledOrSquaredCharacters") {
          return [
            `.withReplaceCircledOrSquaredCharacters(TransliterationRecipe.ReplaceCircledOrSquaredCharactersOptions.ENABLED)`,
          ];
        }
        if (key === "replaceHyphens") {
          return [
            `.withReplaceHyphens(TransliterationRecipe.ReplaceHyphensOptions.ENABLED)`,
          ];
        }
        if (key === "replaceCombinedCharacters") {
          return [`.withReplaceCombinedCharacters(true)`];
        }
        if (key === "kanjiOldNew") {
          return [`.withKanjiOldNew(true)`];
        }
        // For other boolean properties, use with pattern
        const javaMethod = `with${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        if (typeof value === "boolean") {
          return [`.${javaMethod}(true)`];
        }
        return [
          `.${javaMethod}(${typeof value === "string" ? `"${value}"` : value})`,
        ];
      })
      .join("\n            ");

    const inputText = recipeAndText.text || "こんにちは世界";
    const escapedInputText = escapeForDoubleQuotedString(inputText);

    const settersContent = recipeSetters
      ? `\n            ${recipeSetters}`
      : "";

    return `
    import io.yosina.TransliterationRecipe;
    import io.yosina.Yosina;
    import java.util.function.Function;

    public class YosinaExample {
        public static void main(String[] args) {
            // Create a recipe with the same options from the demo
            TransliterationRecipe recipe = new TransliterationRecipe()${settersContent};

            Function<String, String> transliterator = Yosina.makeTransliteratorFromRecipe(recipe);
            String result = transliterator.apply("${escapedInputText}");
            System.out.println(result);
        }
    }
  `;
  },
  php: (recipeAndText) => {
    const recipeArgs = Object.entries(recipeAndText.recipe)
      .flatMap(([key, value]) => {
        if (value === undefined || value === false) return [];
        // PHP uses named parameters in constructor
        return [`${key}: ${typeof value === "string" ? `'${value}'` : "true"}`];
      })
      .join(",\n        ");

    const inputText = recipeAndText.text || "こんにちは世界";
    const escapedInputText = escapeForPHP(inputText);

    const argsContent = recipeArgs ? `\n        ${recipeArgs}\n    ` : "";

    return `
    <?php
    // composer install yosina-lib/yosina
    require 'vendor/autoload.php';
    
    use Yosina\\TransliterationRecipe;
    use Yosina\\Yosina;

    // Create a recipe with the same options from the demo
    $recipe = new TransliterationRecipe(${argsContent});
    
    $transliterator = Yosina::makeTransliterator($recipe);
    $result = $transliterator('${escapedInputText}');
    echo $result . PHP_EOL;
  `;
  },
  swift: (recipeAndText) => {
    /*
    const argsContent = (() => {
      const recipeArgs = Object.entries(recipeAndText.recipe)
        .flatMap(([key, value]) => {
          if (value === undefined || value === false) return [];
          if (key === "toFullwidth") {
            // Swift uses ToFullwidthOptions struct
            if (value === true) {
              return [`${key}: .enabled`];
            } else if (value === "u005c-as-yen-sign") {
              return [`${key}: .u005cAsYenSign`];
            } else {
              return [`${key}: .disabled`];
            }
          }
          if (key === "toHalfwidth") {
            // Swift uses ToHalfwidthOptions struct
            if (value === true) {
              return [`${key}: .enabled`];
            } else if (value === "hankaku-kana") {
              return [`${key}: .hankakuKana`];
            }
            return [];
          }
          if (key === "hiraKata") {
            switch (value) {
              case "hira-to-kata":
                return [`${key}: .hiraToKata`];
              case "kata-to-hira":
                return [`${key}: .kataToHira`];
            }
          }
          return [`${key}: ${typeof value === "string" ? `"${value}"` : value}`];
        })
        .join(",\n            ");

      return recipeArgs
        ? `\n            ${recipeArgs}\n        `
        : "";
    })();
    */
    const argsContent = (() => {
      const recipeArgs = Object.entries(recipeAndText.recipe)
        .flatMap(([key, value]) => {
          if (value === undefined || value === false) return [];
          if (key === "toFullwidth") {
            // Swift uses ToFullwidthOptions struct
            if (value === true) {
              return [`recipe.${key} = .enabled`];
            } else if (value === "u005c-as-yen-sign") {
              return [`recipe.${key} = .u005cAsYenSign`];
            } else {
              return [`recipe.${key} = .disabled`];
            }
          }
          if (key === "toHalfwidth") {
            // Swift uses ToHalfwidthOptions struct
            if (value === true) {
              return [`recipe.${key} = .enabled`];
            } else if (value === "hankaku-kana") {
              return [`recipe.${key} = .hankakuKana`];
            }
            return [];
          }
          if (key === "hiraKata") {
            switch (value) {
              case "hira-to-kata":
                return [`recipe.${key} = .hiraToKata`];
              case "kata-to-hira":
                return [`recipe.${key} = .kataToHira`];
            }
          }
          if (key === "replaceCircledOrSquaredCharacters") {
            if (value) {
              return [`recipe.${key} = .enabled`];
            }
            return [];
          }
          return [
            `recipe.${key} = ${typeof value === "string" ? `"${value}"` : value}`,
          ];
        })
        .join("\n        ");

      return recipeArgs;
    })();
    const inputText = recipeAndText.text || "こんにちは世界";
    const escapedInputText = escapeForDoubleQuotedString(inputText);

    return `
    // swift package add yosina-lib/yosina-swift
    import Yosina

    do {
        // Create a recipe with the same options from the demo
        var recipe = TransliterationRecipe()
        ${argsContent}

        let transliterator = try recipe.makeTransliterator()
        let result = transliterator.transliterate("${escapedInputText}")
        print(result)
    } catch {
        print("Error: \\(error)")
    }
  `;
  },
  dart: (recipeAndText) => {
    const recipeParams = Object.entries(recipeAndText.recipe)
      .flatMap(([key, value]) => {
        if (value === undefined || value === false) return [];
        switch (key) {
          case "toFullwidth":
            // Dart uses ToFullwidthOptions class with named constructors
            switch (value) {
              case true:
                return [`${key}: ToFullwidthOptions.enabled()`];
              case "u005c-as-yen-sign":
                return [`${key}: ToFullwidthOptions.u005cAsYenSign()`];
              default:
                return [`${key}: ToFullwidthOptions.disabled()`];
            }
          case "replaceCircledOrSquaredCharacters":
            // Dart uses ReplaceCircledOrSquaredCharactersOptions class
            if (value === true) {
              return [
                `${key}: ReplaceCircledOrSquaredCharactersOptions.enabled()`,
              ];
            }
            return [];
          case "toHalfwidth":
            // Dart uses named constructors or string values
            switch (value) {
              case true:
                return [`${key}: true`];
              case "hankaku-kana":
                return [`${key}: "hankaku-kana"`];
              default:
                return [];
            }
        }
        return [`${key}: ${typeof value === "string" ? `"${value}"` : value}`];
      })
      .join(",\n        ");

    const inputText = recipeAndText.text || "こんにちは世界";
    const escapedInputText = escapeForJavaScript(inputText);

    const paramsContent = recipeParams
      ? `\n        ${recipeParams},\n      `
      : "";

    return `
    import 'package:yosina/yosina.dart';

    void main() {
      // Create a recipe with the same options from the demo
      final recipe = TransliterationRecipe(${paramsContent});

      final transliterator = Transliterator.withRecipe(recipe);
      final result = transliterator(Chars.fromString('${escapedInputText}'));
      print(Chars.charsToString(result));
    }
  `;
  },
};

const detectBaseIndent = (s: string): string => {
  const m = s.match(/^\n([ \t]*)/);
  return m !== null ? m[1] : "";
};

export const renderCodeExample = (
  language: SupportedLanguages,
  recipeAndText: { recipe: TransliterationRecipe; text: string },
): string => {
  const example =
    codeExampleRenderers[language as SupportedLanguages](recipeAndText);
  const indent = detectBaseIndent(example);
  return example
    .split("\n")
    .map((l) => l.slice(indent.length))
    .join("\n")
    .trim();
};
