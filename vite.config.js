import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Cloudflare serves the site at the domain root ("/"). The GitHub Pages workflow
// sets BASE_PATH=/atom360sales/ because Pages serves it under the repo name.
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        telecaller: resolve(__dirname, "telecaller.html"),
        sales: resolve(__dirname, "sales.html"),
        manager: resolve(__dirname, "manager.html"),
      },
    },
  },
});
