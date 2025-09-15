import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BuildContext, BuildResult, BuildWrapper } from "./common";
import { build } from "./common";
import { VERSIONS } from "./versions";

type Params = {
  code: string;
  sourcePath: string;
};

const wrapperSpec: BuildWrapper<Params> = {
  checkPrerequisites: async (_context, { execAsync }): Promise<void> => {
    const { stdout: dartVersion } = await execAsync("dart --version");
    const match = dartVersion.match(/Dart SDK version: (\d+\.\d+\.\d+)/);
    if (!match) {
      throw new Error(
        `Could not determine Dart version from output: ${dartVersion.trim()}`,
      );
    }
  },
  provision: async (context): Promise<Params> => {
    const sourcePath = path.join(context.projectDir, context.params.sourcePath);
    await mkdir(path.dirname(sourcePath), { recursive: true });
    // Write the Dart file
    await writeFile(sourcePath, context.params.code);

    // Create pubspec.yaml
    const pubspecYaml = `name: yosina_test
description: A test project for Yosina
version: 1.0.0

environment:
  sdk: '${VERSIONS.dart.language}'

dependencies:
  ${VERSIONS.dart.library.name}: ${VERSIONS.dart.library.version}
`;
    await writeFile(path.join(context.projectDir, "pubspec.yaml"), pubspecYaml);
    return context.params;
  },
  commands: (context) => {
    return Promise.resolve([
      Promise.resolve("dart pub get"),
      Promise.resolve(`dart analyze ${context.params.sourcePath}`),
    ]);
  },
};

export const buildDart = async (
  code: string,
  tempDir: string,
): Promise<BuildResult> => {
  const buildContext: BuildContext<Params> = {
    projectDir: path.join(tempDir, "dart-test"),
    params: {
      code: code,
      sourcePath: "bin/main.dart",
    },
  };
  return await build(wrapperSpec, buildContext);
};
