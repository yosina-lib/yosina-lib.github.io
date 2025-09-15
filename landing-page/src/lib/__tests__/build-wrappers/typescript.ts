import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { BuildContext, BuildResult, BuildWrapper } from "./common";
import { build } from "./common";
import { VERSIONS } from "./versions";

type Params = {
  code: string;
  sourceFile: string;
};

const wrapperSpec: BuildWrapper<Params> = {
  checkPrerequisites: async (): Promise<void> => {},
  provision: async (context): Promise<Params> => {
    // Write the TypeScript file
    await writeFile(
      path.join(context.projectDir, "index.ts"),
      context.params.code,
    );

    // Create a minimal tsconfig.json for ESM
    const tsconfig = {
      compilerOptions: {
        target: "ES2022",
        module: "ES2022",
        lib: ["ES2022"],
        outDir: "./dist",
        rootDir: "./",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        moduleResolution: "bundler",
        allowSyntheticDefaultImports: true,
      },
    };
    await writeFile(
      path.join(context.projectDir, "tsconfig.json"),
      JSON.stringify(tsconfig, null, 2),
    );

    // Create package.json with ESM support
    const packageJson = {
      name: "typescript-test",
      version: "1.0.0",
      type: "module",
      main: "./dist/index.js",
      exports: {},
      engines: {
        node: VERSIONS.typescript.runtime,
      },
      dependencies: {
        [VERSIONS.typescript.library.name]: VERSIONS.typescript.library.version,
      },
      devDependencies: {
        typescript: VERSIONS.typescript.language,
        "@types/node": VERSIONS.typescript.runtime,
      },
    };
    await writeFile(
      path.join(context.projectDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
    );
    return context.params;
  },
  commands: (_context) => {
    return Promise.resolve([
      Promise.resolve("npm install"),
      Promise.resolve("npx tsc"),
    ]);
  },
};

export const buildTypeScript = async (
  code: string,
  tempDir: string,
): Promise<BuildResult> => {
  const context: BuildContext<Params> = {
    projectDir: path.join(tempDir, "typescript-test"),
    params: {
      sourceFile: "index.ts",
      code: code,
    },
  };
  return await build(wrapperSpec, context);
};
