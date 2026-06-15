import esbuild from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  bundle: true,
  entryPoints: [resolve(root, "src/templateBuilderPage.tsx")],
  loader: {
    ".json": "json",
  },
  outfile: resolve(root, "public/template-builder.js"),
  platform: "browser",
  sourcemap: true,
});
