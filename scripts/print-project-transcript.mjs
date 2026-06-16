import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const ROOT_DIR = process.cwd();
const PROJECTS_DIR = path.join(ROOT_DIR, "src", "projects");

const { projectNameArg } = parseArgs(process.argv.slice(2));

let projectName = projectNameArg;
let projectDir;
let captionsPath;

main().catch((err) => {
  fail(err?.stack || err?.message || String(err));
});

async function main() {
  if (!projectName) {
    projectName = await selectProjectInteractive();
  }

  projectDir = path.join(PROJECTS_DIR, projectName);
  captionsPath = path.join(projectDir, "captions.json");

  assertProjectExists();
  assertCaptionsExist();

  const captions = readCaptionsJson();
  const transcript = captionsToText(captions);

  if (!transcript) {
    fail("captions.json was found, but no transcript text could be generated.");
  }

  console.log("");
  console.log("=== TRANSCRIPT ===");
  console.log("");
  console.log(transcript);
  console.log("");
}

function parseArgs(args) {
  const positional = [];

  for (const arg of args) {
    positional.push(arg);
  }

  return {
    projectNameArg: positional[0] ?? null,
  };
}

async function selectProjectInteractive() {
  const projects = getProjectFolders();

  if (projects.length === 0) {
    fail(
      [
        "No project folders found.",
        "",
        "Expected project folders inside:",
        `  ${PROJECTS_DIR}`,
      ].join("\n"),
    );
  }

  if (!process.stdin.isTTY || !process.stdin.setRawMode) {
    console.log("");
    console.log("Available projects:");

    for (const project of projects) {
      const status = project.hasCaptions ? "" : " [missing captions.json]";
      console.log(`- ${project.name}${status}`);
    }

    fail(
      [
        "",
        "Interactive selection is not supported in this terminal.",
        "Run the script with a project name instead:",
        "",
        "  node scripts/print-project-transcript.mjs <project-name>",
      ].join("\n"),
    );
  }

  let selectedIndex = 0;

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);

    process.stdin.setRawMode(true);
    process.stdin.resume();

    const render = () => {
      console.clear();

      console.log("Select project");
      console.log("");
      console.log("Use ↑ / ↓ then press Enter.");
      console.log("");

      projects.forEach((project, index) => {
        const isSelected = index === selectedIndex;
        const prefix = isSelected ? ">" : " ";
        const captionsStatus = project.hasCaptions
          ? `  [${project.captionCount} captions]`
          : "  [missing captions.json]";

        console.log(`${prefix} ${project.name}${captionsStatus}`);
      });

      console.log("");
      console.log("Press Ctrl+C to cancel.");
    };

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.off("keypress", onKeypress);
      console.clear();
    };

    const onKeypress = (_str, key) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        process.exit(130);
      }

      if (key.name === "up") {
        selectedIndex =
          selectedIndex === 0 ? projects.length - 1 : selectedIndex - 1;
        render();
        return;
      }

      if (key.name === "down") {
        selectedIndex =
          selectedIndex === projects.length - 1 ? 0 : selectedIndex + 1;
        render();
        return;
      }

      if (key.name === "return") {
        const selectedProject = projects[selectedIndex];

        cleanup();

        console.log(`Selected project: ${selectedProject.name}`);

        resolve(selectedProject.name);
      }
    };

    process.stdin.on("keypress", onKeypress);

    render();
  });
}

function getProjectFolders() {
  if (!fs.existsSync(PROJECTS_DIR)) {
    fail(
      [
        "Projects directory not found.",
        "",
        "Expected:",
        `  ${PROJECTS_DIR}`,
      ].join("\n"),
    );
  }

  return fs
    .readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const folder = path.join(PROJECTS_DIR, entry.name);
      const captionsFile = path.join(folder, "captions.json");

      let captionCount = 0;

      if (fs.existsSync(captionsFile)) {
        try {
          const raw = fs.readFileSync(captionsFile, "utf8");
          const json = JSON.parse(raw);
          const captions = extractCaptionsArray(json);
          captionCount = captions.length;
        } catch {
          captionCount = 0;
        }
      }

      return {
        name: entry.name,
        folder,
        hasCaptions: fs.existsSync(captionsFile),
        captionCount,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function assertProjectExists() {
  if (!fs.existsSync(projectDir)) {
    fail(`Project folder not found: ${projectDir}`);
  }

  if (!fs.statSync(projectDir).isDirectory()) {
    fail(`Project path exists but is not a folder: ${projectDir}`);
  }
}

function assertCaptionsExist() {
  if (!fs.existsSync(captionsPath)) {
    fail(
      [
        "captions.json not found in project folder.",
        "",
        "Expected:",
        `  ${captionsPath}`,
        "",
        "Generate captions first, then run this script again.",
      ].join("\n"),
    );
  }
}

function readCaptionsJson() {
  let json;

  try {
    const raw = fs.readFileSync(captionsPath, "utf8");
    json = JSON.parse(raw);
  } catch (error) {
    fail(
      [
        "Failed to read or parse captions.json.",
        "",
        `File: ${captionsPath}`,
        "",
        error.message,
      ].join("\n"),
    );
  }

  const captions = extractCaptionsArray(json);

  if (!Array.isArray(captions)) {
    fail(
      [
        "Invalid captions.json format.",
        "",
        "Expected either:",
        "  Caption[]",
        "",
        "Or:",
        '  { "captions": Caption[] }',
      ].join("\n"),
    );
  }

  return captions;
}

function extractCaptionsArray(json) {
  if (Array.isArray(json)) {
    return json;
  }

  if (json && Array.isArray(json.captions)) {
    return json.captions;
  }

  return null;
}

function captionsToText(captions) {
  return captions
    .map((caption) => {
      if (!caption || typeof caption.text !== "string") {
        return "";
      }

      return caption.text;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function fail(message) {
  console.error("");
  console.error("ERROR");
  console.error(message);
  process.exit(1);
}
