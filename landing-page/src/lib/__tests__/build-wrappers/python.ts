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
    const { stdout: pythonVersion } = await execAsync(
      `python${VERSIONS.python.language} --version`,
    );
    const match = pythonVersion.match(/Python (\d+\.\d+\.\d+)/);
    if (!match) {
      throw new Error(
        `Could not determine Python version from output: ${pythonVersion.trim()}`,
      );
    }
  },
  provision: async (context): Promise<Params> => {
    // Write the Python file
    await writeFile(
      path.join(context.projectDir, context.params.sourceFile),
      context.params.code,
    );

    // Create requirements.txt
    await writeFile(
      path.join(context.projectDir, "requirements.txt"),
      `${VERSIONS.python.library.name}${VERSIONS.python.library.version}\n`,
    );
    return context.params;
  },
  commands: (_context) => {
    const pipCommand =
      process.platform === "win32" ? ".\\venv\\Scripts\\pip" : "./venv/bin/pip";
    const pythonCommand =
      process.platform === "win32"
        ? ".\\venv\\Scripts\\python"
        : "./venv/bin/python";

    return Promise.resolve([
      Promise.resolve(`python${VERSIONS.python.language} -m venv venv`),
      Promise.resolve(`${pipCommand} install -r requirements.txt`),
      Promise.resolve(`${pythonCommand} -m py_compile main.py`),
    ]);
  },
};

export const buildPython = async (
  code: string,
  tempDir: string,
): Promise<BuildResult> => {
  const buildContext: BuildContext<Params> = {
    projectDir: path.join(tempDir, "python-test"),
    params: {
      code: code,
      sourceFile: "main.py",
    },
  };
  return await build(wrapperSpec, buildContext);
};
