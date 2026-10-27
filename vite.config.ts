import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
// @ts-expect-error Shared build configuration is plain JavaScript.
import { readConfig } from "./scripts/config.mjs";

export default defineConfig(({ mode }) => {
  const config = readConfig(mode);
  return {
  define: { "import.meta.env.VITE_AUTH_REDIRECT_URL": JSON.stringify(`${config.urlScheme}://auth`) },
  base: "./",
  optimizeDeps: { entries: ["index.html"] },
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  build: {
    assetsInlineLimit: 1000000,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { inlineDynamicImports: true },
      onwarn(warning, warn) {
        if (warning.code && ["MODULE_LEVEL_DIRECTIVE", "SOURCEMAP_ERROR"].includes(warning.code)) return;
        warn(warning);
      },
    },
  },
};
});
