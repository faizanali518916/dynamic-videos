import fs from "node:fs";
import { getProjectFolders, readJsonFile, relativeToRoot } from "./project-workflow.mjs";

async function main() {
  const projects = getProjectFolders().filter(({ hasTemplate }) => hasTemplate);

  if (projects.length === 0) {
    fail("No project folders with template.json were found in src/projects.");
  }

  for (const paths of projects) {
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
        `${paths.name}: video.mp4 is required because template.videoBased is true.`,
      );
    }

    if (template && template.caption === true) {
      assertFileExists(
        paths.tokensPath,
        `${paths.name}: tokens.json is required because template.caption is true.`,
      );
    }
  }

  console.log(`Preflight OK: ${projects.length} project(s) ready for dev.`);
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
