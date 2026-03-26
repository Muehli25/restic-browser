import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 1024,
  },
});
