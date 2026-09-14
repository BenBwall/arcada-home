import "$components/appearance-panel.js";
import { copyDirectory, listFiles, removeDirectory } from "$scripts/shared";
import { dirname, join, relative, resolve } from "node:path";
import { homePage, homeStyles } from "$pages/home.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pageLayout, siteStyles } from "$pages/layout.js";
import { projectsPage, projectsStyles } from "$pages/projects.js";
import { resumePage, resumeStyles } from "$pages/resume.js";
import { asset } from "$site/paths.js";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import { createHash } from "node:crypto";
import { format } from "oxfmt";
import { projectRowStyles } from "$components/project-row.js";
import { render } from "@lit-labs/ssr";
import { siteHeaderStyles } from "$components/site-header.js";
import { themeStyles } from "$theme/built-in-themes.js";
import ts from "typescript";

const PRINT_WIDTH = 100;
const RELEASE_ID_LENGTH = 12;

const root = resolve(import.meta.dirname, "..");
const output = join(root, "build");
const routes = [
  { name: "home", path: "/", render: homePage, title: "Home" },
  { name: "resume", path: "/resume/", render: resumePage, title: "Resume | Ben Bergenwall" },
  {
    name: "projects",
    path: "/projects/",
    render: projectsPage,
    title: "Projects | Ben Bergenwall",
  },
];

const write = async (filename: string, source: string): Promise<void> => {
  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, source);
};

const publicModule = (filename: string): boolean =>
  filename.endsWith(".ts") &&
  !filename.endsWith(".test.ts") &&
  !filename.includes(join("src", "pages")) &&
  !["project-row.ts", "site-header.ts", "projects.ts", "hooks.ts", "hooks.client.ts"].some((name) =>
    filename.endsWith(name),
  );

const readable = async (filename: string, source: string): Promise<string> => {
  const result = await format(filename, source, {
    embeddedLanguageFormatting: "off",
    printWidth: PRINT_WIDTH,
    tabWidth: 2,
  });
  if (result.errors.length) {
    throw new Error(`Formatting failed: ${filename}: ${result.errors[0].message}`);
  }
  return result.code;
};

const formatDocument = async (source: string): Promise<string> => {
  // Format the static document, preserving the interactive island byte for byte.
  // Lit's part indices and template digests depend on its exact internal whitespace.
  const island = /<appearance-panel\b[^>]*>[\s\S]*?<\/appearance-panel>/.exec(source)?.[0];
  if (!island) {
    throw new Error("Static page is missing its appearance panel.");
  }
  const placeholder = "<!-- appearance-panel-ssr -->";
  const result = await format("index.html", source.replace(island, placeholder), {
    htmlWhitespaceSensitivity: "css",
    printWidth: PRINT_WIDTH,
    tabWidth: 2,
  });
  if (result.errors.length) {
    throw new Error(result.errors[0].message);
  }
  return result.code.replace(placeholder, () => island);
};

const releaseId = async (): Promise<string> => {
  const hash = createHash("sha256");
  const files = [
    ...listFiles(join(root, "src")),
    join(root, "bun.lock"),
    join(root, "scripts/lit-vendor.mts"),
    join(root, "scripts/static-build.mts"),
  ].toSorted();
  const contents = await Promise.all(files.map((file) => readFile(file)));
  for (const [index, file] of files.entries()) {
    hash.update(relative(root, file).replaceAll("\\", "/"));
    hash.update(contents[index]);
  }
  hash.update(process.env.BASE_PATH ?? "/~bergenwb");
  return hash.digest("hex").slice(0, RELEASE_ID_LENGTH);
};

const buildAssets = async (assets: string): Promise<void> => {
  const sources = listFiles(join(root, "src"));
  await Promise.all(
    sources.filter(publicModule).map(async (filename) => {
      const destination = join(
        assets,
        relative(join(root, "src"), filename).replace(/\.ts$/, ".js"),
      );
      const result = ts.transpileModule(await readFile(filename, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          newLine: ts.NewLineKind.LineFeed,
          removeComments: false,
          target: ts.ScriptTarget.ESNext,
          useDefineForClassFields: false,
          verbatimModuleSyntax: true,
        },
        fileName: filename,
      });
      await write(destination, await readable(destination, result.outputText));
    }),
  );
  const styles = {
    home: homeStyles,
    "project-row": projectRowStyles,
    projects: projectsStyles,
    resume: resumeStyles,
    site: siteStyles,
    "site-header": siteHeaderStyles,
    themes: themeStyles,
  };
  await Promise.all(
    Object.entries(styles).map(async ([name, style]) => {
      const destination = join(assets, "styles", `${name}.css`);
      await write(destination, await readable(destination, style.cssText));
    }),
  );

  const vendor = await Bun.build({
    conditions: ["production"],
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    entrypoints: [join(root, "scripts/lit-vendor.mts")],
    format: "esm",
    minify: false,
    target: "browser",
  });
  if (!vendor.success) {
    throw new Error(vendor.logs.map((log) => log.message).join("\n"));
  }
  await write(
    join(assets, "vendor/lit.js"),
    await readable("lit.js", await vendor.outputs[0].text()),
  );
};

const build = async (): Promise<void> => {
  process.env.BASE_PATH = (process.env.BASE_PATH ?? "/~bergenwb").replace(/\/$/, "");
  const release = await releaseId();
  process.env.ASSET_PATH = `${process.env.BASE_PATH}/_app/${release}`;
  const assets = join(output, "_app", release);
  removeDirectory(root, "build");
  await mkdir(assets, { recursive: true });
  copyDirectory(join(root, "static"), output);

  await buildAssets(assets);

  const importMap = JSON.stringify(
    {
      imports: {
        "$components/": asset("_app/lib/components/"),
        "$site/": asset("_app/lib/"),
        "$theme/": asset("_app/lib/theme/"),
        lit: asset("_app/vendor/lit.js"),
        "lit/directives/if-defined.js": asset("_app/vendor/lit.js"),
        "lit/directives/live.js": asset("_app/vendor/lit.js"),
      },
    },
    null,
    2,
  ).replaceAll("<", "\\u003c");

  await Promise.all(
    routes.map(async (route) => {
      const page = pageLayout(route, importMap);
      // Preserve template whitespace and hydration boundaries. Remove only Lit SSR's
      // obsolete shadowroot attribute; modern browsers use shadowrootmode.
      await write(
        join(output, route.path.slice(1), "index.html"),
        await formatDocument(
          (await collectResult(render(page))).replaceAll(
            '<template shadowroot="open" shadowrootmode="open">',
            '<template shadowrootmode="open">',
          ),
        ),
      );
    }),
  );
  await write(
    join(output, "_app/version.json"),
    `${JSON.stringify({ framework: "lit", release }, null, 2)}\n`,
  );
  console.log(
    `Rendered ${routes.length} pages to build with readable ES modules in _app/${release}/.`,
  );
};

await build();
