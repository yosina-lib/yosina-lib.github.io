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
    const { stdout: rubyVersion } = await execAsync("ruby --version");
    const match = rubyVersion.match(/ruby (\d+\.\d+\.\d+)/);
    if (!match) {
      throw new Error(
        `Could not determine Ruby version from output: ${rubyVersion.trim()}`,
      );
    }
  },
  provision: async (context): Promise<Params> => {
    // Write the Ruby file
    await writeFile(
      path.join(context.projectDir, context.params.sourceFile),
      context.params.code,
    );

    // Create Gemfile
    const gemfile = `source 'https://rubygems.org'

gem '${VERSIONS.ruby.library.name}', '${VERSIONS.ruby.library.version}'
`;
    await writeFile(path.join(context.projectDir, "Gemfile"), gemfile);
    return context.params;
  },
  commands: (_context) => {
    return Promise.resolve([
      Promise.resolve("bundle install"),
      Promise.resolve("ruby -c main.rb"),
    ]);
  },
};

export const buildRuby = async (
  code: string,
  tempDir: string,
): Promise<BuildResult> => {
  const buildContext: BuildContext<Params> = {
    projectDir: path.join(tempDir, "ruby-test"),
    params: {
      code: code,
      sourceFile: "main.rb",
    },
  };
  return await build(wrapperSpec, buildContext);
};
