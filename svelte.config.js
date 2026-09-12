import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    paths: {
      base: process.env.BASE_PATH ?? (process.env.NODE_ENV === "production" ? "/~bergenwb" : ""),
    },
  },
  preprocess: vitePreprocess(),
};
export default config;
