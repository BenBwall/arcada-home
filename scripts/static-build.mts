import "$components/appearance-panel.js";
import { copyDirectory, listFiles, removeDirectory } from "$scripts/shared";
import { dirname, join, relative, resolve, sep } from "node:path";
import { homePage, homePhotos, homeStyles, photoWidths } from "$pages/home.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pageLayout, siteStyles } from "$pages/layout.js";
import { projectsPage, projectsStyles } from "$pages/projects.js";
import { resumePage, resumeStyles } from "$pages/resume.js";
import { asset } from "$site/paths.js";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
import { createHash } from "node:crypto";
import { format } from "oxfmt";
import { getThemeStyles } from "$theme/built-in-themes.js";
import { projectRowStyles } from "$components/project-row.js";
import { render } from "@lit-labs/ssr";
import sharp from "sharp";
import { siteHeaderStyles } from "$components/site-header.js";
import ts from "typescript";

const AVIF_QUALITY = 50;
const WEBP_QUALITY = 80;
const PRINT_WIDTH = 100;
const RELEASE_ID_LENGTH = 12;
const DEFAULT_PREVIEW_PORT = 4173;

const root = resolve(import.meta.dirname, "..");
const previewSlot = process.env.DEV_PREVIEW_SLOT;
const preview = previewSlot === "a" || previewSlot === "b";
const outputName = preview
  ? join(
      ".cache/dev-preview",
      String(Number(process.env.PORT ?? DEFAULT_PREVIEW_PORT)),
      previewSlot,
    )
  : "build";
const output = join(root, outputName);
// Only development builds may use a sibling checkout. Published builds use the gitlink.
const cardgameSource = resolve(
  root,
  preview ? (process.env.CARDGAME_SOURCE_DIR ?? "vendor/cardgame/src") : "vendor/cardgame/src",
);
const themeStyles = getThemeStyles();
const routes = [
  {
    description:
      "Ben Bergenwall, web developer and Information Technology student at Arcada University of Applied Sciences. About me, resume, and selected projects.",
    name: "home",
    path: "/",
    render: homePage,
    styles: [homeStyles],
    title: "Home",
  },
  {
    description:
      "Ben Bergenwall’s resume: experience, education, and skills in web development and Information Technology.",
    name: "resume",
    path: "/resume/",
    render: resumePage,
    styles: [resumeStyles],
    title: "Resume | Ben Bergenwall",
  },
  {
    description:
      "Selected software and web development projects by Ben Bergenwall, with project details and links.",
    name: "projects",
    path: "/projects/",
    render: projectsPage,
    styles: [projectsStyles, projectRowStyles],
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
  ![
    "project-row.ts",
    "site-header.ts",
    "projects.ts",
    "hooks.ts",
    "hooks.client.ts",
    "theme-start.ts",
  ].some((name) => filename.endsWith(name));

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
    ...listFiles(join(root, "static")),
    ...listFiles(cardgameSource),
    join(root, "bun.lock"),
    join(root, "scripts/lit-vendor.mts"),
    join(root, "scripts/lucide-vendor.mts"),
    join(root, "scripts/static-build.mts"),
  ].toSorted();
  const contents = await Promise.all(files.map((file) => readFile(file)));
  for (const [index, file] of files.entries()) {
    const logicalPath = file.startsWith(cardgameSource + sep)
      ? join("vendor/cardgame/src", relative(cardgameSource, file))
      : relative(root, file);
    hash.update(logicalPath.replaceAll("\\", "/"));
    hash.update(contents[index]);
  }
  hash.update(process.env.BASE_PATH ?? "/~bergenwb");
  hash.update(process.env.MULTIPLAYER_URL ?? "");
  return hash.digest("hex").slice(0, RELEASE_ID_LENGTH);
};

