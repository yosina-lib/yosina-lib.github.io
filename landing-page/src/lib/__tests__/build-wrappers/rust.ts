import type { ExecException } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
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
    const { stderr } = await execAsync("rustc --edition").catch(
      (e: ExecException) => e,
    );
    const match = stderr?.match(
      /--edition\s+<([0-9]+(?:\|(?:[0-9]+|future))*)>/m,
    );
    if (!match) {
      throw new Error(
        `Could not determine Rust version from output: ${stderr?.trim()}`,
      );
    }
    const editions = match[1].split("|").filter((e) => e !== "future");
    const latestEditionSupported = editions[editions.length - 1];
    if (latestEditionSupported < VERSIONS.rust.language) {
      throw new Error(
        `Rust edition ${latestEditionSupported} is less than the required edition ${VERSIONS.rust.language}`,
      );
    }
  },
  provision: async (context): Promise<Params> => {
    const srcDir = path.join(context.projectDir, "src");
    await mkdir(srcDir, { recursive: true });

    // Write the Rust file
    await writeFile(
      path.join(srcDir, context.params.sourceFile),
      context.params.code,
    );

    // Create Cargo.toml
    const cargoToml = `[package]
name = "test-project"
version = "0.1.0"
edition = "${VERSIONS.rust.language}"

[dependencies]
${VERSIONS.rust.library.name} = "${VERSIONS.rust.library.version}"
`;
    await writeFile(path.join(context.projectDir, "Cargo.toml"), cargoToml);
    return context.params;
  },
  commands: (_context) => {
    return Promise.resolve([Promise.resolve("cargo build")]);
  },
};

export const buildRust = async (
  code: string,
  tempDir: string,
): Promise<BuildResult> => {
  const buildContext: BuildContext<Params> = {
    projectDir: path.join(tempDir, "rust-test"),
    params: {
      code: code,
      sourceFile: "main.rs",
    },
  };
  return await build(wrapperSpec, buildContext);
};
