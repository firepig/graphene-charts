import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  // VITE_BASE_URL is set by the GitHub Actions workflow to "/<repo-name>/".
  // Falls back to "/" for local dev.
  base: process.env.VITE_BASE_URL ?? "/",
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "visx-charts": path.resolve(__dirname, "../src"),
    },
  },
});
