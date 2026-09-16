# Arcada home — Lit

A static portfolio built with Lit templates and reactive Web Components. Domus only serves files; it does not need a JavaScript server.

The previous Svelte application is preserved on `codex/svelte-archive` at commit `94a7121`.

## Development

Requires Bun 1.4.2 or newer.

```powershell
git submodule update --init --recursive
bun install --frozen-lockfile
bun run dev
```

Open `http://localhost:4173/~bergenwb/`. Saving site sources, static files, or card-game sources rebuilds the preview and automatically reloads open browser tabs. Games and settings are saved in browser storage and restored after each reload.

When the sibling `../cardgame-lit/src` checkout exists, `bun run dev` reads and watches it directly, including uncommitted edits, new files, and atomic saves. Otherwise it uses `vendor/cardgame/src`. Set `CARDGAME_SOURCE_DIR` to choose another source directory. No hardlinks, junctions, or submodule updates are needed to preview game edits.

Development builds use alternating directories under `.cache/dev-preview/<port>/`, switching the server to new output only after a successful build. A failed build leaves the previous preview available, and a save during a build queues another build. The development reload script is injected by the server; it is never added to published HTML. `bun run build` and deployment always use the pinned submodule and write to `build/`.

Browser tests use port 4174 for the production preview and 4176 for the live-reload check, leaving your development browser on 4173 alone.

