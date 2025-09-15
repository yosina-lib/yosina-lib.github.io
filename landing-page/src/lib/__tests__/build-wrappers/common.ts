import type { ExecException } from "node:child_process";
import { exec } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export type BuildResult = {
  success: boolean;
  stdout?: string;
  stderr?: string;
};

export type BuildContext<T> = {
  projectDir: string;
  params: T;
};

export type BuildWrapper<T> = {
  checkPrerequisites: (
    context: BuildContext<T>,
    utils: { execAsync: typeof execAsync },
  ) => void;
  provision: (context: BuildContext<T>) => Promise<T>;
  commands: (context: BuildContext<T>) => Promise<Iterable<Promise<string>>>;
};

export const doExec = async <T>(
  context: BuildContext<T>,
  commands: Iterable<Promise<string>>,
): Promise<BuildResult> => {
  const out = { success: true, stdout: "", stderr: "" } as {
    success: boolean;
    stdout: string;
    stderr: string;
  };
  for await (const command of commands) {
    const execResult = await execAsync(command, { cwd: context.projectDir })
      .then((out) => ({ success: true, ...out }))
      .catch((err: ExecException) => ({
        success: false,
        stdout: err.stdout ?? "",
        stderr: err.stderr ?? "",
      }));
    out.success = out.success && execResult.success;
    out.stdout += execResult.stdout ?? "";
    out.stderr += execResult.stderr ?? "";
    if (!execResult.success) {
      break;
    }
  }
  return out;
};

export const build = async <T>(
  wrapper: BuildWrapper<T>,
  context: BuildContext<T>,
): Promise<BuildResult> => {
  mkdir(context.projectDir, { recursive: true });
  try {
    await wrapper.checkPrerequisites(context, { execAsync });
    context = {
      ...context,
      params: await wrapper.provision(context),
    };
    return await doExec(context, await wrapper.commands(context));
  } finally {
    await rm(context.projectDir, { recursive: true, force: true });
  }
};
