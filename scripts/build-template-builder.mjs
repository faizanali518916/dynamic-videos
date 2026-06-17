import esbuild from "esbuild";
import { dirname, resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  external: ["../public/*.otf"],
  bundle: true,
  entryPoints: [resolve(root, "src/templateBuilderPage.tsx")],
  loader: {
    ".json": "json",
  },
  outfile: resolve(root, "public/template-builder.js"),
  platform: "browser",
  sourcemap: true,
});

const cssPath = resolve(root, "public/template-builder.css");
const css = await readFile(cssPath, "utf8");

await writeFile(
  cssPath,
  css
    .replaceAll("url(../public/gued.otf)", "url(./gued.otf)")
    .replaceAll("url(../public/gued-bold.otf)", "url(./gued-bold.otf)"),
  "utf8",
);
