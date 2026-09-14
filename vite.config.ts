import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";
export default defineConfig({
  build: {
    cssMinify: false,
    minify: false,
    // Preserve modern JavaScript syntax for readable browser output.
    target: "esnext",
  },
  plugins: [sveltekit()],
});
