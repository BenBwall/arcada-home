import { extname, join, resolve, sep } from "node:path";
import { watch } from "node:fs";

const DEFAULT_PORT = 4173;
const BAD_REQUEST = 400;
const REDIRECT = 302;
const NOT_FOUND = 404;

const root = resolve(import.meta.dirname, "..");
const output = join(root, "build");
const base = (process.env.BASE_PATH ?? "/~bergenwb").replace(/\/$/, "");
const port = Number(process.env.PORT ?? DEFAULT_PORT);
const watching = process.argv.includes("--watch");
let building = false;

const rebuild = (): void => {
  if (building) {
    return;
  }
  building = true;
  try {
    const result = Bun.spawnSync([process.execPath, "run", "build"], {
      cwd: root,
      stderr: "inherit",
      stdout: "inherit",
    });
    if (result.exitCode !== 0) {
      console.error("Build failed; fix the reported error and save again.");
    }
  } finally {
    building = false;
  }
};

if (watching) {
  rebuild();
}

const server = Bun.serve({
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
    return new Response(file, { headers: { "Cache-Control": "no-store" } });
  },
  hostname: "127.0.0.1",
  port,
});
console.log(`Preview: http://127.0.0.1:${server.port}${base}/`);

if (watching) {
  const debounceMs = 150;
  let timer: ReturnType<typeof setTimeout> | undefined;
  for (const directory of ["src", "static", "vendor/cardgame/src"]) {
    watch(join(root, directory), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(rebuild, debounceMs);
    });
  }
  console.log("Watching source and static files. Refresh the browser after each build.");
}