const buildAssets = async (assets: string): Promise<void> => {
  const sourceRoots = [
    { destination: assets, directory: join(root, "src") },
    { destination: join(assets, "vendor/cardgame"), directory: cardgameSource },
  ];
  await Promise.all(
    sourceRoots.map(async ({ directory, destination: moduleOutput }) => {
      const sources = listFiles(directory);
      await Promise.all(
        sources.filter(publicModule).map(async (filename) => {
          const destination = join(
            moduleOutput,
            relative(directory, filename).replace(/\.ts$/, ".js"),
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

  await Promise.all(
    ["lit", "lucide"].map(async (name) => {
      const vendor = await Bun.build({
        conditions: ["production"],
        define: { "process.env.NODE_ENV": JSON.stringify("production") },
        entrypoints: [join(root, `scripts/${name}-vendor.mts`)],
        format: "esm",
        minify: false,
        target: "browser",
      });
      if (!vendor.success) {
        throw new Error(vendor.logs.map((log) => log.message).join("\n"));
      }
      await write(
        join(assets, `vendor/${name}.js`),
        await readable(`${name}.js`, await vendor.outputs[0].text()),
      );
    }),
  );
};

const buildThemeBootstrap = async (): Promise<string> => {
  const result = await Bun.build({
    conditions: ["production"],
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    entrypoints: [join(root, "src/theme-start.ts")],
    format: "iife",
    minify: false,
    target: "browser",
  });
  if (!result.success) {
    throw new Error(result.logs.map((log) => log.message).join("\n"));
  }
  return readable("theme-start.js", await result.outputs[0].text());
};

const build = async (): Promise<void> => {
  process.env.BASE_PATH = (process.env.BASE_PATH ?? "/~bergenwb").replace(/\/$/, "");
  const release = await releaseId();
  process.env.ASSET_PATH = `${process.env.BASE_PATH}/_app/${release}`;
  const assets = join(output, "_app", release);
  removeDirectory(root, outputName);
  await mkdir(assets, { recursive: true });
  copyDirectory(join(root, "static"), output);

  await buildAssets(assets);
  const themeBootstrap = await buildThemeBootstrap();
  await mkdir(join(assets, "images"), { recursive: true });
  await Promise.all(
    homePhotos.flatMap((name) =>
      photoWidths.map(async (width) => {
        const image = sharp(join(root, "static", `${name}.JPEG`))
          .rotate()
          .resize({ width, withoutEnlargement: true });
        await Promise.all([
          image
            .clone()
            .avif({ quality: AVIF_QUALITY })
            .toFile(join(assets, "images", `${name}-${width}.avif`)),
          image
            .webp({ quality: WEBP_QUALITY })
            .toFile(join(assets, "images", `${name}-${width}.webp`)),
        ]);
      }),
    ),
  );
  await write(
    join(assets, ".htaccess"),
    '<IfModule mod_headers.c>\n  Header set Cache-Control "public, max-age=31536000, immutable"\n</IfModule>\n',
  );
  const modules = [
    "_app/vendor/lit.js",
    "_app/vendor/lucide.js",
    ...listFiles(join(root, "src"))
      .filter(publicModule)
      .map(
        (filename) =>
          `_app/${relative(join(root, "src"), filename).replaceAll("\\", "/").replace(/\.ts$/, ".js")}`,
      ),
  ];

  const importMap = JSON.stringify(
    {
      imports: {
        $cardgame: asset("_app/vendor/cardgame/index.js"),
        "$components/": asset("_app/lib/components/"),
        "$site/": asset("_app/lib/"),
        "$theme/": asset("_app/lib/theme/"),
        "@lit/reactive-element/css-tag.js": asset("_app/vendor/lit.js"),
        "@lucide/icons": asset("_app/vendor/lucide.js"),
        "@lucide/icons/build": asset("_app/vendor/lucide.js"),
        lit: asset("_app/vendor/lit.js"),
        "lit/directives/if-defined.js": asset("_app/vendor/lit.js"),
        "lit/directives/live.js": asset("_app/vendor/lit.js"),
        "lit/directives/repeat.js": asset("_app/vendor/lit.js"),
        "lit/directives/unsafe-html.js": asset("_app/vendor/lit.js"),
      },
    },
    null,
    2,
  ).replaceAll("<", "\\u003c");

  await Promise.all(
    routes.map(async (route) => {
      const page = pageLayout(
        route,
        importMap,
        [themeStyles, siteStyles, siteHeaderStyles, ...route.styles],
        modules,
        themeBootstrap,
      );
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
    `Rendered ${routes.length} pages to ${outputName} with readable ES modules in _app/${release}/.`,
  );
};

await build();
