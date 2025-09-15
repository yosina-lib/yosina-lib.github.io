import { writeFile } from "node:fs/promises";
import path from "node:path";
import { compare } from "compare-versions";
import type { BuildContext, BuildResult, BuildWrapper } from "./common";
import { build } from "./common";
import { VERSIONS } from "./versions";

type Params = {
  code: string;
  sourceFile: string;
};

const wrapperSpec: BuildWrapper<Params> = {
  checkPrerequisites: async (_context, { execAsync }): Promise<void> => {
    const { stdout: goVersion } = await execAsync("go version");
    const match = goVersion.match(/go version go(\d+\.\d+)/);
    if (!match) {
      throw new Error(
        `Could not determine Go version from output: ${goVersion.trim()}`,
      );
    }
    if (compare(match[1], VERSIONS.go.language, "<")) {
      throw new Error(
        `Yosina package requires Go ${VERSIONS.go.language} but only Go ${match[1]} is available`,
      );
    }
  },
  provision: async (context): Promise<Params> => {
    // Write the Go file
    await writeFile(
      path.join(context.projectDir, context.params.sourceFile),
      context.params.code,
    );

    // Create go.mod
    const goMod = `module test-project

go ${VERSIONS.go.language}

require ${VERSIONS.go.library.name} ${VERSIONS.go.library.version}
`;
    await writeFile(path.join(context.projectDir, "go.mod"), goMod);
    return context.params;
  },
  commands: (_context) => {
    return Promise.resolve([
      Promise.resolve("go mod tidy"),
      Promise.resolve("go build -o test-binary main.go"),
    ]);
  },
};

export const buildGo = async (
  code: string,
  tempDir: string,
): Promise<BuildResult> => {
  const buildContext: BuildContext<Params> = {
    projectDir: path.join(tempDir, "go-test"),
    params: {
      code: code,
      sourceFile: "main.go",
    },
  };
  return await build(wrapperSpec, buildContext);
};
