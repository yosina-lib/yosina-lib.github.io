import { writeFile } from "node:fs/promises";
import path from "node:path";
import type { BuildContext, BuildResult, BuildWrapper } from "./common";
import { build } from "./common";
import { VERSIONS } from "./versions";

type Params = {
  sourceFile: string;
  code: string;
};

const wrapperSpec: BuildWrapper<Params> = {
  checkPrerequisites: async (_context, { execAsync }): Promise<void> => {
    const { stdout: sdkVersion } = await execAsync("dotnet --version");
    const majorVersion = Number.parseInt(sdkVersion.split(".")[0], 10);
    if (majorVersion < 9) {
      throw new Error(
        `Yosina package requires .NET 9.0 but only .NET ${sdkVersion.trim()} SDK is available`,
      );
    }
  },
  provision: async (context): Promise<Params> => {
    // Write the C# file
    await writeFile(
      path.join(context.projectDir, context.params.sourceFile),
      context.params.code,
    );

    // Create csproj file
    const csproj = `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>${VERSIONS.csharp.runtime}</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>false</TreatWarningsAsErrors>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="${VERSIONS.csharp.library.name}" Version="${VERSIONS.csharp.library.version}" />
  </ItemGroup>

</Project>`;
    await writeFile(
      path.join(context.projectDir, "test-project.csproj"),
      csproj,
    );
    return context.params;
  },
  commands: (_context) => {
    return Promise.resolve([
      Promise.resolve("dotnet restore --ignore-failed-sources"),
      Promise.resolve("dotnet build"),
    ]);
  },
};

export const buildCSharp = async (
  code: string,
  tempDir: string,
): Promise<BuildResult> => {
  const buildContext: BuildContext<Params> = {
    projectDir: path.join(tempDir, "csharp-test"),
    params: {
      sourceFile: "Program.cs",
      code: code,
    },
  };
  return await build(wrapperSpec, buildContext);
};
