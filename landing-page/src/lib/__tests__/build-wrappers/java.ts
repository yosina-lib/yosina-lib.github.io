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
    const { stdout: javaVersion } = await execAsync("java -version 2>&1");
    const match = javaVersion.match(/version "(\d+)(?:\.\d+)*"/);
    if (!match) {
      throw new Error(
        `Could not determine Java version from output: ${javaVersion.trim()}`,
      );
    }
    const majorVersion = Number.parseInt(match[1], 10);
    if (majorVersion < Number.parseInt(VERSIONS.java.language, 10)) {
      throw new Error(
        `Yosina package requires Java ${VERSIONS.java.language} but only Java ${majorVersion} is available`,
      );
    }
  },
  provision: async (context): Promise<Params> => {
    const srcDir = path.join(context.projectDir, "src", "main", "java");
    await mkdir(srcDir, { recursive: true });

    // Write the Java file
    await writeFile(
      path.join(srcDir, context.params.sourceFile),
      context.params.code,
    );

    // Create pom.xml
    const [groupId, artifactId] = VERSIONS.java.library.name.split(":");
    const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.test</groupId>
    <artifactId>yosina-test</artifactId>
    <version>1.0-SNAPSHOT</version>
    
    <properties>
        <maven.compiler.source>${VERSIONS.java.language}</maven.compiler.source>
        <maven.compiler.target>${VERSIONS.java.language}</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>${groupId}</groupId>
            <artifactId>${artifactId}</artifactId>
            <version>${VERSIONS.java.library.version}</version>
        </dependency>
    </dependencies>
</project>`;
    await writeFile(path.join(context.projectDir, "pom.xml"), pomXml);
    return context.params;
  },
  commands: (_context) => {
    return Promise.resolve([Promise.resolve("mvn compile")]);
  },
};

export const buildJava = async (
  code: string,
  tempDir: string,
): Promise<BuildResult> => {
  const buildContext: BuildContext<Params> = {
    projectDir: path.join(tempDir, "java-test"),
    params: {
      code: code,
      sourceFile: "YosinaExample.java",
    },
  };
  return await build(wrapperSpec, buildContext);
};
