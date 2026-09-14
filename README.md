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

- `src/pages/`: build-time Lit templates for Home, Resume, and Projects. They produce normal HTML with no client router or page hydration.
- `src/lib/components/`: interactive `AppearancePanel`, `ThemeEditor`, and `ColorPicker` Lit elements, plus shared templates. Interactive styles are isolated by Shadow DOM; static page styles use readable class selectors.
- `src/lib/theme/`: shared color handling, palette definitions, and the existing saved-theme format.
- `src/styles/`: standalone CSS files used by pages and inside component shadow roots.
- `scripts/static-build.mts`: static renderer and output writer.
- `scripts/lit-vendor.mts`: the entry point for the separate Lit library bundle.

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
```

Application TypeScript is emitted as modern ES modules: types are removed, but class names, method names, imports, comments, and template literals remain readable. An import map resolves the shared aliases in browsers. Application modules are not bundled or minified. Lit and its hydration support are bundled separately; third-party internal names may still be short because that is how the packages are distributed.

The release directory is a deterministic content hash. Filenames within it remain descriptive, and an older open page keeps referencing a complete set of matching assets during deployment. Use the current page's script URL or `_app/version.json` to find the active release.

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
