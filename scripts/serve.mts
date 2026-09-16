import { existsSync, watch } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { startDevelopmentServer } from "@cardgame-dev/dev-server.js";

const DEFAULT_PORT = 4173;
const BAD_REQUEST = 400;
const REDIRECT = 302;
const NOT_FOUND = 404;
const DEBOUNCE_MS = 150;

const root = resolve(import.meta.dirname, "..");
const base = (process.env.BASE_PATH ?? "/~bergenwb").replace(/\/$/, "");
const port = Number(process.env.PORT ?? DEFAULT_PORT);
const watching = process.argv.includes("--watch");
const siblingSource = resolve(root, "../cardgame-lit/src");
const cardgameSource = resolve(
  root,
  process.env.CARDGAME_SOURCE_DIR ??
    (existsSync(siblingSource) ? siblingSource : "vendor/cardgame/src"),
);
let output = join(root, "build");
let slot = "b";
let revision = `${Date.now()}:0`;
let building: Promise<void> | undefined;
let dirty = false;
const gameDirectory = resolve(cardgameSource, "..");
const backend = watching
  ? await startDevelopmentServer({
      directory: existsSync(join(gameDirectory, "server/main.ts"))
        ? gameDirectory
        : join(root, "vendor/cardgame"),
      env: process.env,
      origins: [`http://127.0.0.1:${port}`, `http://localhost:${port}`],
    })
  : undefined;

const rebuild = (): Promise<void> => {
  dirty = true;
  if (building) {
    return building;
  }
  building = (async () => {
    while (dirty) {
      dirty = false;
      const nextSlot = slot === "a" ? "b" : "a";
      try {
        const child = Bun.spawn([process.execPath, "run", "build"], {
          cwd: root,
          env: {
            ...process.env,
            BASE_PATH: base,
            CARDGAME_SOURCE_DIR: cardgameSource,
            DEV_PREVIEW_SLOT: nextSlot,
            MULTIPLAYER_URL: backend?.url ?? "",
            PORT: String(port),
          },
          stderr: "inherit",
          stdout: "inherit",
        });
        // oxlint-disable-next-line eslint/no-await-in-loop -- Finish this build before processing another save.
        if ((await child.exited) === 0) {
          slot = nextSlot;
          output = join(root, ".cache/dev-preview", String(port), slot);
          revision = `${Date.now()}:${slot}`;
          console.log("Preview updated; connected browsers will reload.");
        } else {
          console.error(
            "Build failed; keeping the last successful preview. Save again after fixing the error.",
          );
        }
      } catch (error) {
        console.error("Build failed:", error);
      }
    }
  })().finally(() => {
    building = undefined;
  });
  return building;
};

if (watching) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const directories = new Set([
    join(root, "src"),
    join(root, "static"),
    join(root, "scripts"),
    cardgameSource,
  ]);
  for (const directory of directories) {
    watch(directory, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void rebuild();
      }, DEBOUNCE_MS);
    });
  }
  await rebuild();
}

const server = await Promise.resolve()
  .then(() =>
    Bun.serve({
      async fetch(request) {
        const url = new URL(request.url);
        let pathname: string;
        try {
          pathname = decodeURIComponent(url.pathname);
        } catch {
          return new Response("Invalid path", { status: BAD_REQUEST });
        }
        if (pathname === base || (pathname === "/" && base)) {
          return Response.redirect(`${url.origin}${base}/`, REDIRECT);
        }
        if (!pathname.startsWith(`${base}/`)) {
          return new Response("Not found", { status: NOT_FOUND });
        }
        if (watching && pathname === `${base}/__dev/revision`) {
          return Response.json({ revision }, { headers: { "Cache-Control": "no-store" } });
        }
        if (watching && pathname === `${base}/__dev/reload.js`) {
          return new Response(
            `const revision = document.currentScript.dataset.revision;
setInterval(async () => {
  try {
    const response = await fetch(${JSON.stringify(`${base}/__dev/revision`)}, { cache: "no-store" });
    if (response.ok && (await response.json()).revision !== revision) location.reload();
  } catch { /* The dev server may be restarting. Try again on the next tick. */ }
}, 500);`,
            { headers: { "Cache-Control": "no-store", "Content-Type": "text/javascript" } },
          );
        }
        const pageRevision = revision;
        const relative = pathname.slice(base.length + 1);
        const candidate = resolve(output, relative);
        if (candidate !== output && !candidate.startsWith(output + sep)) {
          return new Response("Invalid path", { status: BAD_REQUEST });
        }
        if (
          !pathname.endsWith("/") &&
          !extname(candidate) &&
          (await Bun.file(join(candidate, "index.html")).exists())
        ) {
          return Response.redirect(`${url.origin}${pathname}/${url.search}`, REDIRECT);
        }
        const filename = pathname.endsWith("/") ? join(candidate, "index.html") : candidate;
        const file = Bun.file(filename);
        if (!(await file.exists())) {
          return new Response("Not found", { status: NOT_FOUND });
        }
        if (watching && extname(filename) === ".html") {
          const script = `<script src="${base}/__dev/reload.js" data-revision="${pageRevision}"></script>`;
          return new Response((await file.text()).replace("</body>", `${script}</body>`), {
            headers: { "Cache-Control": "no-store", "Content-Type": "text/html; charset=utf-8" },
          });
        }
        return new Response(file, { headers: { "Cache-Control": "no-store" } });
      },
      hostname: "127.0.0.1",
      port,
    }),
  )
  .catch(async (error: unknown) => {
    await backend?.stop();
    throw error;
  });
console.log(`Preview: http://localhost:${server.port}${base}/`);
if (watching) {
  console.log(`Watching site sources and ${cardgameSource}. Browser reload is automatic.`);
}
const stop = async (): Promise<void> => {
  await server.stop(true);
  await backend?.stop();
  process.exit(0);
};
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void stop().catch((error: unknown) => {
      console.error("Could not stop the development preview:", error);
      process.exit(1);
    });
  });
}