The homepage embeds the `CardGame` root component from [BenBwall/cardgame-lit](https://github.com/BenBwall/cardgame-lit), pinned as a Git submodule at `vendor/cardgame`. Choose a free-play table (draw, sort, play, undo, and reshuffle), Shithead against a local computer opponent, or anonymous online multiplayer. Local games and their settings survive mode changes and reloads through browser storage. Online play uses a separate authoritative Bun server, room codes, freely colliding display names, and memory-only player credentials. Transient disconnects recover automatically; reloading loses that anonymous session. JavaScript is required only for the interactive game; the rest of the homepage remains static.

`bun run dev` starts a local multiplayer server at `http://127.0.0.1:8787` and connects the preview automatically. It reuses an existing backend and stops only one it started. Set `MULTIPLAYER_PORT` to change the local game port, or `MULTIPLAYER_DEV_URL` to use another server. Set `MULTIPLAYER_PROD_URL` to your hosted server's HTTPS origin before a production build. `MULTIPLAYER_URL` overrides either mode; an explicitly empty value disables online play. Copy [.env.example](.env.example) to `.env` for optional overrides. Restart development after changing environment variables or backend code.

Production has no localhost fallback. Without a configured production URL, the online lobby displays an unavailable message while local games work normally. Domus remains entirely static at `https://people.arcada.fi/~bergenwb/`. The separately hosted backend uses HTTPS/WSS; `MULTIPLAYER_ORIGINS` configures the exact allowed browser origins and defaults to `https://people.arcada.fi` in production. Player credentials are independent of that shared origin. See [the server configuration and deployment guide](vendor/cardgame/server/README.md). No production backend is provisioned by the development launcher.

The `$cardgame` alias imports the submodule's `src/index.ts` for production. Development supplies the selected local checkout through the same browser import map. The static build emits game sources as readable ES modules beside the shared Lit bundle and includes them in the release hash. No CDN is used; the configurable game API is contacted only when entering an online room. Run the game's checks independently in the game checkout with `bun run check`, `bun test tests`, and `bun run test:browser`. Multiplayer server files remain outside the browser source tree and are never included in the static site.

```powershell
bun run build          # Clean static build into build/
bun run preview        # Serve an existing build without caching
bun run check          # Lint, W3C HTML/CSS validation, and TypeScript checks
bun test               # Theme schema and validator unit tests
bun run test           # Build and run browser tests in Microsoft Edge
```

`BASE_PATH` defaults to `/~bergenwb`. Set it to an empty string when hosting at the domain root; build and preview must use the same value.

## Source and output

- `src/pages/`: build-time Lit templates with their CSS in the same file. `layout.ts` owns the document shell and global styles. Pages produce normal HTML with no client router or page hydration.
- `src/lib/components/`: each interactive Lit element contains its logic, HTML template, and `static styles = css` block. Shadow DOM scopes those styles. Shared controls use `controlStyles` from `shared-ui.ts`; static header and project-row templates also keep their CSS in the same file.
- `src/lib/theme/`: shared color handling and the existing saved-theme format. `built-in-themes.ts` keeps the palette definitions and their CSS together.
- `scripts/static-build.mts`: static renderer and output writer.
- `scripts/lit-vendor.mts`: the entry point for the separate Lit library bundle.
- `scripts/lucide-vendor.mts`: imports only `SunMoon`, `X`, and the SVG builder from the official `@lucide/icons` dependency. Icon wrappers in `shared-ui.ts` use this package for both static rendering and hydration.

Write ordinary CSS inside Lit’s `css` tagged templates; no additional CSS-in-JS library is needed. The build includes static page and global styles directly in each document to avoid render-blocking CSS requests, and also exports readable CSS files for inspection. Interactive component styles stay with their JavaScript and are included in server-rendered shadow roots so they work before JavaScript loads.

Each build creates:

```text
build/
  index.html
  resume/index.html
  projects/index.html
  _app/version.json
  _app/<release>/
    client.js
    lib/components/appearance-panel.js
    lib/components/theme-editor.js
    lib/components/color-picker.js
    lib/theme/...
    styles/...
    vendor/lit.js
    vendor/lucide.js
```

Application TypeScript is emitted as modern ES modules: types are removed, but class names, method names, imports, comments, and template literals remain readable. An import map resolves the shared aliases in browsers. Interactive application modules are not bundled or minified. The build also creates a readable, synchronous head script from `src/theme-start.ts` and the shared preference logic. It applies saved colors before the page can paint, including custom themes and older saved settings. This bootstrap needs no external requests and does not initialize Lit. Lit and its hydration support are bundled separately; third-party internal names may still be short because that is how the packages are distributed.

The build generates responsive AVIF versions with WebP fallbacks of the original photos with Sharp. The first photo gets high fetch priority, and module preload links avoid waiting for each level of JavaScript imports. Each page includes its own search description.

The release directory is a deterministic content hash, including the original image bytes. Filenames within it remain descriptive, and an older open page keeps referencing a complete set of matching assets during deployment. Use the current page's script URL or `_app/version.json` to find the active release. Apache receives a one-year immutable cache policy inside each versioned directory; HTML and version metadata are revalidated. The local development server deliberately disables caching.

Lit SSR produces declarative Shadow DOM for the initial appearance panel. Its content and styles render before JavaScript, and Lit attaches behavior to the existing nodes. Small hydration comments inside that component are required. Static page templates do not emit hydration comments. The build formats the static HTML, JavaScript, and CSS. It preserves the server-rendered appearance panel and JavaScript template-literal whitespace exactly so server and browser hydration stay consistent.

Lit SSR is currently a Lit Labs package. No SSR process runs on Domus: rendering happens during the local build, and the output is tested with and without JavaScript. Modern browsers with ES modules, import maps, and declarative Shadow DOM are required.

## Deploy to Domus

After committing changes to `main`:

```powershell
git push origin main
```

The existing origin push URLs publish the commit to GitHub and to the Domus Git receiver. Its hooks build the exact pushed revision in a fresh directory, validate it, then copy assets before HTML to `H:\html`. Existing unrelated files and older assets are preserved.

The receiver exports the exact submodule commits recorded in the pushed tree, fetching their public HTTPS repositories during the build. Commit and push game changes in `vendor/cardgame` before updating the parent gitlink. After first adding this submodule, refresh the installed deployment hooks with `bun run deploy:setup --no-remote-changes` before the next deployment.

Persistent deployment settings live in the tracked `.env.domus` file at the root of your local `arcada-home` checkout. Setup records its absolute path so every deployment (including cardgame pushes and retries) reads the same file, even when building an isolated checkout. Values in it override matching shell variables; comments, quoted values, and explicitly empty values are supported. Values are literal, without shell commands or variable expansion. The file is never copied into the website. The deployment's `BASE_PATH` remains `/~bergenwb`.

The deployment scripts run on your Windows computer and read this local file before publishing to the mapped drive. Domus only serves the resulting static files; it does not read environment variables at request time. If you move the checkout, rerun both `bun run deploy:setup --no-remote-changes` and `bun run deploy:cardgame:setup` to refresh the paths and hooks.

For the Railway backend, put its public HTTPS origin in that file:

```dotenv
MULTIPLAYER_PROD_URL=https://YOUR-SERVICE.up.railway.app
```

Keep `MULTIPLAYER_URL` unset unless you want it to override the mode-specific URL; an empty `MULTIPLAYER_URL` disables online play. Editing this file takes effect on the next deployment without restarting your terminal. Local development continues to use the checkout's own environment files.

To rebuild and republish the latest main already in the Domus receiver, including changes to `.env.domus`:

```powershell
bun run deploy
```

After changing deployment scripts, refresh the installed hooks once:

```powershell
bun run deploy:setup --no-remote-changes
```

Setup adds an exact Git `safe.directory` entry for the receiver's resolved network path. A push can also apply that trust to the receiver for a single command:

```powershell
git push --receive-pack='git -c safe.directory=H:/.arcada-home-deploy.git receive-pack' domus main
```

The deployment cache, generated output, browser artifacts, and logs are not committed. The browser tests cover static content without JavaScript, responsive layouts, hydration, navigation, appearance synchronization, and theme editing/import/export.

## Deploy after cardgame pushes

On this computer, `git push origin main` from `GitRepo/cardgame-lit` or `vendor/cardgame` pushes to GitHub first and then to `H:\.cardgame-lit-deploy.git`. Its main-only receive hooks update the homepage's game pin in an isolated clone, push that commit to `arcada-home/main` on GitHub, and push to the existing Domus receiver for validation and publishing. Local working trees are not changed by the hooks. Other branches and tags do not deploy. H: and GitHub access must be available.

Install or refresh this setup from the homepage checkout:

```powershell
bun run deploy:setup --no-remote-changes
bun run deploy:cardgame:setup
```

The setup configures both existing game checkouts. Use `--checkout C:\path\to\cardgame-lit` for a different standalone checkout. This is local Git configuration; pushes made from other computers or directly to the GitHub URL do not trigger the Domus receiver.

If a push publishes to GitHub but deployment fails, retry from `arcada-home` with `bun run deploy:cardgame`. The command uses current GitHub main, avoids duplicate pin commits, and repairs a previous failed publication even if the receiver already has the commit. A post-receive error cannot undo an accepted Git push, so check the terminal's deployment result. Failed builds retain diagnostics and do not replace the live site.

After the automatic pin update, bring this checkout up to date before your next homepage edit or push:

```powershell
git pull --ff-only origin main
git submodule update --init --recursive
```
