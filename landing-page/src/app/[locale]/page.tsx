import type { ReactNode } from "react";
import { IoBook, IoLogoGithub } from "react-icons/io5";
import DemoSections from "./demo-sections";
import type { SupportedLocales } from "./i18n";
import { getCatalog } from "./i18n";

export const generateStaticParams = async () => {
  return ["en", "ja"].map((locale) => ({ locale }));
};

type Config = {
  repoUrl: string;
};

export const getConfig = async (): Promise<Config> => {
  return {
    repoUrl:
      process.env.YOSINA_REPO_URL ?? "https://github.com/yosina-lib/yosina",
  };
};

export default async ({
  params,
}: {
  params: Promise<{ locale: SupportedLocales }>;
}): Promise<ReactNode> => {
  const config = await getConfig();
  const localeContext = await params.then(async ({ locale }) => {
    const catalog = await getCatalog(locale);
    return { locale, catalog };
  });
  const { catalog } = localeContext;
  return (
    <div className="@container">
      <header className="flex h-10 flex-row items-center bg-gray-300 p-4 dark:bg-gray-800">
        <div className="flex-1 py-4 font-bold text-lg">Yosina</div>
        <div className="flex space-x-4 text-xs">
          <a
            className="block whitespace-nowrap text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            title={catalog["Yosina on GitHub"]}
            href={config.repoUrl}
          >
            <IoLogoGithub className="mr-1 ml-0 inline-block h-5 w-5 rtl:mr-0 rtl:ml-1" />
            {catalog.Code}
          </a>
          <a
            className="block whitespace-nowrap text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            title={catalog["Transliterator specification"]}
            href="spec"
          >
            <IoBook className="mr-1 ml-0 inline-block h-5 w-5 rtl:mr-0 rtl:ml-1" />
            {catalog.Specification}
          </a>
        </div>
      </header>
      <main className="mx-auto flex max-w-[80rem] flex-col px-4">
        <section className="flex-1 text-center">
          <h1 className="mx-8 mt-6 font-bold text-3xl/7 text-gray-400 tracking-tighter md:mx-12 md:mt-14 md:text-5xl/11 lg:mx-25 lg:text-6xl/14 dark:text-gray-600">
            {
              catalog[
                "A Japanese text normalization library you've always needed"
              ]
            }
          </h1>
          <p className="mt-3 md:mt-8 md:text-lg">
            {
              catalog[
                "Yosina is a transliteration library that deals with the Japanese characters and symbols."
              ]
            }
          </p>
        </section>
        <DemoSections localeContext={localeContext} />
        <section className="mt-3 flex-1 sm:mt-6 md:mt-14">
          <h2 className="mb-2 text-center text-gray-400 text-lg sm:mb-4 sm:text-2xl">
            {catalog["Further reading:"]}
          </h2>
          <ul className="px-4 text-center sm:px-8">
            <li>
              <a className="hover:underline dark:text-blue-400" href="spec/">
                {catalog["Transliterator specification"]}
              </a>
            </li>
            <li className="mb-1">
              <a
                className="hover:underline dark:text-blue-400"
                href={config.repoUrl}
              >
                {catalog["Yosina on GitHub"]}
              </a>
            </li>
          </ul>
        </section>
      </main>
      <footer className="mt-20 flex h-10 flex-row items-center justify-center bg-gray-300 p-4 pt-10 pb-8 text-sm dark:bg-gray-800">
        <div>&copy; 2025 Yosina Project. All rights reserved.</div>
      </footer>
    </div>
  );
};
