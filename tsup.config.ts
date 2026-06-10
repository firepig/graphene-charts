import { copyFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  treeshake: true,
  async onSuccess() {
    // Copy the theming CSS variables file
    copyFileSync("src/themes.css", "dist/themes.css");

    // Compile Tailwind v4 → dist/styles.css (standalone, no Tailwind required)
    execSync(
      "npx @tailwindcss/cli -i src/styles.css -o dist/styles.css --minify",
      { stdio: "inherit" }
    );
  },
});
