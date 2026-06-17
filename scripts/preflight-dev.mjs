import fs from "node:fs";
import { getProjectPaths, readJsonFile, relativeToRoot } from "./project-workflow.mjs";

const PROJECT_NAME = "process-optimization";
const paths = getProjectPaths(PROJECT_NAME);

async function main() {
  assertFileExists(paths.templatePath, "template.json");

  let template;

  try {
    template = readJsonFile(paths.templatePath);
  } catch (error) {
    fail(
      [
        "Failed to read or parse template.json.",
        "",
        `File: ${paths.templatePath}`,
        "",
        error.message,
      ].join("\n"),
    );
  }

  if (template && template.videoBased === true) {
    assertFileExists(
      paths.videoPath,
      "video.mp4 is required because template.videoBased is true.",
    );
  }

  if (template && template.caption === true) {
    assertFileExists(
      paths.tokensPath,
      "tokens.json is required because template.caption is true.",
    );
  }

  console.log(
    `Preflight OK: ${relativeToRoot(paths.templatePath)} is ready for dev.`,
  );
}

main().catch((err) => {
  fail(err?.stack || err?.message || String(err));
});

function assertFileExists(filePath, reason) {
  if (fs.existsSync(filePath)) {
    return;
  }

  fail(
    [
      reason,
      "",
      "Missing:",
      `  ${filePath}`,
    ].join("\n"),
  );
}

function fail(message) {
  console.error("");
  console.error("ERROR");
  console.error(message);
  process.exit(1);
}
