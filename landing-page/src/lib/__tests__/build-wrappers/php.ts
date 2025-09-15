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
  checkPrerequisites: async (_context, { execAsync }): Promise<void> => {
    const { stdout: phpVersion } = await execAsync("php -v");
    const match = phpVersion.match(/PHP (\d+\.\d+)/);
    if (!match) {
      throw new Error(
        `Could not determine PHP version from output: ${phpVersion.trim()}`,
      );
    }
  },
  provision: async (context): Promise<Params> => {
    // Write the PHP file
    await writeFile(
      path.join(context.projectDir, context.params.sourceFile),
      context.params.code,
    );

    // Create composer.json
    const composerJson = {
      name: "test/yosina-test",
      version: "0.1.0",
      require: {
        php: VERSIONS.php.language,
        [VERSIONS.php.library.name]: VERSIONS.php.library.version,
      },
    };
    await writeFile(
      path.join(context.projectDir, "composer.json"),
      JSON.stringify(composerJson, null, 2),
    );
    return context.params;
  },
  commands: (_context) => {
    return Promise.resolve([
      Promise.resolve("composer install"),
      Promise.resolve("php -l index.php"),
    ]);
  },
};

export const buildPHP = async (
  code: string,
  tempDir: string,
): Promise<BuildResult> => {
  const buildContext: BuildContext<Params> = {
    projectDir: path.join(tempDir, "php-test"),
    params: {
      code: code,
      sourceFile: "index.php",
    },
  };
  return await build(wrapperSpec, buildContext);
};
