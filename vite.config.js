import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// GitHub Pages serves this repo at /atom360sales/
export default defineConfig({
  base: "/atom360sales/",
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
