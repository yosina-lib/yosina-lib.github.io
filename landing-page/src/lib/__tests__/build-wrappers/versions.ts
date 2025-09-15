// Unified language and library versions configuration
export const VERSIONS = {
  typescript: {
    language: "^5.0.0",
    runtime: "^20.0.0",
    library: {
      name: "@yosina-lib/yosina",
      version: "^0.1.0",
    },
  },
  python: {
    language: "3", // Used for python3 command
    library: {
      name: "yosina",
      version: ">=0.1.0",
    },
  },
  go: {
    language: "1.21",
    library: {
      name: "github.com/yosina-lib/yosina/go",
      version: "v0.1.0",
    },
  },
  rust: {
    language: "2021", // Rust edition
    library: {
      name: "yosina",
      version: "0.1",
    },
  },
  ruby: {
    language: "~> 0.1.0", // Gem version format
    library: {
      name: "yosina",
      version: "~> 0.1.0",
    },
  },
  csharp: {
    language: "net9.0",
    runtime: "net9.0", // .NET target framework
    library: {
      name: "Yosina",
      version: "0.1.0",
    },
  },
  java: {
    language: "11", // Maven compiler source/target
    library: {
      name: "io.yosina:yosina",
      version: "0.1.0",
    },
  },
  php: {
    language: ">=7.4", // Composer PHP version
    library: {
      name: "yosina-lib/yosina",
      version: "^0.1.0",
    },
  },
  swift: {
    language: "5.9", // Swift tools version
    library: {
      name: "yosina-swift",
      version: "0.1.0",
      gitUrl: "https://github.com/yosina-lib/yosina-swift.git",
    },
  },
  dart: {
    language: ">=3.0.0 <4.0.0", // Dart SDK constraint
    library: {
      name: "yosina",
      version: "^0.1.0",
    },
  },
} as const;
