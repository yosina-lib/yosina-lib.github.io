import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { compare } from "compare-versions";
import type { BuildContext, BuildResult, BuildWrapper } from "./common";
import { build } from "./common";
import { VERSIONS } from "./versions";

type Params = {
  code: string;
  sourceFile: string;
  sourcesDir: string;
  platforms: string[];
  packageRepoUrl: string;
  packageVersion: string;
};

const wrapperSpec: BuildWrapper<Params> = {
  checkPrerequisites: async (_context, { execAsync }): Promise<void> => {
    const { stdout: swiftVersion } = await execAsync("swift --version");
    const match = swiftVersion.match(/Swift version (\d+\.\d+\.\d+)/);
    if (!match) {
      throw new Error(
        `Could not determine Swift version from output: ${swiftVersion.trim()}`,
      );
    }
    if (compare(match[1], VERSIONS.swift.language, "<")) {
      throw new Error(
        `Yosina package requires Swift ${VERSIONS.swift.language} but only Swift ${match[1]} is available`,
      );
    }
  },
  provision: async (context): Promise<Params> => {
    const sourcesDir = path.join(context.projectDir, "Sources", "YosinaTest");
    await mkdir(sourcesDir, { recursive: true });
    await writeFile(
      path.join(sourcesDir, context.params.sourceFile),
      context.params.code,
    );

    // Create Package.swift
    const packageSwift = `// swift-tools-version:${VERSIONS.swift.language}
import PackageDescription

let package = Package(
    name: "YosinaTest",
    platforms: [
        ${context.params.platforms.join(",\n")}
    ],
    dependencies: [
        .package(url: "${context.params.packageRepoUrl}", from: "${context.params.packageVersion}")
    ],
    targets: [
        .executableTarget(
            name: "YosinaTest",
            dependencies: [.product(name: "Yosina", package: "yosina-swift")]
        )
    ]
)`;
    await writeFile(
      path.join(context.projectDir, "Package.swift"),
      packageSwift,
    );
    return context.params;
  },
  commands: (_context) => {
    return Promise.resolve([Promise.resolve("swift build")]);
  },
};

export const buildSwift = async (
  code: string,
  tempDir: string,
): Promise<BuildResult> => {
  const buildContext: BuildContext<Params> = {
    projectDir: path.join(tempDir, "swift-test"),
    params: {
      code: code,
      sourceFile: "main.swift",
      sourcesDir: "YosinaTest",
      platforms: [
        ".macOS(.v10_15)",
        ".iOS(.v13)",
        ".tvOS(.v13)",
        ".watchOS(.v6)",
      ],
      packageRepoUrl: VERSIONS.swift.library.gitUrl,
      packageVersion: VERSIONS.swift.library.version,
    },
  };
  return await build(wrapperSpec, buildContext);
};
