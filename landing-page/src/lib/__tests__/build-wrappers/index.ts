export { buildCSharp } from "./csharp";
export { buildDart } from "./dart";
export { buildGo } from "./go";
export { buildJava } from "./java";
export { buildPHP } from "./php";
export { buildPython } from "./python";
export { buildRuby } from "./ruby";
export { buildRust } from "./rust";
export { buildSwift } from "./swift";
export type { BuildResult } from "./typescript";
export { buildTypeScript } from "./typescript";

export const buildWrappers = {
  typescript: require("./typescript").buildTypeScript,
  python: require("./python").buildPython,
  go: require("./go").buildGo,
  rust: require("./rust").buildRust,
  ruby: require("./ruby").buildRuby,
  csharp: require("./csharp").buildCSharp,
  java: require("./java").buildJava,
  php: require("./php").buildPHP,
  swift: require("./swift").buildSwift,
  dart: require("./dart").buildDart,
} as const;
