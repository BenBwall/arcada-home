import adapter from "@sveltejs/adapter-static";
import pathConfig from "./tsconfig.paths.json" with { type: "json" };
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    // SvelteKit generates matching Vite and TypeScript aliases from the shared paths.
    alias: Object.fromEntries(
      Object.entries(pathConfig.compilerOptions.paths).map(([name, [target]]) => [
        name.replace(/\/\*$/, ""),
        target.replace(/\/\*$/, ""),
      ]),
    ),
    paths: {
      base: process.env.BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/~bergenwb" : ""),
    },
  },
  preprocess: vitePreprocess(),
};
export default config;
