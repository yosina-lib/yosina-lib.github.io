import { writeFile } from "node:fs/promises";
import path from "node:path";
import { compare } from "compare-versions";
import type { BuildContext, BuildResult, BuildWrapper } from "./common";
import { build } from "./common";
import { VERSIONS } from "./versions";

type Params = {
  code: string;
  sourceFile: string;
  rubyBinDir: string;
};

const RUBY_MIN_VERSION = "2.7.0";

const rubySearchPaths = [
  "", // default PATH
  "/usr/local/opt/ruby/bin",
  "/usr/local/opt/ruby@3.1/bin",
  "/usr/local/opt/ruby@4/bin",
];

const wrapperSpec: BuildWrapper<Params> = {
  checkPrerequisites: async (context, { execAsync }): Promise<void> => {
    for (const binDir of rubySearchPaths) {
      const rubyCmd = binDir ? path.join(binDir, "ruby") : "ruby";
      try {
        const { stdout: rubyVersion } = await execAsync(`${rubyCmd} --version`);
        const match = rubyVersion.match(/ruby (\d+\.\d+\.\d+)/);
        if (match && compare(match[1], RUBY_MIN_VERSION, ">=")) {
          context.params.rubyBinDir = binDir;
          return;
        }
      } catch {
        // Try the next path
      }
    }
    throw new Error(
      `Yosina gem requires Ruby >= ${RUBY_MIN_VERSION} but no compatible Ruby was found`,
    );
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
  commands: (context) => {
    const { rubyBinDir } = context.params;
    const pathPrefix = rubyBinDir ? `PATH="${rubyBinDir}:$PATH" ` : "";
    return Promise.resolve([
      Promise.resolve(`${pathPrefix}bundle install`),
      Promise.resolve(`${pathPrefix}ruby -c main.rb`),
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
      rubyBinDir: "",
    },
  };
  return await build(wrapperSpec, buildContext);
};
