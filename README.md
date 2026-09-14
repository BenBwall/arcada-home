# Arcada home — Lit

A static portfolio built with Lit templates and reactive Web Components. Domus only serves files; it does not need a JavaScript server.

The previous Svelte application is preserved on `codex/svelte-archive` at commit `94a7121`.

## Development

Requires Bun 1.4.2 or newer.

```powershell
bun install --frozen-lockfile
bun run dev
```

Open `http://127.0.0.1:4173/~bergenwb/`. Saving files under `src` or `static` rebuilds the site. Refresh the browser to see the new output.

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

To rebuild and republish the latest main already in the Domus receiver:

```powershell
bun run deploy
```

After changing deployment scripts, refresh the installed hooks once:

```powershell
bun run deploy:setup --no-remote-changes
```

Git on Windows may require trusting the receiver's ownership. A push can apply that trust to the receiver for a single command:

```powershell
git push --receive-pack='git -c safe.directory=H:/.arcada-home-deploy.git receive-pack' domus main
```

The deployment cache, generated output, browser artifacts, and logs are not committed. The browser tests cover static content without JavaScript, responsive layouts, hydration, navigation, appearance synchronization, and theme editing/import/export.
