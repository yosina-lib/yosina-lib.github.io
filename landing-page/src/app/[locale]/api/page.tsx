import type { ReactNode } from "react";
import { IoArrowBack } from "react-icons/io5";
import type { SupportedLocales } from "../i18n";
import { getCatalog } from "../i18n";

export const generateStaticParams = async () => {
  return ["en", "ja"].map((locale) => ({ locale }));
};

const languages = [
  { name: "C#", href: "/api/csharp/", generator: "DocFX" },
  { name: "Dart", href: "/api/dart/", generator: "dartdoc" },
  { name: "Go", href: "/api/go/", generator: "pkgsite" },
  { name: "Java", href: "/api/java/", generator: "Javadoc" },
  {
    name: "JavaScript / TypeScript",
    href: "/api/javascript/",
    generator: "TypeDoc",
  },
  { name: "PHP", href: "/api/php/", generator: "phpDocumentor" },
  { name: "Python", href: "/api/python/", generator: "Sphinx" },
  { name: "Ruby", href: "/api/ruby/", generator: "YARD" },
  { name: "Rust", href: "/api/rust/yosina/", generator: "rustdoc" },
  {
    name: "Swift",
    href: "/api/swift/documentation/yosina",
    generator: "Swift-DocC",
  },
];

export default async ({
  params,
}: {
  params: Promise<{ locale: SupportedLocales }>;
}): Promise<ReactNode> => {
  const { locale } = await params;
  const catalog = await getCatalog(locale);
  return (
    <div className="@container">
      <header className="flex h-10 flex-row items-center bg-gray-300 p-4 dark:bg-gray-800">
        <div className="flex-1 py-4 font-bold text-lg">Yosina</div>
      </header>
      <main className="mx-auto flex max-w-[64rem] flex-col px-4 py-8">
        <a
          className="mb-4 flex w-fit items-center gap-1 text-gray-500 text-sm hover:text-gray-800 dark:hover:text-gray-200"
          href={`/${locale}/`}
        >
          <IoArrowBack className="h-4 w-4" />
          {catalog["Back to home"]}
        </a>
        <h1 className="mb-2 font-bold text-3xl">{catalog["API Reference"]}</h1>
        <p className="mb-8 text-gray-500">
          {
            catalog[
              "Browse the Yosina API documentation for each language implementation."
            ]
          }
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {languages.map(({ name, href, generator }) => (
            <a
              key={name}
              href={href}
              className="rounded-lg border border-gray-200 p-5 transition-colors hover:border-blue-400 hover:shadow-sm dark:border-gray-700 dark:hover:border-blue-500"
            >
              <p className="font-semibold text-lg">{name}</p>
              <p className="text-gray-400 text-sm">{generator}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
};
